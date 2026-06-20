import { buildClipStudioPrompt } from "./clip-studio-prompt";

export const MAX_SOURCE_DURATION_MINUTES = 180;
export const MIN_CLIP_COUNT = 1;
export const MAX_CLIP_COUNT = 15;
export const DEFAULT_CLIP_COUNT = 3;
export const DEFAULT_SOURCE_DURATION_MINUTES = 120;
export const DEFAULT_VIDEO_QUALITY = "1080p" as const;

export const clipStudioQualityOptions = [
  { value: "720p", label: "720p HD" },
  { value: "1080p", label: "1080p Full HD" },
  { value: "1440p", label: "1440p / 2K" },
  { value: "2160p", label: "2160p / 4K" }
] as const;

export const clipStudioTargetPlatforms = ["YouTube", "TikTok", "Instagram", "Facebook", "Shorts", "Reels", "Custom"] as const;

export type ClipStudioVideoQuality = (typeof clipStudioQualityOptions)[number]["value"];
export type ClipStudioTargetPlatform = (typeof clipStudioTargetPlatforms)[number];

export interface ClipStudioVideoMetadata {
  videoUrl: string;
  title: string;
  duration: string;
  durationMinutes: number;
  thumbnail: string;
  sourcePlatform: string;
}

export interface ClipStudioGeneratePayload {
  sourceVideoUrl: string;
  sourceDurationMinutes: number;
  clipCount: number;
  videoQuality: ClipStudioVideoQuality;
  targetPlatform: ClipStudioTargetPlatform;
  promptMode?: string;
  contentGoal?: string;
  language?: "id" | "en";
}

export interface ClipStudioClipResult {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  hook: string;
  angle: string;
  viralScore: number;
  quality: ClipStudioVideoQuality;
  platform: ClipStudioTargetPlatform;
  status: "Ready for Review" | "Ready for Editor" | "Saved to Library" | "Ready for Schedule";
  sourceVideoUrl: string;
  caption: string;
  reason: string;
}

export interface ClipStudioPlan {
  payload: ClipStudioGeneratePayload;
  metadata: ClipStudioVideoMetadata;
  prompt: string;
  clips: ClipStudioClipResult[];
}

export class ClipStudioValidationError extends Error {
  code = "CLIP_STUDIO_VALIDATION_ERROR" as const;

  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ClipStudioValidationError";
  }
}

export function validateSourceVideoUrl(sourceVideoUrl: string) {
  const value = sourceVideoUrl.trim();
  if (!value) throw new ClipStudioValidationError("URL video wajib diisi.", "sourceVideoUrl");

  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Unsupported protocol");
    return parsed.toString();
  } catch {
    throw new ClipStudioValidationError("Masukkan URL video yang valid.", "sourceVideoUrl");
  }
}

export function detectSourcePlatform(sourceVideoUrl: string) {
  try {
    const host = new URL(sourceVideoUrl).hostname.replace(/^www\./, "").toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "YouTube";
    if (host.includes("tiktok.com")) return "TikTok";
    if (host.includes("instagram.com")) return "Instagram";
    if (host.includes("facebook.com") || host.includes("fb.watch")) return "Facebook";
  } catch {
    return "Custom";
  }

  return "Custom";
}

export function resolveClipStudioMetadata(sourceVideoUrl: string, durationMinutes = DEFAULT_SOURCE_DURATION_MINUTES): ClipStudioVideoMetadata {
  const videoUrl = validateSourceVideoUrl(sourceVideoUrl);
  const normalizedDuration = normalizeSourceDurationMinutes(durationMinutes);
  const sourcePlatform = detectSourcePlatform(videoUrl);

  return {
    videoUrl,
    title: `${sourcePlatform} source video - ${normalizedDuration} minutes`,
    duration: formatLongDuration(normalizedDuration),
    durationMinutes: normalizedDuration,
    thumbnail: createClipStudioThumbnail("Source Video", `${normalizedDuration} min`, 1280, 720, 0),
    sourcePlatform
  };
}

export function validateClipStudioGeneratePayload(input: Partial<ClipStudioGeneratePayload>): ClipStudioGeneratePayload {
  return {
    sourceVideoUrl: validateSourceVideoUrl(input.sourceVideoUrl ?? ""),
    sourceDurationMinutes: normalizeSourceDurationMinutes(input.sourceDurationMinutes ?? DEFAULT_SOURCE_DURATION_MINUTES),
    clipCount: normalizeClipCount(input.clipCount ?? DEFAULT_CLIP_COUNT),
    videoQuality: normalizeVideoQuality(input.videoQuality ?? DEFAULT_VIDEO_QUALITY),
    targetPlatform: normalizeTargetPlatform(input.targetPlatform ?? "YouTube"),
    promptMode: input.promptMode ?? "clip_studio_structured_json",
    contentGoal: input.contentGoal ?? "Generate high-retention clips ready for Editor, Library, and Scheduler.",
    language: input.language ?? "id"
  };
}

export function generateClipStudioPlan(input: Partial<ClipStudioGeneratePayload>): ClipStudioPlan {
  const payload = validateClipStudioGeneratePayload(input);
  const metadata = resolveClipStudioMetadata(payload.sourceVideoUrl, payload.sourceDurationMinutes);

  return {
    payload,
    metadata,
    prompt: buildClipStudioPrompt(payload, metadata),
    clips: generateDemoClipResults(payload, metadata)
  };
}

