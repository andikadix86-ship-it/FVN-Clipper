export type ApiConnectionState = "CONNECTED" | "NOT_CONNECTED" | "FAILED" | "UNSUPPORTED";

export interface ApiErrorPayload {
  success: false;
  data: null;
  error: string;
  code: string;
  status: ApiConnectionState;
  technicalReason: string;
  provider?: string;
}

interface ApiErrorOptions {
  code: string;
  message: string;
  provider?: string;
  status?: ApiConnectionState;
  statusCode?: number;
  technicalReason?: string;
}

export class ApiConnectionError extends Error {
  readonly code: string;
  readonly provider?: string;
  readonly status: ApiConnectionState;
  readonly statusCode: number;
  readonly technicalReason: string;

  constructor(options: ApiErrorOptions) {
    super(sanitizeSecret(options.message));
    this.name = "ApiConnectionError";
    this.code = options.code;
    this.provider = options.provider;
    this.status = options.status ?? "FAILED";
    this.statusCode = options.statusCode ?? (this.status === "NOT_CONNECTED" ? 503 : 500);
    this.technicalReason = sanitizeSecret(options.technicalReason ?? options.message);
  }
}

export function createEnvMissingError(provider: string, names: string[]) {
  const missing = names.join(", ");
  return new ApiConnectionError({
    code: "ENV_NOT_READ",
    provider,
    status: "NOT_CONNECTED",
    statusCode: 503,
    message: `ENV belum terbaca untuk ${provider}: ${missing}.`,
    technicalReason: `Missing required environment variables: ${missing}.`
  });
}

export function toApiErrorPayload(error: unknown): ApiErrorPayload {
  if (error instanceof ApiConnectionError) {
    return {
      success: false,
      data: null,
      error: error.message,
      code: error.code,
      status: error.status,
      technicalReason: error.technicalReason,
      provider: error.provider
    };
  }

  const attempts = (error as { attempts?: Array<{ reason?: string; provider?: string }> } | null)?.attempts;
  const statusCode = (error as { statusCode?: unknown } | null)?.statusCode;
  if (statusCode === 503 && attempts?.length) {
    const technicalReason = attempts.map((attempt) => [attempt.provider, attempt.reason].filter(Boolean).join(": ")).filter(Boolean).join("; ");
    return {
      success: false,
      data: null,
      error: sanitizeSecret(error instanceof Error ? error.message : "AI provider belum dikonfigurasi."),
      code: "AI_PROVIDER_NOT_CONFIGURED",
      status: "NOT_CONNECTED",
      technicalReason: sanitizeSecret(technicalReason || "AI provider configuration is incomplete.")
    };
  }

  const classified = classifyProviderError(error);
  return {
    success: false,
    data: null,
    error: classified.message,
    code: classified.code,
    status: "FAILED",
    technicalReason: classified.technicalReason,
    provider: classified.provider
  };
}

export function getHttpStatus(error: unknown) {
  if (error instanceof ApiConnectionError) {
    return error.statusCode;
  }

  const errorStatus = (error as { statusCode?: unknown; status?: unknown } | null)?.statusCode ?? (error as { status?: unknown } | null)?.status;
  return typeof errorStatus === "number" ? errorStatus : 500;
}

export function classifyProviderError(error: unknown, provider?: string) {
  const rawMessage = error instanceof Error ? error.message : "Unexpected provider error.";
  const status = getNumericStatus(error);
  const safeMessage = sanitizeSecret(rawMessage);
  const lower = safeMessage.toLowerCase();

  if (status === 401 || lower.includes("invalid api key") || lower.includes("unauthorized")) {
    return {
      code: "API_KEY_INVALID",
      message: `${provider ?? "Provider"} API key invalid atau tidak diterima.`,
      provider,
      technicalReason: safeMessage
    };
  }

  if (status === 403 || lower.includes("permission") || lower.includes("scope") || lower.includes("forbidden")) {
    return {
      code: "PERMISSION_SCOPE_INACTIVE",
      message: `${provider ?? "Provider"} permission/scope belum aktif.`,
      provider,
      technicalReason: safeMessage
    };
  }

  if (status === 408 || lower.includes("timeout") || lower.includes("timed out") || lower.includes("aborted")) {
    return {
      code: "REQUEST_TIMEOUT",
      message: `${provider ?? "Provider"} request timeout.`,
      provider,
      technicalReason: safeMessage
    };
  }

  if (status === 429 || lower.includes("rate limit")) {
    return {
      code: "RATE_LIMIT",
      message: `${provider ?? "Provider"} rate limit aktif.`,
      provider,
      technicalReason: safeMessage
    };
  }

  if (lower.includes("quota")) {
    return {
      code: "QUOTA_EXHAUSTED",
      message: `${provider ?? "Provider"} quota/limit habis.`,
      provider,
      technicalReason: safeMessage
    };
  }

  if (status && status >= 500) {
    return {
      code: "ENDPOINT_ERROR",
      message: `${provider ?? "Provider"} endpoint error.`,
      provider,
      technicalReason: safeMessage
    };
  }

  if (lower.includes("not supported") || lower.includes("unsupported")) {
    return {
      code: "PROVIDER_UNSUPPORTED",
      message: `${provider ?? "Provider"} belum support.`,
      provider,
      technicalReason: safeMessage
    };
  }

  return {
    code: "ENDPOINT_ERROR",
    message: safeMessage,
    provider,
    technicalReason: safeMessage
  };
}

export function sanitizeSecret(value: string) {
  let sanitized = value;

  for (const secret of getKnownSecrets()) {
    sanitized = sanitized.split(secret).join("[redacted]");
  }

  return sanitized
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/sk-[A-Za-z0-9_\-.]{8,}/g, "sk-[redacted]")
    .replace(/((?:api[_-]?key|token|secret|password)=)([^&\s]+)/gi, "$1[redacted]")
    .replace(/[A-Za-z0-9_\-.]{32,}/g, "[redacted]");
}

function getNumericStatus(error: unknown) {
  const status = (error as { status?: unknown; statusCode?: unknown; code?: unknown } | null)?.status ?? (error as { statusCode?: unknown } | null)?.statusCode;
  if (typeof status === "number") {
    return status;
  }
  return undefined;
}

function getKnownSecrets() {
  const env = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

  return Object.entries(env)
    .filter(([key, value]) => /KEY|TOKEN|SECRET|PASSWORD|DATABASE_URL|DIRECT_URL/i.test(key) && typeof value === "string" && value.length >= 8)
    .map(([, value]) => value as string);
}
