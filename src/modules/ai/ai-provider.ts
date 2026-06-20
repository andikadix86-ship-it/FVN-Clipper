import { OpenAiCompatibleClient } from "./openai-compatible-client";
import {
  AI_PROVIDER_NAMES,
  type AiGenerateTextRequest,
  type AiGenerateTextResult,
  type AiProviderAttempt,
  type AiProviderName,
  type AiProviderPublicConfig,
  type AiProviderPublicStatus,
  type AiProviderResolvedConfig,
  type AiProviderRole,
  type AiProviderSettings
} from "./types";

type ServerEnv = Record<string, string | undefined>;

interface ProviderDefaults {
  apiKeyEnv: string;
  baseUrlEnv: string;
  modelEnv: string;
  defaultBaseUrl?: string;
  defaultModel: string;
  requiresBaseUrl?: boolean;
}

export interface AiClientLike {
  generateText(request: AiGenerateTextRequest): Promise<{ text: string; usage?: AiGenerateTextResult["usage"] }>;
}

export type AiClientFactory = (config: AiProviderResolvedConfig) => AiClientLike;

export class AiProviderConfigurationError extends Error {
  readonly statusCode = 503;
  readonly attempts: AiProviderAttempt[];

  constructor(message: string, attempts: AiProviderAttempt[] = []) {
    super(message);
    this.name = "AiProviderConfigurationError";
    this.attempts = attempts;
  }
}

export class AiProviderRuntimeError extends Error {
  readonly statusCode = 502;
  readonly attempts: AiProviderAttempt[];

  constructor(message: string, attempts: AiProviderAttempt[]) {
    super(message);
    this.name = "AiProviderRuntimeError";
    this.attempts = attempts;
  }
}

const PROVIDER_DEFAULTS: Record<AiProviderName, ProviderDefaults> = {
  openai: {
    apiKeyEnv: "OPENAI_API_KEY",
    baseUrlEnv: "OPENAI_BASE_URL",
    modelEnv: "OPENAI_MODEL",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini"
  },
  deepseek: {
    apiKeyEnv: "DEEPSEEK_API_KEY",
    baseUrlEnv: "DEEPSEEK_BASE_URL",
    modelEnv: "DEEPSEEK_MODEL",
    defaultBaseUrl: "https://api.deepseek.com",
    defaultModel: "deepseek-chat"
  },
  qwen: {
    apiKeyEnv: "QWEN_API_KEY",
    baseUrlEnv: "QWEN_BASE_URL",
    modelEnv: "QWEN_MODEL",
    defaultModel: "qwen-plus",
    requiresBaseUrl: true
  }
};

export function resolveAiProviderSettings(env: ServerEnv = getProcessEnv()): AiProviderSettings {
  const primaryProvider = normalizeAiProviderName(env.AI_PROVIDER) ?? "openai";
  const primary = resolveProviderConfig(primaryProvider, "primary", env);
  const fallbackProvider = normalizeAiProviderName(env.AI_FALLBACK_PROVIDER);
  const fallback = fallbackProvider ? resolveProviderConfig(fallbackProvider, "fallback", env) : undefined;

  return {
    primary,
    fallback,
    providers: [primary, ...(fallback ? [fallback] : [])]
  };
}

export function getAiProviderPublicStatus(env: ServerEnv = getProcessEnv()): AiProviderPublicStatus {
  const settings = resolveAiProviderSettings(env);
  const primary = toPublicConfig(settings.primary);
  const fallback = settings.fallback ? toPublicConfig(settings.fallback) : undefined;
  const configured = settings.primary.configured;
  const fallbackConfigured = Boolean(settings.fallback?.configured);

  return {
    activeProvider: settings.primary.provider,
    configured,
    message: getStatusMessage(configured, fallbackConfigured),
    primary,
    fallback,
    providers: [primary, ...(fallback ? [fallback] : [])]
  };
}

export async function generateAiText(
  request: AiGenerateTextRequest,
  options: { env?: ServerEnv; settings?: AiProviderSettings; clientFactory?: AiClientFactory } = {}
): Promise<AiGenerateTextResult> {
  const settings = options.settings ?? resolveAiProviderSettings(options.env);
  const clientFactory = options.clientFactory ?? ((config) => new OpenAiCompatibleClient(config));
  const attempts: AiProviderAttempt[] = [];
  const candidates = settings.providers;

  if (candidates.every((config) => !config.configured)) {
    const skipped = candidates.map((config) => ({
      provider: config.provider,
      model: config.model,
      role: config.role,
      status: "skipped" as const,
      reason: config.missing.join(", ") || "Provider is not configured."
    }));
    throw new AiProviderConfigurationError("AI provider belum dikonfigurasi. Isi AI_PROVIDER, API key, dan model di .env.", skipped);
  }

  for (const config of candidates) {
    if (!config.configured) {
      attempts.push({
        provider: config.provider,
        model: config.model,
        role: config.role,
        status: "skipped",
        reason: config.missing.join(", ") || "Provider is not configured."
      });
      continue;
    }

    try {
      const result = await clientFactory(config).generateText(request);
      const successAttempt: AiProviderAttempt = {
        provider: config.provider,
        model: config.model,
        role: config.role,
        status: "success"
      };

      return {
        text: result.text,
        provider: config.provider,
        model: config.model ?? "",
        baseUrl: config.baseUrl,
        fallbackUsed: config.role === "fallback",
        attempts: [...attempts, successAttempt],
        usage: result.usage
      };
    } catch (error) {
      attempts.push({
        provider: config.provider,
        model: config.model,
        role: config.role,
        status: "failed",
        reason: sanitizeErrorMessage(error)
      });
    }
  }

  throw new AiProviderRuntimeError("AI provider utama gagal dan fallback tidak berhasil. Periksa konfigurasi provider AI atau coba lagi.", attempts);
}

