import { generateAiText, getAiProviderPublicStatus } from "../ai/ai-provider";
import { testDatabaseConnection } from "../db/prisma";
import { classifyProviderError, sanitizeSecret, type ApiConnectionState } from "../http/api-error";

export interface ConnectionCheckResult {
  id: string;
  label: string;
  provider: string;
  kind: "database" | "ai" | "video_source" | "social" | "marketplace";
  status: ApiConnectionState;
  sourceType: "REAL_API";
  technicalReason: string;
  checkedAt: string;
  latencyMs?: number;
}

export interface ConnectionStatusSummary {
  mode: "REAL";
  sourceType: "REAL_API";
  generatedAt: string;
  checks: ConnectionCheckResult[];
  totals: Record<ApiConnectionState, number>;
}

type ServerEnv = Record<string, string | undefined>;

export async function getConnectionStatus(env: ServerEnv = getProcessEnv()): Promise<ConnectionStatusSummary> {
  const checks = await Promise.all([
    checkDatabase(),
    checkAiProvider(),
    checkYouTube(env),
    checkTikTok(env),
    checkMeta(env),
    checkTelegram(env),
    checkMarketplace(env)
  ]);

  return {
    mode: "REAL",
    sourceType: "REAL_API",
    generatedAt: new Date().toISOString(),
    checks,
    totals: checks.reduce<Record<ApiConnectionState, number>>(
      (totals, check) => {
        totals[check.status] += 1;
        return totals;
      },
      { CONNECTED: 0, FAILED: 0, NOT_CONNECTED: 0, UNSUPPORTED: 0 }
    )
  };
}

async function checkDatabase() {
  return timedCheck({
    id: "database",
    label: "Database",
    provider: "postgres",
    kind: "database",
    run: async () => {
      await testDatabaseConnection();
      return "Database connection OK.";
    }
  });
}

async function checkAiProvider() {
  const status = getAiProviderPublicStatus();
  const provider = status.activeProvider;
  const missing = status.providers.flatMap((item) => item.configured ? [] : item.missing.map((missingItem) => `${item.role}: ${missingItem}`));

  if (!status.providers.some((item) => item.configured)) {
    return result({
      id: "ai-provider",
      label: "AI Provider",
      provider,
      kind: "ai",
      status: "NOT_CONNECTED",
      technicalReason: missing.length ? `ENV belum terbaca: ${missing.join(", ")}.` : status.message
    });
  }

  return timedCheck({
    id: "ai-provider",
    label: "AI Provider",
    provider,
    kind: "ai",
    run: async () => {
      const response = await generateAiText({
        feature: "generic",
        messages: [
          { role: "system", content: "Connection test. Reply with OK only." },
          { role: "user", content: "OK" }
        ],
        maxTokens: 8,
        temperature: 0
      });

      const fallbackText = response.fallbackUsed ? ` Fallback provider used: ${response.provider}.` : "";
      return `AI provider connected: ${response.provider}/${response.model}.${fallbackText}`;
    }
  });
}

async function checkYouTube(env: ServerEnv) {
  const accessToken = envValue(env, "YOUTUBE_ACCESS_TOKEN", "GOOGLE_ACCESS_TOKEN");
  const apiKey = envValue(env, "YOUTUBE_API_KEY");

  if (!accessToken && !apiKey) {
    return result({
      id: "youtube-api",
      label: "YouTube API",
      provider: "youtube",
      kind: "video_source",
      status: "NOT_CONNECTED",
      technicalReason: "ENV belum terbaca: YOUTUBE_API_KEY atau YOUTUBE_ACCESS_TOKEN."
    });
  }

  return timedCheck({
    id: "youtube-api",
    label: "YouTube API",
    provider: "youtube",
    kind: "video_source",
    run: async () => {
      const url = accessToken
        ? "https://www.googleapis.com/youtube/v3/channels?part=id&mine=true&maxResults=1"
        : `https://www.googleapis.com/youtube/v3/search?part=id&type=video&maxResults=1&q=fvn&key=${encodeURIComponent(apiKey ?? "")}`;
      await fetchJson(url, accessToken ? { headers: { authorization: `Bearer ${accessToken}` } } : {});
      return accessToken ? "YouTube OAuth access token accepted." : "YouTube Data API key accepted.";
    }
  });
}

