import "dotenv/config";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { config as loadDotenv } from "dotenv";
import { getHttpStatus, sanitizeSecret, toApiErrorPayload } from "../src/modules/http/api-error";
import { prisma } from "../src/modules/db/prisma";

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

  const validPlatforms = ["YOUTUBE", "TIKTOK", "INSTAGRAM", "ALL", "FACEBOOK"];
  const validStatuses = ["DRAFT", "READY", "SCHEDULED", "POSTED", "FAILED", "REVIEW", "APPROVED", "REJECTED", "PUBLISHED", "PAUSED", "ARCHIVED"];
  const validPerformances = ["HIGH", "MEDIUM", "LOW"];
  const validSourceTypes = ["DEMO", "MANUAL", "CSV_IMPORT", "REAL_API"];

  if (method === "GET" && pathname === "/api/content-library") {
    const items = await prisma.contentLibraryItem.findMany({
      orderBy: { createdAt: "desc" }
    });
    sendData(response, items);
    return;
  }

  if (method === "POST" && pathname === "/api/content-library") {
    const body = await readJsonBody(request);
    const { title, category, platform, campaign, status, metric, date, performance, sourceType } = body;

    if (typeof title !== "string" || !title.trim()) {
      sendJson(response, { success: false, error: "title is required" }, 400);
      return;
    }
    if (typeof category !== "string" || !category.trim()) {
      sendJson(response, { success: false, error: "category is required" }, 400);
      return;
    }
    if (typeof platform !== "string" || !platform.trim() || !validPlatforms.includes(platform)) {
      sendJson(response, { success: false, error: `platform is required and must be one of: ${validPlatforms.join(", ")}` }, 400);
      return;
    }
    if (status !== undefined && (!validStatuses.includes(status as string))) {
      sendJson(response, { success: false, error: `status must be one of: ${validStatuses.join(", ")}` }, 400);
      return;
    }
    if (performance !== undefined && (!validPerformances.includes(performance as string))) {
      sendJson(response, { success: false, error: `performance must be one of: ${validPerformances.join(", ")}` }, 400);
      return;
    }
    if (sourceType !== undefined && (!validSourceTypes.includes(sourceType as string))) {
      sendJson(response, { success: false, error: `sourceType must be one of: ${validSourceTypes.join(", ")}` }, 400);
      return;
    }

    const newItem = await prisma.contentLibraryItem.create({
      data: {
        title: title.trim(),
        category: category.trim(),
        platform: platform as any,
        campaign: typeof campaign === "string" && campaign.trim() ? campaign.trim() : "Unassigned",
        status: (status as any) ?? "READY",
        metric: typeof metric === "string" ? metric : null,
        date: typeof date === "string" ? date : null,
        performance: (performance as any) ?? "MEDIUM",
        sourceType: (sourceType as any) ?? "REAL_API"
      }
    });

    sendData(response, newItem);
    return;
  }

  const patchMatch = pathname.match(/^\/api\/content-library\/([^/]+)$/);
  if (method === "PATCH" && patchMatch) {
    const id = decodeURIComponent(patchMatch[1]);
    const body = await readJsonBody(request);
    const { title, category, platform, campaign, status, metric, date, performance, sourceType } = body;

    if (title !== undefined && (typeof title !== "string" || !(title as string).trim())) {
      sendJson(response, { success: false, error: "title cannot be empty" }, 400);
      return;
    }
    if (category !== undefined && (typeof category !== "string" || !(category as string).trim())) {
      sendJson(response, { success: false, error: "category cannot be empty" }, 400);
      return;
    }
    if (platform !== undefined && (!validPlatforms.includes(platform as string))) {
      sendJson(response, { success: false, error: `platform must be one of: ${validPlatforms.join(", ")}` }, 400);
      return;
    }
    if (status !== undefined && (!validStatuses.includes(status as string))) {
      sendJson(response, { success: false, error: `status must be one of: ${validStatuses.join(", ")}` }, 400);
      return;
    }
    if (performance !== undefined && (!validPerformances.includes(performance as string))) {
      sendJson(response, { success: false, error: `performance must be one of: ${validPerformances.join(", ")}` }, 400);
      return;
    }
    if (sourceType !== undefined && (!validSourceTypes.includes(sourceType as string))) {
      sendJson(response, { success: false, error: `sourceType must be one of: ${validSourceTypes.join(", ")}` }, 400);
      return;
    }

    const existing = await prisma.contentLibraryItem.findUnique({ where: { id } });
    if (!existing) {
      sendJson(response, { success: false, error: "ContentLibraryItem not found" }, 404);
      return;
    }

    const updatedData: any = {};
    if (title !== undefined) updatedData.title = (title as string).trim();
    if (category !== undefined) updatedData.category = (category as string).trim();
    if (platform !== undefined) updatedData.platform = platform;
    if (campaign !== undefined) updatedData.campaign = typeof campaign === "string" ? campaign.trim() : "Unassigned";
    if (status !== undefined) updatedData.status = status;
    if (metric !== undefined) updatedData.metric = typeof metric === "string" ? metric : null;
    if (date !== undefined) updatedData.date = typeof date === "string" ? date : null;
    if (performance !== undefined) updatedData.performance = performance;
    if (sourceType !== undefined) updatedData.sourceType = sourceType;

    const updatedItem = await prisma.contentLibraryItem.update({
      where: { id },
      data: updatedData
    });

    sendData(response, updatedItem);
    return;
  }

  const deleteMatch = pathname.match(/^\/api\/content-library\/([^/]+)$/);
  if (method === "DELETE" && deleteMatch) {
    const id = decodeURIComponent(deleteMatch[1]);

    const existing = await prisma.contentLibraryItem.findUnique({ where: { id } });
    if (!existing) {
      sendJson(response, { success: false, error: "ContentLibraryItem not found" }, 404);
      return;
    }

    const archivedItem = await prisma.contentLibraryItem.update({
      where: { id },
      data: { status: "ARCHIVED" }
    });

    sendData(response, archivedItem);
    return;
  }


  // ─── Scheduler Entries ──────────────────────────────────────────────────────

  if (method === "GET" && pathname === "/api/scheduler") {
    const statusFilter = requestUrl.searchParams.get("status");
    const platformFilter = requestUrl.searchParams.get("platform");

    const where: Record<string, unknown> = {};
    if (statusFilter && validStatuses.includes(statusFilter)) {
      where.status = statusFilter;
    }
    if (platformFilter && validPlatforms.includes(platformFilter)) {
      where.platform = platformFilter;
    }

    const entries = await prisma.schedulerEntry.findMany({
      where,
      include: { contentLibrary: true },
      orderBy: { createdAt: "desc" }
    });
    sendData(response, entries);
    return;
  }

  if (method === "POST" && pathname === "/api/scheduler") {
    const body = await readJsonBody(request);
    const { title, platform, account, day, time, scheduledAt, status, contentLibraryId, sourceType } = body;

    if (typeof title !== "string" || !title.trim()) {
      sendJson(response, { success: false, error: "title is required" }, 400);
      return;
    }
    if (platform !== undefined && !validPlatforms.includes(platform as string)) {
      sendJson(response, { success: false, error: `platform must be one of: ${validPlatforms.join(", ")}` }, 400);
      return;
    }
    if (status !== undefined && !validStatuses.includes(status as string)) {
      sendJson(response, { success: false, error: `status must be one of: ${validStatuses.join(", ")}` }, 400);
      return;
    }
    if (sourceType !== undefined && !validSourceTypes.includes(sourceType as string)) {
      sendJson(response, { success: false, error: `sourceType must be one of: ${validSourceTypes.join(", ")}` }, 400);
      return;
    }

    // Validate contentLibraryId if provided
    if (contentLibraryId !== undefined && contentLibraryId !== null) {
      if (typeof contentLibraryId !== "string") {
        sendJson(response, { success: false, error: "contentLibraryId must be a string" }, 400);
        return;
      }
      const libItem = await prisma.contentLibraryItem.findUnique({ where: { id: contentLibraryId as string } });
      if (!libItem) {
        sendJson(response, { success: false, error: "contentLibraryId not found in ContentLibraryItem" }, 404);
        return;
      }
    }

    const entry = await prisma.schedulerEntry.create({
      data: {
        title: (title as string).trim(),
        platform: ((platform as any) ?? "ALL"),
        account: typeof account === "string" && account.trim() ? account.trim() : "TikTok A",
        day: typeof day === "string" && day.trim() ? day.trim() : "Mon",
        time: typeof time === "string" && time.trim() ? time.trim() : "19:00",
        scheduledAt: typeof scheduledAt === "string" && scheduledAt ? new Date(scheduledAt) : null,
        status: ((status as any) ?? "SCHEDULED"),
        contentLibraryId: typeof contentLibraryId === "string" ? contentLibraryId : null,
        sourceType: ((sourceType as any) ?? "REAL_API")
      },
      include: { contentLibrary: true }
    });

    sendData(response, entry);
    return;
  }

  const schedulerPatchMatch = pathname.match(/^\/api\/scheduler\/([^/]+)$/);
  if (method === "PATCH" && schedulerPatchMatch) {
    const id = decodeURIComponent(schedulerPatchMatch[1]);
    const body = await readJsonBody(request);
    const { title, platform, account, day, time, scheduledAt, status, sourceType } = body;

    if (title !== undefined && (typeof title !== "string" || !(title as string).trim())) {
      sendJson(response, { success: false, error: "title cannot be empty" }, 400);
      return;
    }
    if (platform !== undefined && !validPlatforms.includes(platform as string)) {
      sendJson(response, { success: false, error: `platform must be one of: ${validPlatforms.join(", ")}` }, 400);
      return;
    }
    if (status !== undefined && !validStatuses.includes(status as string)) {
      sendJson(response, { success: false, error: `status must be one of: ${validStatuses.join(", ")}` }, 400);
      return;
    }
    if (sourceType !== undefined && !validSourceTypes.includes(sourceType as string)) {
      sendJson(response, { success: false, error: `sourceType must be one of: ${validSourceTypes.join(", ")}` }, 400);
      return;
    }

    const existing = await prisma.schedulerEntry.findUnique({ where: { id } });
    if (!existing) {
      sendJson(response, { success: false, error: "SchedulerEntry not found" }, 404);
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = (title as string).trim();
    if (platform !== undefined) updateData.platform = platform;
    if (account !== undefined) updateData.account = typeof account === "string" ? account.trim() : "TikTok A";
    if (day !== undefined) updateData.day = typeof day === "string" ? day.trim() : existing.day;
    if (time !== undefined) updateData.time = typeof time === "string" ? time.trim() : existing.time;
    if (scheduledAt !== undefined) updateData.scheduledAt = typeof scheduledAt === "string" && scheduledAt ? new Date(scheduledAt) : null;
    if (status !== undefined) updateData.status = status;
    if (sourceType !== undefined) updateData.sourceType = sourceType;

    const updated = await prisma.schedulerEntry.update({
      where: { id },
      data: updateData,
      include: { contentLibrary: true }
    });

    sendData(response, updated);
    return;
  }

  const schedulerDeleteMatch = pathname.match(/^\/api\/scheduler\/([^/]+)$/);
  if (method === "DELETE" && schedulerDeleteMatch) {
    const id = decodeURIComponent(schedulerDeleteMatch[1]);

    const existing = await prisma.schedulerEntry.findUnique({ where: { id } });
    if (!existing) {
      sendJson(response, { success: false, error: "SchedulerEntry not found" }, 404);
      return;
    }

    // Soft delete: set status to ARCHIVED
    const archived = await prisma.schedulerEntry.update({
      where: { id },
      data: { status: "ARCHIVED" }
    });

    sendData(response, archived);
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

