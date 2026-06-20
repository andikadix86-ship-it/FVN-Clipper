export const AI_PROVIDER_NAMES = ["openai", "deepseek", "qwen"] as const;

export type AiProviderName = (typeof AI_PROVIDER_NAMES)[number];
export type AiProviderRole = "primary" | "fallback";

export const AI_FEATURE_NAMES = [
  "ai-clip-intelligence",
  "clip-studio",
  "ai-clip-generator",
  "subtitle-generator",
  "caption-generator",
  "script-generator",
  "viral-trend-advisor",
  "content-recommendation",
  "generic"
] as const;

export type AiFeatureName = (typeof AI_FEATURE_NAMES)[number];
export type AiMessageRole = "system" | "user" | "assistant";
export type AiResponseFormat = "text" | "json_object";

export interface AiChatMessage {
  role: AiMessageRole;
  content: string;
}

export interface AiGenerateTextRequest {
  feature?: AiFeatureName;
  messages: AiChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: AiResponseFormat;
}

export interface AiUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface AiProviderAttempt {
  provider: AiProviderName;
  model?: string;
  role: AiProviderRole;
  status: "skipped" | "failed" | "success";
  reason?: string;
}

export interface AiGenerateTextResult {
  text: string;
  provider: AiProviderName;
  model: string;
  baseUrl?: string;
  fallbackUsed: boolean;
  attempts: AiProviderAttempt[];
  usage?: AiUsage;
}

export interface AiProviderResolvedConfig {
  role: AiProviderRole;
  provider: AiProviderName;
  configured: boolean;
  apiKey?: string;
  maskedApiKey: string;
  keySource?: string;
  baseUrl?: string;
  baseUrlSource?: string;
  model?: string;
  modelSource?: string;
  missing: string[];
}

export interface AiProviderPublicConfig {
  role: AiProviderRole;
  provider: AiProviderName;
  configured: boolean;
  status: "Configured" | "Missing";
  maskedApiKey: string;
  keySource?: string;
  baseUrl?: string;
  baseUrlSource?: string;
  model?: string;
  modelSource?: string;
  missing: string[];
}

export interface AiProviderSettings {
  primary: AiProviderResolvedConfig;
  fallback?: AiProviderResolvedConfig;
  providers: AiProviderResolvedConfig[];
}

export interface AiProviderPublicStatus {
  activeProvider: AiProviderName;
  configured: boolean;
  message: string;
  primary: AiProviderPublicConfig;
  fallback?: AiProviderPublicConfig;
  providers: AiProviderPublicConfig[];
}