async function checkTikTok(env: ServerEnv) {
  const accessToken = envValue(env, "TIKTOK_ACCESS_TOKEN");
  const hasOAuthApp = hasAll(env, ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"]);

  if (!accessToken) {
    return result({
      id: "tiktok-api",
      label: "TikTok API",
      provider: "tiktok",
      kind: "social",
      status: "NOT_CONNECTED",
      technicalReason: hasOAuthApp ? "OAuth app ENV terbaca, tetapi TIKTOK_ACCESS_TOKEN belum tersedia atau expired." : "ENV belum terbaca: TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, atau TIKTOK_ACCESS_TOKEN."
    });
  }

  return timedCheck({
    id: "tiktok-api",
    label: "TikTok API",
    provider: "tiktok",
    kind: "social",
    run: async () => {
      await fetchJson("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name", {
        headers: { authorization: `Bearer ${accessToken}` }
      });
      return "TikTok access token accepted.";
    }
  });
}

async function checkMeta(env: ServerEnv) {
  const accessToken = envValue(env, "META_ACCESS_TOKEN", "FACEBOOK_ACCESS_TOKEN", "INSTAGRAM_ACCESS_TOKEN");
  const hasOAuthApp = hasAll(env, ["META_APP_ID", "META_APP_SECRET"]);

  if (!accessToken) {
    return result({
      id: "meta-api",
      label: "Meta / Instagram / Facebook API",
      provider: "meta",
      kind: "social",
      status: "NOT_CONNECTED",
      technicalReason: hasOAuthApp ? "OAuth app ENV terbaca, tetapi META_ACCESS_TOKEN/FACEBOOK_ACCESS_TOKEN/INSTAGRAM_ACCESS_TOKEN belum tersedia atau expired." : "ENV belum terbaca: META_APP_ID, META_APP_SECRET, atau access token Meta."
    });
  }

  return timedCheck({
    id: "meta-api",
    label: "Meta / Instagram / Facebook API",
    provider: "meta",
    kind: "social",
    run: async () => {
      await fetchJson("https://graph.facebook.com/v20.0/me?fields=id,name", {
        headers: { authorization: `Bearer ${accessToken}` }
      });
      return "Meta Graph access token accepted.";
    }
  });
}

async function checkTelegram(env: ServerEnv) {
  const token = envValue(env, "TELEGRAM_BOT_TOKEN");

  if (!token) {
    return result({
      id: "telegram-bot",
      label: "Telegram Bot",
      provider: "telegram",
      kind: "social",
      status: "NOT_CONNECTED",
      technicalReason: "ENV belum terbaca: TELEGRAM_BOT_TOKEN."
    });
  }

  return timedCheck({
    id: "telegram-bot",
    label: "Telegram Bot",
    provider: "telegram",
    kind: "social",
    run: async () => {
      await fetchJson(`https://api.telegram.org/bot${encodeURIComponent(token)}/getMe`);
      return "Telegram bot token accepted.";
    }
  });
}

async function checkMarketplace(env: ServerEnv) {
  const baseUrl = envValue(env, "MARKETPLACE_BASE_URL", "PROVIDER_MARKETPLACE_BASE_URL");
  const apiKey = envValue(env, "MARKETPLACE_API_KEY", "PROVIDER_MARKETPLACE_API_KEY");

  if (!baseUrl) {
    return result({
      id: "marketplace-provider",
      label: "Marketplace / Provider Registry",
      provider: "marketplace",
      kind: "marketplace",
      status: "UNSUPPORTED",
      technicalReason: "Provider belum support: MARKETPLACE_BASE_URL belum dikonfigurasi."
    });
  }

  return timedCheck({
    id: "marketplace-provider",
    label: "Marketplace / Provider Registry",
    provider: "marketplace",
    kind: "marketplace",
    run: async () => {
      await fetchJson(baseUrl, apiKey ? { headers: { authorization: `Bearer ${apiKey}` } } : {});
      return "Marketplace/provider endpoint reachable.";
    }
  });
}

async function timedCheck(input: {
  id: string;
  label: string;
  provider: string;
  kind: ConnectionCheckResult["kind"];
  run: () => Promise<string>;
}): Promise<ConnectionCheckResult> {
  const startedAt = performance.now();

  try {
    const technicalReason = await input.run();
    return result({
      id: input.id,
      label: input.label,
      provider: input.provider,
      kind: input.kind,
      status: "CONNECTED",
      technicalReason,
      latencyMs: Math.round(performance.now() - startedAt)
    });
  } catch (error) {
    const classified = classifyProviderError(error, input.provider);
    const attemptReason = getAttemptReason(error);
    const directReason = (error as { technicalReason?: unknown } | null)?.technicalReason;
    const status = toConnectionState((error as { status?: unknown } | null)?.status) ?? "FAILED";
    return result({
      id: input.id,
      label: input.label,
      provider: input.provider,
      kind: input.kind,
      status,
      technicalReason: attemptReason || (typeof directReason === "string" ? directReason : "") || `${classified.message} ${classified.technicalReason}`.trim(),
      latencyMs: Math.round(performance.now() - startedAt)
    });
  }
}

function getAttemptReason(error: unknown) {
  const attempts = (error as { attempts?: Array<{ provider?: string; role?: string; status?: string; reason?: string }> } | null)?.attempts;
  if (!attempts?.length) {
    return "";
  }

  return attempts.map((attempt) => [attempt.role, attempt.provider, attempt.status, attempt.reason].filter(Boolean).join(" ")).join("; ");
}

function toConnectionState(value: unknown): ApiConnectionState | undefined {
  return value === "CONNECTED" || value === "FAILED" || value === "NOT_CONNECTED" || value === "UNSUPPORTED" ? value : undefined;
}

function result(input: Omit<ConnectionCheckResult, "checkedAt" | "sourceType">): ConnectionCheckResult {
  return {
    ...input,
    sourceType: "REAL_API",
    technicalReason: sanitizeSecret(input.technicalReason),
    checkedAt: new Date().toISOString()
  };
}

async function fetchJson(url: string, init: RequestInit = {}) {
  const response = await fetchWithTimeout(url, init);
  const text = await response.text();

  if (!response.ok) {
    let reason = `${response.status} ${response.statusText}`;
    try {
      const parsed = JSON.parse(text) as { error?: { message?: string }; description?: string };
      reason = parsed.error?.message ?? parsed.description ?? reason;
    } catch {
      if (text.trim()) {
        reason = text.slice(0, 280);
      }
    }
    const error = new Error(reason) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return text ? JSON.parse(text) : null;
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function envValue(env: ServerEnv, ...names: string[]) {
  for (const name of names) {
    const value = env[name]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

function hasAll(env: ServerEnv, names: string[]) {
  return names.every((name) => Boolean(envValue(env, name)));
}

function getProcessEnv(): ServerEnv {
  return (globalThis as unknown as { process?: { env?: ServerEnv } }).process?.env ?? {};
}
