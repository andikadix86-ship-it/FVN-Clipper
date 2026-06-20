import type { ClipStudioGeneratePayload, ClipStudioVideoMetadata } from "./clip-studio-service";

export const clipStudioPromptSchema = {
  clips: [
    {
      title: "string",
      hook: "string",
      angle: "string",
      startTime: "HH:MM:SS",
      endTime: "HH:MM:SS",
      suggestedDuration: "string",
      viralScore: "number",
      category: "string",
      reason: "string",
      caption: "string",
      hashtags: ["string"],
      cta: "string",
      platformFit: "string"
    }
  ]
} as const;

export function buildClipStudioPrompt(payload: ClipStudioGeneratePayload, metadata: ClipStudioVideoMetadata) {
  return [
    "Return only valid structured JSON.",
    `Analisis video sumber dan buat ${payload.clipCount} ide clip terbaik dari video panjang sampai 3 jam.`,
    "Prioritaskan bagian dengan hook kuat 3 detik pertama, retention tinggi, value jelas, dan peluang viral.",
    "Output wajib JSON terstruktur agar mudah dipakai frontend.",
    `Metadata: ${JSON.stringify(metadata)}`,
    `Payload: ${JSON.stringify(payload)}`,
    `Schema: ${JSON.stringify(clipStudioPromptSchema)}`
  ].join("\n");
}
