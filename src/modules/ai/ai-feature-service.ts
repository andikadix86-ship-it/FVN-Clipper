import { buildClipStudioPrompt } from "../../clip-studio-prompt";
import type { ClipStudioGeneratePayload, ClipStudioVideoMetadata } from "../../clip-studio-service";
import { generateAiText } from "./ai-provider";
import { AI_FEATURE_NAMES, type AiChatMessage, type AiFeatureName, type AiGenerateTextRequest, type AiResponseFormat } from "./types";

export interface AiFeatureGenerateBody {
  feature?: string;
  prompt?: string;
  systemPrompt?: string;
  messages?: AiChatMessage[];
  context?: unknown;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: AiResponseFormat;
  clipStudio?: {
    payload: ClipStudioGeneratePayload;
    metadata: ClipStudioVideoMetadata;
  };
}

export interface AiFeatureGenerateResult {
  feature: AiFeatureName;
  output: string;
  provider: string;
  model: string;
  fallbackUsed: boolean;
  attempts: Awaited<ReturnType<typeof generateAiText>>["attempts"];
}

const FEATURE_SYSTEM_PROMPTS: Record<AiFeatureName, string> = {
  "ai-clip-intelligence": "Anda adalah AI Clip Intelligence untuk menemukan peluang short-form video, trend, niche, kompetitor, dan rekomendasi konten.",
  "clip-studio": "Anda adalah Clip Studio AI yang mengubah video panjang menjadi rencana clip pendek berkualitas tinggi.",
  "ai-clip-generator": "Anda adalah AI Clip Generator yang membuat ide hook, durasi, angle, subtitle, reframe, dan CTA untuk short-form clips.",
  "subtitle-generator": "Anda adalah Subtitle Generator. Buat subtitle ringkas, jelas, natural, dan mudah dibaca untuk video pendek.",
  "caption-generator": "Anda adalah Caption Generator. Buat caption, hashtag, dan CTA yang kuat untuk platform short-form.",
  "script-generator": "Anda adalah Script Generator. Buat script video pendek dengan hook cepat, value jelas, dan CTA natural.",
  "viral-trend-advisor": "Anda adalah Viral/Trend Advisor. Berikan insight trend, risiko, peluang viral, dan rekomendasi aksi yang praktis.",
  "content-recommendation": "Anda adalah Content Recommendation AI. Rekomendasikan konten berikutnya berdasarkan performa, niche, campaign, dan kalender publish.",
  generic: "Anda adalah AI assistant untuk FVN AI Clipper. Jawab dengan singkat, terstruktur, dan siap dipakai aplikasi."
};

export async function generateAiFeatureContent(body: AiFeatureGenerateBody): Promise<AiFeatureGenerateResult> {
  const request = normalizeAiFeatureRequest(body);
  const result = await generateAiText(request);

  return {
    feature: request.feature ?? "generic",
    output: result.text,
    provider: result.provider,
    model: result.model,
    fallbackUsed: result.fallbackUsed,
    attempts: result.attempts
  };
}

export function normalizeAiFeatureRequest(body: AiFeatureGenerateBody): AiGenerateTextRequest {
  const feature = normalizeFeature(body.feature);
  const systemPrompt = body.systemPrompt?.trim() || FEATURE_SYSTEM_PROMPTS[feature];
  const prompt = buildPrompt(body, feature);
  const messages = normalizeMessages(body.messages, systemPrompt, prompt);

  return {
    feature,
    messages,
    temperature: body.temperature,
    maxTokens: body.maxTokens,
    responseFormat: body.responseFormat ?? (feature === "clip-studio" ? "json_object" : "text")
  };
}

function normalizeFeature(value?: string): AiFeatureName {
  const normalized = value?.trim().toLowerCase();
  return AI_FEATURE_NAMES.find((item) => item === normalized) ?? "generic";
}

function buildPrompt(body: AiFeatureGenerateBody, feature: AiFeatureName) {
  if (feature === "clip-studio" && body.clipStudio) {
    return buildClipStudioPrompt(body.clipStudio.payload, body.clipStudio.metadata);
  }

  const contextText = body.context === undefined ? "" : `\n\nContext:\n${JSON.stringify(body.context)}`;
  const prompt = body.prompt?.trim() || "Generate a useful result for this feature.";
  return `${prompt}${contextText}`;
}

function normalizeMessages(messages: AiChatMessage[] | undefined, systemPrompt: string, prompt: string): AiChatMessage[] {
  if (messages?.length) {
    return messages.map((message) => ({ role: message.role, content: message.content }));
  }

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt }
  ];
}
