import { ContentStatus, PerformanceLevel, Platform, Prisma } from "@prisma/client";
import { getDemoCategories, getDemoCompetitors, getDemoOpportunities, setDemoOpportunitySaved } from "../demo/demo-data";
import { isDatabaseConfigured, prisma } from "../db/prisma";

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
  if (!isDatabaseConfigured()) {
    return getDemoCategories();
  }

  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" }
  });
}

export function getCompetitors(filters: CompetitorFilters = {}) {
  if (!isDatabaseConfigured()) {
    return getDemoCompetitors(filters);
  }

  const where: Prisma.CompetitorProfileWhereInput = {};
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
  if (!isDatabaseConfigured()) {
    return getDemoOpportunities(filters);
  }

  const where: Prisma.AiClipOpportunityWhereInput = {};
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

  if (filters.category && filters.category !== "Demo Data" && filters.category !== "All") {
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
  if (!isDatabaseConfigured()) {
    return setDemoOpportunitySaved(id, saved);
  }

  const current = await prisma.aiClipOpportunity.findUnique({
    where: { id },
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
