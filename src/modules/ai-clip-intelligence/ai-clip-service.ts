import { ContentStatus, PerformanceLevel, Platform, Prisma, SourceType } from "@prisma/client";
import { assertDatabaseConfigured, prisma } from "../db/prisma";

export interface OpportunityFilters {
  keyword?: string | null;
  category?: string | null;
  platform?: string | null;
  status?: string | null;
  date?: string | null;
  performance?: string | null;
  campaign?: string | null;
  saved?: string | null;
  limit?: string | null;
  sort?: string | null;
}

export interface CompetitorFilters {
  platform?: string | null;
  niche?: string | null;
}

export function getCategories() {
  assertDatabaseConfigured();

  return prisma.category.findMany({
    where: { ...realSourceWhere(), isActive: true },
    orderBy: { name: "asc" }
  });
}

export function getCompetitors(filters: CompetitorFilters = {}) {
  assertDatabaseConfigured();

  const where: Prisma.CompetitorProfileWhereInput = realSourceWhere();
  const platform = parseEnumValue(filters.platform, Platform);

  if (platform && platform !== Platform.ALL) {
    where.platform = platform;
  }

  if (filters.niche) {
    where.niche = { contains: filters.niche, mode: "insensitive" };
  }

  return prisma.competitorProfile.findMany({
    where,
    orderBy: [{ avgEngagement: "desc" }, { followers: "desc" }]
  });
}

export function getOpportunities(filters: OpportunityFilters = {}) {
  assertDatabaseConfigured();

  const where: Prisma.AiClipOpportunityWhereInput = realSourceWhere();
  const keyword = filters.keyword?.trim();
  const platform = parseEnumValue(filters.platform, Platform);
  const status = parseEnumValue(filters.status, ContentStatus);
  const performanceLevel = parseEnumValue(filters.performance, PerformanceLevel);

  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: "insensitive" } },
      { description: { contains: keyword, mode: "insensitive" } },
      { keyword: { contains: keyword, mode: "insensitive" } },
      { niche: { contains: keyword, mode: "insensitive" } }
    ];
  }

  if (filters.category && filters.category !== "All") {
    where.category = {
      is: {
        OR: [{ slug: filters.category }, { id: filters.category }]
      }
    };
  }

  if (platform && platform !== Platform.ALL) {
    where.platform = platform;
  }

  if (status) {
    where.status = status;
  }

  const dateRange = getDayRange(filters.date);
  if (dateRange) {
    where.createdAt = dateRange;
  }

  if (performanceLevel) {
    where.performanceLevel = performanceLevel;
  }

  if (filters.campaign && filters.campaign !== "All") {
    where.campaign = {
      is: {
        OR: [{ slug: filters.campaign }, { id: filters.campaign }]
      }
    };
  }

  if (filters.saved === "true") {
    where.isSaved = true;
  } else if (filters.saved === "false") {
    where.isSaved = false;
  }

  return prisma.aiClipOpportunity.findMany({
    where,
    include: {
      category: true,
      campaign: true
    },
    orderBy: getOpportunityOrderBy(filters.sort),
    take: getLimit(filters.limit)
  });
}

export async function setOpportunitySaved(id: string, saved?: boolean) {
  assertDatabaseConfigured();

  const current = await prisma.aiClipOpportunity.findFirst({
    where: { id, ...realSourceWhere() },
    select: { isSaved: true }
  });

  if (!current) {
    return null;
  }

  const nextSaved = typeof saved === "boolean" ? saved : !current.isSaved;

  return prisma.aiClipOpportunity.update({
    where: { id },
    data: {
      isSaved: nextSaved,
      savedAt: nextSaved ? new Date() : null
    },
    include: {
      category: true,
      campaign: true
    }
  });
}

export interface YouTubeScanInput {
  keyword?: unknown;
  limit?: unknown;
}

interface YouTubeSearchItem {
  id?: {
    videoId?: string;
  };
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    channelTitle?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
  };
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
  error?: {
    message?: string;
    errors?: Array<{ reason?: string; message?: string }>;
  };
}

