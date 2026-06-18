import type { StatusTone } from "./types";

type IntegrationStatus = "Configured" | "Missing" | "Not Connected" | "Demo Mode";

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
  demoDataEnabled: publicFlag("NEXT_PUBLIC_ENABLE_DEMO_DATA", "true") === "true",
  realApiEnabled: publicFlag("NEXT_PUBLIC_ENABLE_REAL_API", "false") === "true",
  autoPostingEnabled: publicFlag("NEXT_PUBLIC_ENABLE_AUTO_POSTING", "false") === "true",
  appUrlConfigured: hasPublicValue("NEXT_PUBLIC_APP_URL")
};

function statusTone(status: IntegrationStatus): StatusTone {
  if (status === "Configured") {
    return "green";
  }
  if (status === "Demo Mode") {
    return "blue";
  }
  if (status === "Not Connected") {
    return "amber";
  }
  return "red";
}

function serverSecretStatus(): IntegrationStatus {
  if (environmentStatus.demoDataEnabled) {
    return "Demo Mode";
  }

  if (!environmentStatus.realApiEnabled) {
    return "Not Connected";
  }

  return "Missing";
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
  integration("Gemini", ["GEMINI_API_KEY"], "Server-side key required for Gemini clip intelligence."),
  integration("OpenAI", ["OPENAI_API_KEY"], "Server-side key required for OpenAI caption and advisor flows."),
  integration("Claude", ["ANTHROPIC_API_KEY"], "Server-side key required for Anthropic/Claude workflows."),
  integration("Custom Provider", ["Custom provider endpoint/key"], "Optional custom AI provider placeholder.")
];

export const socialIntegrationEnvStatus: EnvStatusItem[] = [
  integration("YouTube OAuth", ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI", "YOUTUBE_API_KEY"], "Local redirect: /api/auth/youtube/callback."),
  integration("TikTok OAuth", ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET", "TIKTOK_REDIRECT_URI"], "Local redirect: /api/auth/tiktok/callback."),
  integration("Meta OAuth", ["META_APP_ID", "META_APP_SECRET", "META_REDIRECT_URI"], "Local redirect: /api/auth/meta/callback."),
  integration("Telegram Bot", ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"], "Used for approval notifications.")
];

export const featureFlagEnvStatus: EnvStatusItem[] = [
  {
    name: "Demo Data",
    required: ["NEXT_PUBLIC_ENABLE_DEMO_DATA"],
    status: environmentStatus.demoDataEnabled ? "Configured" : "Missing",
    tone: statusTone(environmentStatus.demoDataEnabled ? "Configured" : "Missing"),
    note: `Current value: ${environmentStatus.demoDataEnabled ? "enabled" : "disabled"}`
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
