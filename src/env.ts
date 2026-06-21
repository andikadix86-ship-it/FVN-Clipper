import type { StatusTone } from "./types";

type IntegrationStatus = "Configured" | "Missing" | "Not Connected";

export interface EnvStatusItem {
  name: string;
  required: string[];
  status: IntegrationStatus;
  tone: StatusTone;
  note: string;
}

const env = import.meta.env as Record<string, string | boolean | undefined>;

const publicFlag = (key: string, fallback: string) => String(env[key] ?? fallback).toLowerCase();
const hasPublicValue = (key: string) => typeof env[key] === "string" && String(env[key]).trim().length > 0;

export const environmentStatus = {
  appName: String(env.NEXT_PUBLIC_APP_NAME ?? "FVN AI Clipper"),
  appUrl: String(env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  demoDataEnabled: publicFlag("NEXT_PUBLIC_ENABLE_DEMO_DATA", "false") === "true",
  realApiEnabled: publicFlag("NEXT_PUBLIC_ENABLE_REAL_API", "true") === "true",
  autoPostingEnabled: publicFlag("NEXT_PUBLIC_ENABLE_AUTO_POSTING", "false") === "true",
  appUrlConfigured: hasPublicValue("NEXT_PUBLIC_APP_URL")
};

function statusTone(status: IntegrationStatus): StatusTone {
  if (status === "Configured") {
    return "green";
  }
  if (status === "Not Connected") {
    return "amber";
  }
  return "red";
}

function serverSecretStatus(): IntegrationStatus {
  if (!environmentStatus.realApiEnabled) {
    return "Not Connected";
  }

  return "Not Connected";
}

function integration(name: string, required: string[], note: string): EnvStatusItem {
  const status = serverSecretStatus();
  return {
    name,
    required,
    status,
    tone: statusTone(status),
    note
  };
}

export const aiProviderEnvStatus: EnvStatusItem[] = [
  integration("Active AI Provider", ["AI_PROVIDER", "AI_API_KEY", "AI_MODEL"], "Server-side OpenAI-compatible provider used by every AI workflow."),
  integration("OpenAI", ["OPENAI_API_KEY or AI_API_KEY", "OPENAI_MODEL or AI_MODEL"], "Use ChatGPT/OpenAI models through the shared provider adapter."),
  integration("DeepSeek", ["DEEPSEEK_API_KEY or AI_API_KEY", "DEEPSEEK_BASE_URL", "DEEPSEEK_MODEL or AI_MODEL"], "Use DeepSeek through the OpenAI-compatible client."),
  integration("Qwen", ["Optional: QWEN_API_KEY", "Optional: QWEN_BASE_URL", "Optional: QWEN_MODEL"], "Qwen-specific env is temporarily inactive. Use AI_* or AI_FALLBACK_* if selecting Qwen."),
  integration("Fallback Provider", ["AI_FALLBACK_PROVIDER", "AI_FALLBACK_API_KEY", "AI_FALLBACK_MODEL"], "Optional provider retried when the primary provider fails.")
];

export const socialIntegrationEnvStatus: EnvStatusItem[] = [
  integration("YouTube OAuth", ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI", "YOUTUBE_API_KEY"], "Local redirect: /api/auth/youtube/callback."),
  integration("TikTok OAuth", ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET", "TIKTOK_REDIRECT_URI"], "Local redirect: /api/auth/tiktok/callback."),
  integration("Meta OAuth", ["META_APP_ID", "META_APP_SECRET", "META_REDIRECT_URI"], "Local redirect: /api/auth/meta/callback."),
  integration("Telegram Bot", ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"], "Used for approval notifications.")
];

export const featureFlagEnvStatus: EnvStatusItem[] = [
  {
    name: "Manual Demo Mode",
    required: ["NEXT_PUBLIC_ENABLE_DEMO_DATA"],
    status: environmentStatus.demoDataEnabled ? "Configured" : "Not Connected",
    tone: statusTone(environmentStatus.demoDataEnabled ? "Configured" : "Not Connected"),
    note: `Current value: ${environmentStatus.demoDataEnabled ? "enabled manually" : "disabled"}`
  },
  {
    name: "Real API",
    required: ["NEXT_PUBLIC_ENABLE_REAL_API"],
    status: environmentStatus.realApiEnabled ? "Configured" : "Not Connected",
    tone: statusTone(environmentStatus.realApiEnabled ? "Configured" : "Not Connected"),
    note: `Current value: ${environmentStatus.realApiEnabled ? "enabled" : "disabled"}`
  },
  {
    name: "Auto Posting",
    required: ["NEXT_PUBLIC_ENABLE_AUTO_POSTING"],
    status: environmentStatus.autoPostingEnabled ? "Configured" : "Not Connected",
    tone: statusTone(environmentStatus.autoPostingEnabled ? "Configured" : "Not Connected"),
    note: `Current value: ${environmentStatus.autoPostingEnabled ? "enabled" : "disabled"}`
  }
];
