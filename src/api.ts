import type { Campaign, ScheduleItem, VideoOpportunity } from "./types";

export type SourceType = "DEMO" | "MANUAL" | "CSV_IMPORT" | "REAL_API";
export type ApiStatus = "DRAFT" | "READY" | "SCHEDULED" | "PUBLISHED" | "FAILED" | "PAUSED";
export type ApiPlatform = "ALL" | "YOUTUBE" | "TIKTOK" | "INSTAGRAM" | "FACEBOOK";
export type ApiPerformance = "HIGH" | "MEDIUM" | "LOW";

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  sourceType: SourceType;
}

export interface ApiCampaign {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  platform: ApiPlatform;
  status: ApiStatus;
  startDate?: string | null;
  endDate?: string | null;
  sourceType: SourceType;
  category?: ApiCategory | null;
  _count?: {
    opportunities?: number;
    publishingSchedules?: number;
  };
}

export interface ApiOpportunity {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  niche: string;
  keyword: string;
  platform: ApiPlatform;
  status: ApiStatus;
  performanceLevel: ApiPerformance;
  opportunityScore: number;
  trendScore: number;
  competitionScore: number;
  viralPotentialScore: number;
  aiRecommendation: string;
  hookIdeas: unknown;
  contentAngles: unknown;
  thumbnailIdeas?: unknown;
  sourceUrl?: string | null;
  sourceType: SourceType;
  isSaved: boolean;
  savedAt?: string | null;
  categoryId?: string | null;
  campaignId?: string | null;
  category?: ApiCategory | null;
  campaign?: ApiCampaign | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiRecommendation {
  id: string;
  title: string;
  summary: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  recommendationType: "NICHE" | "CAMPAIGN" | "CONTENT" | "PUBLISHING" | "WARNING" | "GROWTH";
  actionLabel?: string | null;
  actionTarget?: string | null;
  sourceType: SourceType;
  isRead: boolean;
  createdAt: string;
}

export interface ApiPublishingSchedule {
  id: string;
  title: string;
  contentType: "CLIP" | "IMAGE" | "STORY" | "SHORTS" | "REELS" | "POST";
  platform: Exclude<ApiPlatform, "ALL">;
  status: ApiStatus;
  scheduledAt: string;
  publishedAt?: string | null;
  sourceType: SourceType;
  campaign?: ApiCampaign | null;
  opportunity?: ApiOpportunity | null;
}

export interface ApiCompetitor {
  id: string;
  name: string;
  platform: ApiPlatform;
  handle?: string | null;
  profileUrl?: string | null;
  niche: string;
  followers?: number | null;
  avgViews?: number | null;
  avgEngagement?: number | null;
  contentPattern?: unknown;
  strengths?: unknown;
  weaknesses?: unknown;
  sourceType: SourceType;
}

export interface DashboardOverviewData {
  totals: {
    campaigns: number;
    opportunities: number;
    savedOpportunities: number;
    scheduledPosts: number;
    publishedPosts: number;
    failedPosts: number;
  };
  topCategories: Array<ApiCategory & { opportunities: number }>;
  latestRecommendations: ApiRecommendation[];
}

export interface OpportunityQuery {
  keyword?: string;
  category?: string;
  platform?: string;
  status?: string;
  date?: string;
  performance?: string;
  campaign?: string;
  saved?: boolean;
  limit?: number;
  sort?: string;
}

export async function fetchApiData<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, init);
  const payload = (await response.json()) as { data: T; error?: string | null };

  if (!response.ok || payload.error) {
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }

  return payload.data;
}

export function buildOpportunityUrl(query: OpportunityQuery = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "All" || value === "Demo Data") {
      return;
    }
    params.set(key, String(value));
  });

  const search = params.toString();
  return `/api/ai-clip-intelligence/opportunities${search ? `?${search}` : ""}`;
}

export function mapOpportunity(item: ApiOpportunity): VideoOpportunity {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    description: item.description,
    channel: item.campaign?.name ?? item.category?.name ?? "Database Source",
    platform: formatEnumLabel(item.platform),
    niche: item.niche,
    keyword: item.keyword,
    status: item.isSaved ? "Saved" : mapStatus(item.status),
    views: `${item.trendScore}% trend`,
    engagement: `${item.viralPotentialScore}% viral`,
    viralScore: item.viralPotentialScore,
    clippingScore: item.opportunityScore,
    analysis: item.aiRecommendation,
    thumbnail: getInitials(item.title),
    sourceType: item.sourceType,
    isSaved: item.isSaved,
    savedAt: item.savedAt,
    categoryId: item.categoryId,
    campaignId: item.campaignId,
    categorySlug: item.category?.slug,
    campaignSlug: item.campaign?.slug,
    aiRecommendation: item.aiRecommendation,
    opportunityScore: item.opportunityScore,
    trendScore: item.trendScore,
    competitionScore: item.competitionScore,
    performanceLevel: item.performanceLevel
  };
}

export function mapCampaign(item: ApiCampaign): Campaign {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description,
    platform: formatEnumLabel(item.platform),
    start: formatDateShort(item.startDate),
    end: formatDateShort(item.endDate),
    progress: Math.min(((item._count?.publishingSchedules ?? 0) + 1) * 18, 100),
    compliance: item.status === "FAILED" ? 62 : item.status === "DRAFT" ? 78 : 92,
    status: mapCampaignStatus(item.status),
    sourceType: item.sourceType
  };
}

export function mapSchedule(item: ApiPublishingSchedule): ScheduleItem {
  const scheduledAt = new Date(item.scheduledAt);

  return {
    id: item.id,
    title: item.title,
    account: item.campaign?.name ?? "Database Calendar",
    platform: formatEnumLabel(item.platform),
    day: Number.isNaN(scheduledAt.getTime()) ? "Thu" : scheduledAt.toLocaleDateString("en-US", { weekday: "short" }),
    time: Number.isNaN(scheduledAt.getTime()) ? "--:--" : scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    status: mapScheduleStatus(item.status),
    scheduledAt: item.scheduledAt,
    sourceType: item.sourceType
  };
}

export function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function mapStatus(status: ApiStatus): VideoOpportunity["status"] {
  const map: Record<ApiStatus, VideoOpportunity["status"]> = {
    DRAFT: "Draft",
    READY: "Ready",
    SCHEDULED: "Scheduled",
    PUBLISHED: "Published",
    FAILED: "Failed",
    PAUSED: "Paused"
  };

  return map[status];
}

export function toApiPlatform(value: string) {
  return toApiEnum(value);
}

export function toApiStatus(value: string) {
  return toApiEnum(value);
}

export function toApiPerformance(value: string) {
  return toApiEnum(value);
}

function mapCampaignStatus(status: ApiStatus): Campaign["status"] {
  const map: Record<ApiStatus, Campaign["status"]> = {
    DRAFT: "Draft",
    READY: "Ready",
    SCHEDULED: "Scheduled",
    PUBLISHED: "Published",
    FAILED: "Failed",
    PAUSED: "Paused"
  };

  return map[status];
}

function mapScheduleStatus(status: ApiStatus): ScheduleItem["status"] {
  const map: Record<ApiStatus, ScheduleItem["status"]> = {
    DRAFT: "Draft",
    READY: "Ready",
    SCHEDULED: "Scheduled",
    PUBLISHED: "Published",
    FAILED: "Failed",
    PAUSED: "Paused"
  };

  return map[status];
}

function toApiEnum(value: string) {
  return value.toUpperCase().replace(/\s+/g, "_").replace(/-/g, "_");
}

function formatDateShort(value?: string | null) {
  if (!value) {
    return "Draft";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Draft";
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
