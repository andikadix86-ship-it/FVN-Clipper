import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { loadEnvFile } from "node:process";
import { URL } from "node:url";

try {
  loadEnvFile();
} catch {
  // Missing .env is handled by the Prisma fallback and returned as JSON.
}

const { getCategories, getCompetitors, getOpportunities, setOpportunitySaved } = await import("../src/modules/ai-clip-intelligence/ai-clip-service");
const { getDashboardCampaigns, getDashboardOverview, getDashboardRecommendations, getPublishingCalendar } = await import("../src/modules/dashboard/dashboard-service");

const PORT = Number(process.env.API_PORT ?? 3001);

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

  if (method === "GET" && pathname === "/api/dashboard/overview") {
    sendJson(response, { success: true, data: await getDashboardOverview() });
    return;
  }

  if (method === "GET" && pathname === "/api/dashboard/recommendations") {
    sendJson(response, { success: true, data: await getDashboardRecommendations() });
    return;
  }

  if (method === "GET" && pathname === "/api/dashboard/campaigns") {
    sendJson(response, { success: true, data: await getDashboardCampaigns() });
    return;
  }

  if (method === "GET" && pathname === "/api/dashboard/publishing-calendar") {
    sendJson(response, {
      success: true,
      data: await getPublishingCalendar({
        platform: requestUrl.searchParams.get("platform"),
        status: requestUrl.searchParams.get("status"),
        date: requestUrl.searchParams.get("date")
      })
    });
    return;
  }

  if (method === "GET" && pathname === "/api/ai-clip-intelligence/categories") {
    sendJson(response, { success: true, data: await getCategories() });
    return;
  }

  if (method === "GET" && pathname === "/api/ai-clip-intelligence/opportunities") {
    sendJson(response, {
      success: true,
      data: await getOpportunities({
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
    });
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

    sendJson(response, { success: true, data });
    return;
  }

  if (method === "GET" && pathname === "/api/ai-clip-intelligence/competitors") {
    sendJson(response, {
      success: true,
      data: await getCompetitors({
        platform: requestUrl.searchParams.get("platform"),
        niche: requestUrl.searchParams.get("niche")
      })
    });
    return;
  }

  sendJson(response, { success: false, data: null, error: "API endpoint not found" }, 404);
}

function sendJson(response: ServerResponse, body: unknown, status = 200) {
  response.writeHead(status, {
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,PATCH,OPTIONS",
    "access-control-allow-origin": "*",
    "content-type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(body));
}

function sendError(response: ServerResponse, error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected API error";
  const status = message.includes("Database belum dikonfigurasi") ? 503 : 500;
  sendJson(response, { success: false, data: null, error: message }, status);
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