function generateDemoClipResults(payload: ClipStudioGeneratePayload, metadata: ClipStudioVideoMetadata) {
  const durations = ["00:52", "00:47", "00:59", "00:44", "00:50", "00:42", "00:55", "00:39", "00:58", "00:46", "00:53", "00:41", "00:57", "00:49", "00:45"];

  return Array.from({ length: payload.clipCount }, (_, index): ClipStudioClipResult => {
    const clipNumber = String(index + 1).padStart(2, "0");
    const viralScore = 82 + ((index * 7 + payload.sourceDurationMinutes) % 17);
    const title = `${titleSeeds[index % titleSeeds.length]} ${clipNumber}`;
    const hook = `${hookSeeds[index % hookSeeds.length]} (${clipNumber})`;
    const angle = `${angleSeeds[index % angleSeeds.length]} untuk ${payload.targetPlatform}`;

    return {
      id: `clip-studio-${clipNumber}`,
      title,
      thumbnail: createClipStudioThumbnail(`Clip ${clipNumber}`, payload.videoQuality, 720, 405, index + 1),
      duration: durations[index % durations.length],
      hook,
      angle,
      viralScore,
      quality: payload.videoQuality,
      platform: payload.targetPlatform,
      status: "Ready for Review",
      sourceVideoUrl: metadata.videoUrl,
      caption: `${hook} Simpan ide ini dan jadikan short clip siap publish.`,
      reason: "Demo generator memilih segmen dengan hook cepat, konteks mandiri, dan potensi retention tinggi."
    };
  });
}

function normalizeSourceDurationMinutes(durationMinutes: number) {
  const value = Number(durationMinutes);
  if (!Number.isFinite(value) || value <= 0) throw new ClipStudioValidationError("Durasi video tidak valid.", "sourceDurationMinutes");
  if (value > MAX_SOURCE_DURATION_MINUTES) throw new ClipStudioValidationError("Durasi video maksimal 3 jam.", "sourceDurationMinutes");
  return Math.round(value);
}

function normalizeClipCount(clipCount: number) {
  const value = Number(clipCount);
  if (!Number.isInteger(value) || value < MIN_CLIP_COUNT) throw new ClipStudioValidationError("Jumlah video minimal 1 clip.", "clipCount");
  if (value > MAX_CLIP_COUNT) throw new ClipStudioValidationError("Jumlah video maksimal 15 clip.", "clipCount");
  return value;
}

function normalizeVideoQuality(videoQuality: string) {
  if (clipStudioQualityOptions.some((quality) => quality.value === videoQuality)) return videoQuality as ClipStudioVideoQuality;
  throw new ClipStudioValidationError("Pilihan kualitas video tidak valid.", "videoQuality");
}

function normalizeTargetPlatform(targetPlatform: string) {
  const platform = clipStudioTargetPlatforms.find((item) => item.toLowerCase() === targetPlatform.trim().toLowerCase());
  if (platform) return platform;
  throw new ClipStudioValidationError("Platform target tidak valid.", "targetPlatform");
}

function formatLongDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}:00`;
}

function createClipStudioThumbnail(title: string, subtitle: string, width: number, height: number, seed: number) {
  const [from, to] = thumbnailPalettes[seed % thumbnailPalettes.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="100%" height="100%" rx="24" fill="url(#g)"/><circle cx="${width * 0.82}" cy="${height * 0.2}" r="${width * 0.12}" fill="rgba(255,255,255,0.16)"/><rect x="${width * 0.08}" y="${height * 0.18}" width="${width * 0.84}" height="${height * 0.64}" rx="20" fill="rgba(255,255,255,0.17)" stroke="rgba(255,255,255,0.32)"/><text x="${width * 0.12}" y="${height * 0.48}" fill="#fff" font-family="Inter,Arial,sans-serif" font-size="${width * 0.085}" font-weight="800">${escapeXml(title)}</text><text x="${width * 0.12}" y="${height * 0.62}" fill="rgba(255,255,255,0.88)" font-family="Inter,Arial,sans-serif" font-size="${width * 0.045}" font-weight="700">${escapeXml(subtitle)}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const thumbnailPalettes = [
  ["#ea580c", "#facc15"],
  ["#0ea5e9", "#22c55e"],
  ["#dc2626", "#fb923c"],
  ["#2563eb", "#06b6d4"],
  ["#16a34a", "#84cc16"]
];

const titleSeeds = [
  "Cara meningkatkan produktivitas harian",
  "Tiga kebiasaan sukses creator",
  "Mindset positif untuk hidup lebih baik",
  "Tips manajemen waktu yang efektif",
  "Strategi konten yang bikin engagement naik",
  "Kesalahan umum yang harus dihindari",
  "Framework cepat untuk ide viral",
  "Momen paling kuat dari video panjang"
];

const hookSeeds = [
  "Berhenti scroll, bagian ini sering dilewatkan",
  "Dalam 3 detik pertama, tunjukkan hasil akhirnya",
  "Ini alasan penonton bertahan sampai akhir",
  "Kesalahan kecil ini bisa merusak performa konten",
  "Gunakan angle ini sebelum membuat caption",
  "Buka dengan masalah yang langsung terasa",
  "Tampilkan bukti sebelum menjelaskan proses",
  "Ubah insight panjang menjadi payoff singkat"
];

const angleSeeds = [
  "Edukasi singkat dengan payoff jelas",
  "Storytelling cepat dari masalah ke solusi",
  "Before-after yang mudah dipahami",
  "Hot take aman dengan konteks lengkap",
  "Checklist praktis untuk action cepat",
  "Insight personal yang terasa relatable",
  "Breakdown strategi untuk creator",
  "Ringkasan high-retention dari source video"
];