export async function scanYouTubeOpportunities(input: YouTubeScanInput = {}) {
  assertDatabaseConfigured();

  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) {
    const error = new Error("YOUTUBE_API_KEY belum terisi.");
    Object.assign(error, {
      statusCode: 503,
      code: "YOUTUBE_API_NOT_CONFIGURED",
      provider: "youtube"
    });
    throw error;
  }

  const keyword = typeof input.keyword === "string" && input.keyword.trim() ? input.keyword.trim() : "AI shorts";
  const limit = clampNumber(Number(input.limit ?? 10), 1, 25);

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("q", keyword);
  url.searchParams.set("maxResults", String(limit));
  url.searchParams.set("regionCode", "ID");
  url.searchParams.set("order", "relevance");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url);
  const payload = (await response.json().catch(() => ({}))) as YouTubeSearchResponse;

  if (!response.ok) {
    const reason = payload.error?.errors?.[0]?.reason ?? payload.error?.message ?? `YouTube API error ${response.status}`;
    const error = new Error(reason);
    Object.assign(error, {
      statusCode: response.status,
      code: "YOUTUBE_API_ERROR",
      provider: "youtube"
    });
    throw error;
  }

  const category = await prisma.category.upsert({
    where: { slug: "youtube-real-api" },
    update: {
      name: "YouTube Real API",
      description: "Data peluang video dari YouTube Data API v3.",
      sourceType: SourceType.REAL_API
    },
    create: {
      name: "YouTube Real API",
      slug: "youtube-real-api",
      description: "Data peluang video dari YouTube Data API v3.",
      sourceType: SourceType.REAL_API
    }
  });

  const items = payload.items ?? [];
  const saved = [];

  for (const item of items) {
    const videoId = item.id?.videoId;
    const snippet = item.snippet;

    if (!videoId || !snippet?.title) {
      continue;
    }

    const title = cleanText(snippet.title);
    const description = cleanText(snippet.description ?? "");
    const score = scoreYouTubeOpportunity(title, description, snippet.publishedAt);
    const slug = `youtube-${videoId}`;
    const thumbnailUrl = snippet.thumbnails?.high?.url ?? snippet.thumbnails?.medium?.url ?? snippet.thumbnails?.default?.url ?? null;

    const opportunity = await prisma.aiClipOpportunity.upsert({
      where: { slug },
      update: {
        title,
        description,
        niche: keyword,
        keyword,
        platform: Platform.YOUTUBE,
        status: ContentStatus.READY,
        performanceLevel: getPerformanceLevel(score),
        opportunityScore: score,
        trendScore: score,
        competitionScore: Math.max(35, 100 - score),
        viralPotentialScore: Math.min(100, score + 5),
        aiRecommendation: `Video YouTube real API dari channel ${snippet.channelTitle ?? "unknown"}. Cocok dianalisis untuk peluang clipping niche ${keyword}.`,
        hookIdeas: [
          `Hook cepat dari topik: ${title}`,
          "Ambil bagian paling emosional/mengejutkan untuk 3 detik pertama.",
          "Buat versi Shorts/Reels dengan subtitle besar dan CTA jelas."
        ],
        contentAngles: [
          "Edukasi singkat",
          "Trend reaction",
          "Problem-solution clip"
        ],
        thumbnailIdeas: {
          youtubeVideoId: videoId,
          thumbnailUrl,
          channelTitle: snippet.channelTitle ?? null,
          publishedAt: snippet.publishedAt ?? null
        },
        sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
        sourceType: SourceType.REAL_API,
        categoryId: category.id
      },
      create: {
        title,
        slug,
        description,
        niche: keyword,
        keyword,
        platform: Platform.YOUTUBE,
        status: ContentStatus.READY,
        performanceLevel: getPerformanceLevel(score),
        opportunityScore: score,
        trendScore: score,
        competitionScore: Math.max(35, 100 - score),
        viralPotentialScore: Math.min(100, score + 5),
        aiRecommendation: `Video YouTube real API dari channel ${snippet.channelTitle ?? "unknown"}. Cocok dianalisis untuk peluang clipping niche ${keyword}.`,
        hookIdeas: [
          `Hook cepat dari topik: ${title}`,
          "Ambil bagian paling emosional/mengejutkan untuk 3 detik pertama.",
          "Buat versi Shorts/Reels dengan subtitle besar dan CTA jelas."
        ],
        contentAngles: [
          "Edukasi singkat",
          "Trend reaction",
          "Problem-solution clip"
        ],
        thumbnailIdeas: {
          youtubeVideoId: videoId,
          thumbnailUrl,
          channelTitle: snippet.channelTitle ?? null,
          publishedAt: snippet.publishedAt ?? null
        },
        sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
        sourceType: SourceType.REAL_API,
        categoryId: category.id
      },
      include: {
        category: true,
        campaign: true
      }
    });

    saved.push(opportunity);
  }

  return {
    provider: "youtube",
    sourceType: SourceType.REAL_API,
    keyword,
    requested: limit,
    received: items.length,
    saved: saved.length,
    message: saved.length ? `Saved ${saved.length} real YouTube opportunities.` : "YouTube connected, but no videos were saved.",
    opportunities: saved
  };
}