function resolveProviderConfig(provider: AiProviderName, role: AiProviderRole, env: ServerEnv): AiProviderResolvedConfig {
  const defaults = PROVIDER_DEFAULTS[provider];
  const keyCandidates: Array<[string, string | undefined]> =
    role === "fallback"
      ? [
          ["AI_FALLBACK_API_KEY", env.AI_FALLBACK_API_KEY],
          [defaults.apiKeyEnv, env[defaults.apiKeyEnv]],
          ["AI_API_KEY", env.AI_API_KEY]
        ]
      : [
          [defaults.apiKeyEnv, env[defaults.apiKeyEnv]],
          ["AI_API_KEY", env.AI_API_KEY]
        ];
  const modelCandidates: Array<[string, string | undefined]> =
    role === "fallback"
      ? [
          ["AI_FALLBACK_MODEL", env.AI_FALLBACK_MODEL],
          [defaults.modelEnv, env[defaults.modelEnv]],
          [`${provider} default`, defaults.defaultModel]
        ]
      : [
          ["AI_MODEL", env.AI_MODEL],
          [defaults.modelEnv, env[defaults.modelEnv]],
          [`${provider} default`, defaults.defaultModel]
        ];
  const baseUrlCandidates: Array<[string, string | undefined]> =
    role === "fallback"
      ? [
          ["AI_FALLBACK_BASE_URL", env.AI_FALLBACK_BASE_URL],
          [defaults.baseUrlEnv, env[defaults.baseUrlEnv]],
          [`${provider} default`, defaults.defaultBaseUrl]
        ]
      : [
          ["AI_BASE_URL", env.AI_BASE_URL],
          [defaults.baseUrlEnv, env[defaults.baseUrlEnv]],
          [`${provider} default`, defaults.defaultBaseUrl]
        ];

  const key = firstValue(keyCandidates);
  const model = firstValue(modelCandidates);
  const baseUrl = firstValue(baseUrlCandidates);
  const missing: string[] = [];

  if (!key.value) {
    missing.push(`${role === "fallback" ? "AI_FALLBACK_API_KEY or " : ""}${defaults.apiKeyEnv} or AI_API_KEY`);
  }

  if (!model.value) {
    missing.push(`${role === "fallback" ? "AI_FALLBACK_MODEL or " : "AI_MODEL or "}${defaults.modelEnv}`);
  }

  if (defaults.requiresBaseUrl && !baseUrl.value) {
    missing.push(`${role === "fallback" ? "AI_FALLBACK_BASE_URL or " : "AI_BASE_URL or "}${defaults.baseUrlEnv}`);
  }

  return {
    role,
    provider,
    configured: missing.length === 0,
    apiKey: key.value,
    maskedApiKey: maskSecret(key.value),
    keySource: key.source,
    baseUrl: baseUrl.value,
    baseUrlSource: baseUrl.source,
    model: model.value,
    modelSource: model.source,
    missing
  };
}

function toPublicConfig(config: AiProviderResolvedConfig): AiProviderPublicConfig {
  return {
    role: config.role,
    provider: config.provider,
    configured: config.configured,
    status: config.configured ? "Configured" : "Missing",
    maskedApiKey: config.maskedApiKey,
    keySource: config.keySource,
    baseUrl: config.baseUrl,
    baseUrlSource: config.baseUrlSource,
    model: config.model,
    modelSource: config.modelSource,
    missing: config.missing
  };
}

function getStatusMessage(configured: boolean, fallbackConfigured: boolean) {
  if (configured) {
    return "AI provider aktif dan siap dipakai.";
  }

  if (fallbackConfigured) {
    return "Provider utama belum lengkap, tetapi fallback provider tersedia.";
  }

  return "AI provider belum lengkap. Isi key dan model di .env agar fitur AI dapat memakai provider nyata.";
}

function normalizeAiProviderName(value?: string): AiProviderName | undefined {
  const normalized = value?.trim().toLowerCase();
  return AI_PROVIDER_NAMES.find((item) => item === normalized);
}

function firstValue(candidates: Array<[string, string | undefined]>): { source?: string; value?: string } {
  for (const [source, rawValue] of candidates) {
    const value = rawValue?.trim();
    if (value) {
      return { source, value };
    }
  }

  return {};
}

function maskSecret(value?: string) {
  if (!value) {
    return "missing";
  }

  if (value.length <= 8) {
    return "****";
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function sanitizeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Provider request failed.";
  return message.replace(/[A-Za-z0-9_\-.]{24,}/g, "[redacted]");
}

function getProcessEnv(): ServerEnv {
  return (globalThis as unknown as { process?: { env?: ServerEnv } }).process?.env ?? {};
}
