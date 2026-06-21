import "dotenv/config";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { config as loadDotenv } from "dotenv";
import { getHttpStatus, sanitizeSecret, toApiErrorPayload } from "../src/modules/http/api-error";

const PROJECT_ENV_PATH = fileURLToPath(new URL("../.env", import.meta.url));
const envLoadResult = loadDotenv({ path: PROJECT_ENV_PATH, override: true, quiet: true });

if (envLoadResult.error && !existsSync(PROJECT_ENV_PATH)) {
  console.warn(`[FVN API env] ENV belum terbaca dari project root: ${sanitizeSecret(envLoadResult.error.message)}`);
}

const { getCategories, getCompetitors, getOpportunities, scanYouTubeOpportunities, setOpportunitySaved } = await import("../src/modules/ai-clip-intelligence/ai-clip-service");
const { generateAiFeatureContent } = await import("../src/modules/ai/ai-feature-service");
const { getAiProviderPublicStatus } = await import("../src/modules/ai/ai-provider");
const { getConnectionStatus } = await import("../src/modules/connections/connection-status");
const { getDashboardCampaigns, getDashboardOverview, getDashboardRecommendations, getPublishingCalendar } = await import("../src/modules/dashboard/dashboard-service");

const PORT = Number(process.env.API_PORT ?? 3001);

logSafeEnvStatus();

type JsonBody = Record<string, unknown>;

const server = createServer(async (request, response) => {
  try {
    await routeRequest(request, response);
  } catch (error) {
    sendError(response, error);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`FVN API server listening on http://127.0.0.1:${PORT}`);
});

async function routeRequest(request: IncomingMessage, response: ServerResponse) {
  const method = request.method ?? "GET";
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? `127.0.0.1:${PORT}`}`);
  const pathname = requestUrl.pathname;

  if (method === "OPTIONS") {
    sendJson(response, { success: true, data: null });
    return;
  }

  if (method === "GET" && pathname === "/api/health") {
    sendJson(response, { success: true, data: { ok: true } });
    return;
  }

  if (method === "GET" && pathname === "/api/ai/provider/status") {
    sendData(response, getAiProviderPublicStatus());
    return;
  }

  if (method === "GET" && pathname === "/api/connections/status") {
    sendData(response, await getConnectionStatus());
    return;
  }

  if (method === "POST" && pathname === "/api/ai/generate") {
    const body = await readJsonBody(request);
    sendData(response, await generateAiFeatureContent(body));
    return;
  }

  if (method === "GET" && pathname === "/api/dashboard/overview") {
    sendData(response, await getDashboardOverview());
    return;
  }

  if (method === "GET" && pathname === "/api/dashboard/recommendations") {
    sendData(response, await getDashboardRecommendations());
    return;
  }

  if (method === "GET" && pathname === "/api/dashboard/campaigns") {
    sendData(response, await getDashboardCampaigns());
    return;
  }

  if (method === "GET" && pathname === "/api/dashboard/publishing-calendar") {
    sendData(
      response,
      await getPublishingCalendar({
        platform: requestUrl.searchParams.get("platform"),
        status: requestUrl.searchParams.get("status"),
        date: requestUrl.searchParams.get("date")
      })
    );
    return;
  }

  if (method === "GET" && pathname === "/api/ai-clip-intelligence/categories") {
    sendData(response, await getCategories());
    return;
  }

  if (method === "POST" && pathname === "/api/ai-clip-intelligence/scan") {
    const body = await readJsonBody(request);
    sendData(response, await scanYouTubeOpportunities(body));
    return;
  }
  if (method === "GET" && pathname === "/api/ai-clip-intelligence/opportunities") {
    sendData(
      response,
      await getOpportunities({
        keyword: requestUrl.searchParams.get("keyword"),
        category: requestUrl.searchParams.get("category"),
        platform: requestUrl.searchParams.get("platform"),
        status: requestUrl.searchParams.get("status"),
        date: requestUrl.searchParams.get("date"),
        performance: requestUrl.searchParams.get("performance"),
        campaign: requestUrl.searchParams.get("campaign"),
        saved: requestUrl.searchParams.get("saved"),
        limit: requestUrl.searchParams.get("limit"),
        sort: requestUrl.searchParams.get("sort")
      })
    );
    return;
  }

  const saveMatch = pathname.match(/^\/api\/ai-clip-intelligence\/opportunities\/([^/]+)\/save$/);
  if (method === "PATCH" && saveMatch) {
    const body = await readJsonBody(request);
    const data = await setOpportunitySaved(decodeURIComponent(saveMatch[1]), typeof body.saved === "boolean" ? body.saved : undefined);

    if (!data) {
      sendJson(response, { success: false, data: null, error: "Opportunity not found" }, 404);
      return;
    }

    sendData(response, data, "message" in data && typeof data.message === "string" ? data.message : undefined);
    return;
  }

  if (method === "GET" && pathname === "/api/ai-clip-intelligence/competitors") {
    sendData(
      response,
      await getCompetitors({
        platform: requestUrl.searchParams.get("platform"),
        niche: requestUrl.searchParams.get("niche")
      })
    );
    return;
  }

  sendJson(response, { success: false, data: null, error: "API endpoint not found" }, 404);
}

function sendJson(response: ServerResponse, body: unknown, status = 200) {
  response.writeHead(status, {
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
    "access-control-allow-origin": "*",
    "content-type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(body));
}

function sendData(response: ServerResponse, data: unknown, message?: string) {
  const body: Record<string, unknown> = {
    success: true,
    data
  };

  if (message) {
    body.message = message;
  }

  sendJson(response, body);
}

function sendError(response: ServerResponse, error: unknown) {
  const payload = toApiErrorPayload(error);
  console.error(`[FVN API error] ${payload.status} ${payload.code}: ${sanitizeSecret(payload.technicalReason)}`);
  sendJson(response, payload, getHttpStatus(error));
}

async function readJsonBody(request: IncomingMessage): Promise<JsonBody> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as JsonBody;
  } catch {
    return {};
  }
}

function logSafeEnvStatus() {
  const envStatus = ["DATABASE_URL", "AI_API_KEY", "YOUTUBE_API_KEY"]
    .map((key) => `${key}=${process.env[key]?.trim() ? "present" : "missing"}`)
    .join(" ");

  console.log(`[FVN API env] ENV loaded: ${envStatus}`);
}