function scoreYouTubeOpportunity(title: string, description: string, publishedAt?: string) {
  const text = `${title} ${description}`.toLowerCase();
  let score = 55;

  if (text.includes("shorts") || text.includes("#shorts")) score += 12;
  if (text.includes("viral") || text.includes("trending")) score += 10;
  if (text.includes("ai") || text.includes("chatgpt") || text.includes("veo")) score += 8;
  if (text.includes("tips") || text.includes("cara") || text.includes("tutorial")) score += 6;

  if (publishedAt) {
    const ageDays = Math.max(0, Math.floor((Date.now() - new Date(publishedAt).getTime()) / 86_400_000));
    if (ageDays <= 30) score += 10;
    else if (ageDays <= 90) score += 6;
    else if (ageDays <= 180) score += 3;
  }

  return clampNumber(score, 1, 100);
}

function getPerformanceLevel(score: number) {
  if (score >= 75) return PerformanceLevel.HIGH;
  if (score >= 55) return PerformanceLevel.MEDIUM;
  return PerformanceLevel.LOW;
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(Math.trunc(value), min), max);
}

function getOpportunityOrderBy(sort?: string | null): Prisma.AiClipOpportunityOrderByWithRelationInput[] {
  switch (sort) {
    case "opportunityScore_desc":
      return [{ opportunityScore: "desc" }, { createdAt: "desc" }];
    case "trendScore_desc":
      return [{ trendScore: "desc" }, { opportunityScore: "desc" }];
    case "viralPotentialScore_desc":
      return [{ viralPotentialScore: "desc" }, { opportunityScore: "desc" }];
    case "createdAt_asc":
      return [{ createdAt: "asc" }];
    case "createdAt_desc":
    default:
      return [{ createdAt: "desc" }];
  }
}

function getLimit(value?: string | null) {
  const parsed = Number(value ?? 50);
  if (!Number.isFinite(parsed)) {
    return 50;
  }

  return Math.min(Math.max(Math.trunc(parsed), 1), 100);
}

function getDayRange(value?: string | null): Prisma.DateTimeFilter | undefined {
  if (!value) {
    return undefined;
  }

  const start = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) {
    return undefined;
  }

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    gte: start,
    lt: end
  };
}

function parseEnumValue<T extends Record<string, string>>(value: string | null | undefined, values: T): T[keyof T] | undefined {
  if (!value || value === "All") {
    return undefined;
  }

  const normalized = value.toUpperCase().replace(/-/g, "_");
  return Object.values(values).find((item) => item === normalized) as T[keyof T] | undefined;
}

function realSourceWhere() {
  return { sourceType: { not: SourceType.DEMO } };
}

