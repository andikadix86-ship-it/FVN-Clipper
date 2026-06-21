import { ContentStatus, Platform, Prisma, SourceType } from "@prisma/client";
import { assertDatabaseConfigured, prisma } from "../db/prisma";

export interface PublishingCalendarFilters {
  platform?: string | null;
  status?: string | null;
  date?: string | null;
}

export async function getDashboardOverview() {
  assertDatabaseConfigured();

  const realDataWhere = realSourceWhere();

  const [totalCampaigns, totalOpportunities, savedOpportunities, scheduledPosts, publishedPosts, failedPosts, topCategories, latestRecommendations] = await Promise.all([
    prisma.campaign.count({ where: realDataWhere }),
    prisma.aiClipOpportunity.count({ where: realDataWhere }),
    prisma.aiClipOpportunity.count({ where: { ...realDataWhere, isSaved: true } }),
    prisma.publishingSchedule.count({ where: { ...realDataWhere, status: ContentStatus.SCHEDULED } }),
    prisma.publishingSchedule.count({ where: { ...realDataWhere, status: ContentStatus.PUBLISHED } }),
    prisma.publishingSchedule.count({ where: { ...realDataWhere, status: ContentStatus.FAILED } }),
    prisma.category.findMany({
      where: { ...realDataWhere, isActive: true },
      include: {
        _count: {
          select: { opportunities: { where: realSourceWhere() } }
        }
      },
      orderBy: {
        opportunities: {
          _count: "desc"
        }
      },
      take: 5
    }),
    prisma.dashboardRecommendation.findMany({
      where: realDataWhere,
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      take: 5
    })
  ]);

  return {
    sourceType: "REAL_API" as const,
    totals: {
      campaigns: totalCampaigns,
      opportunities: totalOpportunities,
      savedOpportunities,
      scheduledPosts,
      publishedPosts,
      failedPosts
    },
    topCategories: topCategories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      sourceType: category.sourceType,
      opportunities: category._count.opportunities
    })),
    latestRecommendations
  };
}

export function getDashboardRecommendations() {
  assertDatabaseConfigured();

  return prisma.dashboardRecommendation.findMany({
    where: realSourceWhere(),
    orderBy: [{ isRead: "asc" }, { priority: "asc" }, { createdAt: "desc" }]
  });
}

export function getDashboardCampaigns() {
  assertDatabaseConfigured();

  return prisma.campaign.findMany({
    where: realSourceWhere(),
    include: {
      category: true,
      _count: {
        select: {
          opportunities: true,
          publishingSchedules: true
        }
      }
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }]
  });
}

export function getPublishingCalendar(filters: PublishingCalendarFilters) {
  assertDatabaseConfigured();

  const where: Prisma.PublishingScheduleWhereInput = realSourceWhere();
  const platform = parseEnumValue(filters.platform, Platform);
  const status = parseEnumValue(filters.status, ContentStatus);

  if (platform && platform !== Platform.ALL) {
    where.platform = platform;
  }

  if (status) {
    where.status = status;
  }

  const dateRange = getDayRange(filters.date);
  if (dateRange) {
    where.scheduledAt = dateRange;
  }

  return prisma.publishingSchedule.findMany({
    where,
    include: {
      campaign: true,
      opportunity: true
    },
    orderBy: { scheduledAt: "asc" }
  });
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
