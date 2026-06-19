import type { ApiCampaign, ApiCategory, ApiCompetitor, ApiOpportunity, ApiPublishingSchedule, ApiRecommendation, ApiStatus, DashboardOverviewData } from "../../api";

type DemoDashboardOverview = DashboardOverviewData & {
  mode: "DEMO";
  sourceType: "DEMO";
  insights: {
    engagementRate: string;
    views: string;
    avgWatchTime: string;
  };
};

export type DemoOpportunitySaveResult = ApiOpportunity & {
  message: "Demo mode: save state is temporary.";
};

const now = "2026-06-19T02:00:00.000Z";
const tomorrow = "2026-06-20T02:00:00.000Z";

export const demoCategories: ApiCategory[] = [
  { id: "demo-cat-demo-data", name: "Demo Data", slug: "demo-data", description: "Sample records for local demo mode.", isActive: true, sourceType: "DEMO" },
  { id: "demo-cat-business", name: "Business", slug: "business", description: "Business growth and creator operations.", isActive: true, sourceType: "DEMO" },
  { id: "demo-cat-finance", name: "Finance", slug: "finance", description: "Personal finance, investing, and money mindset.", isActive: true, sourceType: "DEMO" },
  { id: "demo-cat-education", name: "Education", slug: "education", description: "Explainers and learning content.", isActive: true, sourceType: "DEMO" },
  { id: "demo-cat-ai", name: "AI", slug: "ai", description: "AI tools, automation, and creator workflows.", isActive: true, sourceType: "DEMO" },
  { id: "demo-cat-islamic", name: "Islamic", slug: "islamic", description: "Islamic education and daily reminders.", isActive: true, sourceType: "DEMO" },
  { id: "demo-cat-motivation", name: "Motivation", slug: "motivation", description: "Mindset and self improvement.", isActive: true, sourceType: "DEMO" },
  { id: "demo-cat-gaming", name: "Gaming", slug: "gaming", description: "Gaming clips, news, and commentary.", isActive: true, sourceType: "DEMO" },
  { id: "demo-cat-health", name: "Health", slug: "health", description: "Fitness, nutrition, and wellness.", isActive: true, sourceType: "DEMO" },
  { id: "demo-cat-affiliate", name: "Affiliate", slug: "affiliate", description: "Affiliate content and product education.", isActive: true, sourceType: "DEMO" }
];

export const demoCampaigns: ApiCampaign[] = [
  createCampaign("demo-campaign-ai-tools", "AI Tools Launch", "ai-tools-launch", "TIKTOK", "READY", "demo-cat-ai", 8, 4),
  createCampaign("demo-campaign-morning-mindset", "Morning Mindset Clips", "morning-mindset-clips", "YOUTUBE", "SCHEDULED", "demo-cat-motivation", 5, 3),
  createCampaign("demo-campaign-finance-simple", "Finance Made Simple", "finance-made-simple", "INSTAGRAM", "READY", "demo-cat-finance", 4, 2),
  createCampaign("demo-campaign-islamic-reminders", "Daily Islamic Reminders", "daily-islamic-reminders", "TIKTOK", "DRAFT", "demo-cat-islamic", 3, 1),
  createCampaign("demo-campaign-affiliate-lab", "Affiliate Creator Lab", "affiliate-creator-lab", "FACEBOOK", "PAUSED", "demo-cat-affiliate", 2, 0)
];

let demoOpportunitiesState: ApiOpportunity[] = [
  createOpportunity(1, "AI Tools for Content Creators", "ai-tools-content-creators", "AI", "ai tools", "TIKTOK", "READY", "HIGH", 96, 94, 38, 92, true, "demo-cat-ai", "demo-campaign-ai-tools"),
  createOpportunity(2, "Building a Personal Brand", "building-a-personal-brand", "Business", "personal brand", "YOUTUBE", "READY", "HIGH", 92, 89, 42, 88, false, "demo-cat-business", "demo-campaign-morning-mindset"),
  createOpportunity(3, "Make Money Online 2026", "make-money-online-2026", "Finance", "make money online", "INSTAGRAM", "READY", "HIGH", 89, 86, 47, 84, true, "demo-cat-finance", "demo-campaign-finance-simple"),
  createOpportunity(4, "Morning Routine Secrets", "morning-routine-secrets", "Motivation", "morning routine", "TIKTOK", "SCHEDULED", "HIGH", 86, 83, 44, 82, false, "demo-cat-motivation", "demo-campaign-morning-mindset"),
  createOpportunity(5, "Remote Work Productivity", "remote-work-productivity", "Business", "remote work", "YOUTUBE", "READY", "HIGH", 82, 79, 39, 78, false, "demo-cat-business", "demo-campaign-ai-tools"),
  createOpportunity(6, "Islamic Reminder for Busy Days", "islamic-reminder-busy-days", "Islamic", "daily reminder", "TIKTOK", "READY", "MEDIUM", 80, 77, 35, 76, true, "demo-cat-islamic", "demo-campaign-islamic-reminders"),
  createOpportunity(7, "AI Automation Side Hustle", "ai-automation-side-hustle", "AI", "ai automation", "YOUTUBE", "READY", "HIGH", 79, 84, 51, 81, false, "demo-cat-ai", "demo-campaign-ai-tools"),
  createOpportunity(8, "Budgeting Rules for Beginners", "budgeting-rules-beginners", "Finance", "budgeting", "INSTAGRAM", "READY", "MEDIUM", 77, 74, 45, 72, false, "demo-cat-finance", "demo-campaign-finance-simple"),
  createOpportunity(9, "Study Faster with AI", "study-faster-with-ai", "Education", "study ai", "TIKTOK", "READY", "HIGH", 75, 81, 40, 78, false, "demo-cat-education", "demo-campaign-ai-tools"),
  createOpportunity(10, "Affiliate Hook Formula", "affiliate-hook-formula", "Affiliate", "affiliate hooks", "FACEBOOK", "READY", "MEDIUM", 74, 72, 46, 73, true, "demo-cat-affiliate", "demo-campaign-affiliate-lab"),
  createOpportunity(11, "Healthy Meal Prep in 30 Seconds", "healthy-meal-prep-30-seconds", "Health", "meal prep", "INSTAGRAM", "READY", "MEDIUM", 72, 70, 41, 69, false, "demo-cat-health", null),
  createOpportunity(12, "Gaming News Recap Format", "gaming-news-recap-format", "Gaming", "gaming news", "YOUTUBE", "DRAFT", "MEDIUM", 70, 76, 53, 71, false, "demo-cat-gaming", null),
  createOpportunity(13, "One-Minute Business Lessons", "one-minute-business-lessons", "Business", "business lessons", "TIKTOK", "READY", "MEDIUM", 69, 71, 37, 70, false, "demo-cat-business", null),
  createOpportunity(14, "Founder Mistakes to Avoid", "founder-mistakes-avoid", "Business", "founder mistakes", "INSTAGRAM", "READY", "MEDIUM", 67, 68, 43, 66, false, "demo-cat-business", null),
  createOpportunity(15, "Quran Reflection Short Format", "quran-reflection-short-format", "Islamic", "quran reflection", "TIKTOK", "SCHEDULED", "MEDIUM", 65, 66, 34, 68, false, "demo-cat-islamic", "demo-campaign-islamic-reminders"),
  createOpportunity(16, "AI Prompt Templates for Sales", "ai-prompt-templates-sales", "AI", "ai prompts", "YOUTUBE", "READY", "MEDIUM", 63, 69, 49, 67, false, "demo-cat-ai", "demo-campaign-ai-tools"),
  createOpportunity(17, "Fitness Myths Explained", "fitness-myths-explained", "Health", "fitness myths", "INSTAGRAM", "READY", "LOW", 61, 58, 36, 59, false, "demo-cat-health", null),
  createOpportunity(18, "Simple Investing Analogy", "simple-investing-analogy", "Finance", "investing analogy", "TIKTOK", "READY", "LOW", 59, 61, 42, 60, false, "demo-cat-finance", "demo-campaign-finance-simple"),
  createOpportunity(19, "Creator Desk Setup Review", "creator-desk-setup-review", "Affiliate", "desk setup", "FACEBOOK", "PAUSED", "LOW", 57, 55, 33, 56, false, "demo-cat-affiliate", "demo-campaign-affiliate-lab"),
  createOpportunity(20, "Gaming Strategy Breakdown", "gaming-strategy-breakdown", "Gaming", "gaming strategy", "YOUTUBE", "READY", "LOW", 54, 60, 52, 58, false, "demo-cat-gaming", null)
];

export const demoRecommendations: ApiRecommendation[] = [
  createRecommendation("demo-rec-1", "Push AI Tools Launch today", "Use the strongest AI tool hooks while trend score is above 90.", "HIGH", "GROWTH", "Open Campaign"),
  createRecommendation("demo-rec-2", "Batch finance explainers", "Finance topics are stable and should be batched into three short clips.", "MEDIUM", "CONTENT", "Create Clips"),
  createRecommendation("demo-rec-3", "Save Islamic reminder winners", "Three reminder formats have high retention potential for evening publishing.", "HIGH", "PUBLISHING", "Schedule"),
  createRecommendation("demo-rec-4", "Refresh affiliate hooks", "Affiliate opportunities need clearer product proof and stronger first line.", "MEDIUM", "CAMPAIGN", "Improve Hooks"),
  createRecommendation("demo-rec-5", "Avoid low clarity gaming clips", "Gaming ideas with high competition should be narrowed to specific tactics.", "LOW", "WARNING", "Review"),
  createRecommendation("demo-rec-6", "Turn education posts into carousels", "Study content can become short video plus carousel for Instagram.", "MEDIUM", "CONTENT", "Repurpose"),
  createRecommendation("demo-rec-7", "Prioritize saved opportunities", "Saved demo items are ready to move into clip production.", "HIGH", "NICHE", "View Saved"),
  createRecommendation("demo-rec-8", "Schedule weekend motivation", "Motivation content performs better in morning slots this week.", "LOW", "PUBLISHING", "Open Calendar")
];

export const demoPublishingSchedules: ApiPublishingSchedule[] = [
  createSchedule(1, "AI Tools You Need", "SHORTS", "TIKTOK", "SCHEDULED", "2026-06-19T02:00:00.000Z", "demo-campaign-ai-tools", "demo-opp-1"),
  createSchedule(2, "Mindset Shift", "REELS", "YOUTUBE", "SCHEDULED", "2026-06-19T04:00:00.000Z", "demo-campaign-morning-mindset", "demo-opp-4"),
  createSchedule(3, "Budget Rule", "REELS", "INSTAGRAM", "PUBLISHED", "2026-06-19T06:00:00.000Z", "demo-campaign-finance-simple", "demo-opp-8"),
  createSchedule(4, "Daily Reminder", "SHORTS", "TIKTOK", "SCHEDULED", "2026-06-20T02:00:00.000Z", "demo-campaign-islamic-reminders", "demo-opp-6"),
  createSchedule(5, "Affiliate Hook", "POST", "FACEBOOK", "DRAFT", "2026-06-20T05:00:00.000Z", "demo-campaign-affiliate-lab", "demo-opp-10"),
  createSchedule(6, "Study Faster", "SHORTS", "TIKTOK", "SCHEDULED", "2026-06-21T03:00:00.000Z", "demo-campaign-ai-tools", "demo-opp-9"),
  createSchedule(7, "Founder Mistakes", "REELS", "INSTAGRAM", "SCHEDULED", "2026-06-21T07:00:00.000Z", null, "demo-opp-14"),
  createSchedule(8, "Gaming Recap", "SHORTS", "YOUTUBE", "SCHEDULED", "2026-06-22T08:00:00.000Z", null, "demo-opp-12"),
  createSchedule(9, "Meal Prep Fast", "REELS", "INSTAGRAM", "PUBLISHED", "2026-06-22T10:00:00.000Z", null, "demo-opp-11"),
  createSchedule(10, "AI Prompt Sales", "SHORTS", "YOUTUBE", "FAILED", "2026-06-23T03:30:00.000Z", "demo-campaign-ai-tools", "demo-opp-16")
];

export const demoCompetitors: ApiCompetitor[] = [
  createCompetitor("demo-competitor-1", "Creator Ops Daily", "TIKTOK", "@creatorops", "AI", 820000, 185000, 6.8),
  createCompetitor("demo-competitor-2", "Finance Shorts Lab", "INSTAGRAM", "@financeshortslab", "Finance", 540000, 98000, 5.9),
  createCompetitor("demo-competitor-3", "Mindset Minute", "YOUTUBE", "@mindsetminute", "Motivation", 1200000, 260000, 7.1),
  createCompetitor("demo-competitor-4", "Halal Growth Clips", "TIKTOK", "@halalgrowth", "Islamic", 410000, 87000, 6.2),
  createCompetitor("demo-competitor-5", "Affiliate Proof", "FACEBOOK", "@affiliateproof", "Affiliate", 230000, 44000, 4.8)
];

export const demoInsights = {
  engagementRate: "5.6%",
  views: "245.3K",
  avgWatchTime: "00:42"
};

export function getDemoDashboardOverview(): DemoDashboardOverview {
  return {
    mode: "DEMO",
    sourceType: "DEMO",
    totals: {
      campaigns: demoCampaigns.length,
      opportunities: demoOpportunitiesState.length,
      savedOpportunities: demoOpportunitiesState.filter((item) => item.isSaved).length,
      scheduledPosts: demoPublishingSchedules.filter((item) => item.status === "SCHEDULED").length,
      publishedPosts: demoPublishingSchedules.filter((item) => item.status === "PUBLISHED").length,
      failedPosts: demoPublishingSchedules.filter((item) => item.status === "FAILED").length
    },
    topCategories: demoCategories.slice(0, 5).map((category) => ({
      ...category,
      opportunities: demoOpportunitiesState.filter((item) => item.categoryId === category.id).length
    })),
    latestRecommendations: demoRecommendations.slice(0, 5),
    insights: demoInsights
  };
}

export function getDemoRecommendations() {
  return demoRecommendations.map(clone);
}

export function getDemoCampaigns() {
  return demoCampaigns.map(clone);
}

export function getDemoPublishingCalendar(filters: { platform?: string | null; status?: string | null; date?: string | null }) {
  return demoPublishingSchedules
    .filter((item) => matchesEnum(item.platform, filters.platform))
    .filter((item) => matchesEnum(item.status, filters.status))
    .filter((item) => !filters.date || item.scheduledAt.startsWith(filters.date))
    .map(clone);
}

export function getDemoCategories() {
  return demoCategories.map(clone);
}

export function getDemoCompetitors(filters: { platform?: string | null; niche?: string | null } = {}) {
  const niche = filters.niche?.trim().toLowerCase();

  return demoCompetitors
    .filter((item) => matchesEnum(item.platform, filters.platform))
    .filter((item) => !niche || item.niche.toLowerCase().includes(niche))
    .map(clone);
}

export function getDemoOpportunities(filters: {
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
} = {}) {
  const keyword = filters.keyword?.trim().toLowerCase();
  const categoryFilter = filters.category;
  const campaignFilter = filters.campaign;
  let rows = demoOpportunitiesState.filter((item) => {
    const category = item.category;
    const campaign = item.campaign;
    const matchesKeyword =
      !keyword ||
      item.title.toLowerCase().includes(keyword) ||
      item.description?.toLowerCase().includes(keyword) ||
      item.keyword.toLowerCase().includes(keyword) ||
      item.niche.toLowerCase().includes(keyword);
    const matchesCategory =
      !categoryFilter ||
      categoryFilter === "All" ||
      categoryFilter === "Demo Data" ||
      [category?.id, category?.slug, category?.name, item.categoryId].some((value) => sameFilter(value, categoryFilter));
    const matchesCampaign =
      !campaignFilter ||
      campaignFilter === "All" ||
      [campaign?.id, campaign?.slug, campaign?.name, item.campaignId].some((value) => sameFilter(value, campaignFilter));
    const matchesSaved = filters.saved === "true" ? item.isSaved : filters.saved === "false" ? !item.isSaved : true;

    return (
      matchesKeyword &&
      matchesCategory &&
      matchesCampaign &&
      matchesSaved &&
      matchesEnum(item.platform, filters.platform) &&
      matchesEnum(item.status, filters.status) &&
      matchesEnum(item.performanceLevel, filters.performance) &&
      (!filters.date || item.createdAt?.startsWith(filters.date))
    );
  });

  rows = sortOpportunities(rows, filters.sort);

  return rows.slice(0, getLimit(filters.limit)).map(clone);
}

export function setDemoOpportunitySaved(id: string, saved?: boolean): DemoOpportunitySaveResult | null {
  const index = demoOpportunitiesState.findIndex((item) => item.id === id);
  if (index === -1) {
    return null;
  }

  const nextSaved = typeof saved === "boolean" ? saved : !demoOpportunitiesState[index].isSaved;
  demoOpportunitiesState = demoOpportunitiesState.map((item, itemIndex) =>
    itemIndex === index
      ? {
          ...item,
          isSaved: nextSaved,
          savedAt: nextSaved ? new Date().toISOString() : null
        }
      : item
  );

  return {
    ...clone(demoOpportunitiesState[index]),
    message: "Demo mode: save state is temporary."
  };
}

function createCampaign(id: string, name: string, slug: string, platform: ApiCampaign["platform"], status: ApiStatus, categoryId: string, opportunities: number, publishingSchedules: number): ApiCampaign {
  const category = demoCategories.find((item) => item.id === categoryId) ?? null;

  return {
    id,
    name,
    slug,
    description: `${name} demo campaign for local dashboard mode.`,
    platform,
    status,
    startDate: now,
    endDate: tomorrow,
    sourceType: "DEMO",
    category,
    _count: {
      opportunities,
      publishingSchedules
    }
  };
}

function createOpportunity(index: number, title: string, slug: string, niche: string, keyword: string, platform: ApiOpportunity["platform"], status: ApiStatus, performanceLevel: ApiOpportunity["performanceLevel"], opportunityScore: number, trendScore: number, competitionScore: number, viralPotentialScore: number, isSaved: boolean, categoryId: string, campaignId: string | null): ApiOpportunity {
  const category = demoCategories.find((item) => item.id === categoryId) ?? null;
  const campaign = campaignId ? demoCampaigns.find((item) => item.id === campaignId) ?? null : null;

  return {
    id: `demo-opp-${index}`,
    title,
    slug,
    description: `Demo opportunity for ${niche.toLowerCase()} clips with a ready short-form angle.`,
    niche,
    keyword,
    platform,
    status,
    performanceLevel,
    opportunityScore,
    trendScore,
    competitionScore,
    viralPotentialScore,
    aiRecommendation: `Open with a specific pain point, then show one concrete ${niche.toLowerCase()} takeaway in under 30 seconds.`,
    hookIdeas: ["Stop scrolling if you want this result", "Most creators miss this simple angle"],
    contentAngles: ["Problem-solution", "Before-after", "Checklist"],
    thumbnailIdeas: ["Bold keyword plus face reaction"],
    sourceUrl: null,
    sourceType: "DEMO",
    isSaved,
    savedAt: isSaved ? now : null,
    categoryId,
    campaignId,
    category,
    campaign,
    createdAt: `2026-06-${String(10 + (index % 10)).padStart(2, "0")}T02:00:00.000Z`,
    updatedAt: now
  };
}

function createRecommendation(id: string, title: string, summary: string, priority: ApiRecommendation["priority"], recommendationType: ApiRecommendation["recommendationType"], actionLabel: string): ApiRecommendation {
  return {
    id,
    title,
    summary,
    priority,
    recommendationType,
    actionLabel,
    actionTarget: null,
    sourceType: "DEMO",
    isRead: false,
    createdAt: now
  };
}

function createSchedule(index: number, title: string, contentType: ApiPublishingSchedule["contentType"], platform: ApiPublishingSchedule["platform"], status: ApiStatus, scheduledAt: string, campaignId: string | null, opportunityId: string | null): ApiPublishingSchedule {
  return {
    id: `demo-schedule-${index}`,
    title,
    contentType,
    platform,
    status,
    scheduledAt,
    publishedAt: status === "PUBLISHED" ? scheduledAt : null,
    sourceType: "DEMO",
    campaign: campaignId ? demoCampaigns.find((item) => item.id === campaignId) ?? null : null,
    opportunity: opportunityId ? demoOpportunitiesState.find((item) => item.id === opportunityId) ?? null : null
  };
}

function createCompetitor(id: string, name: string, platform: ApiCompetitor["platform"], handle: string, niche: string, followers: number, avgViews: number, avgEngagement: number): ApiCompetitor {
  return {
    id,
    name,
    platform,
    handle,
    profileUrl: null,
    niche,
    followers,
    avgViews,
    avgEngagement,
    contentPattern: ["Short hooks", "Clear CTA", "Series format"],
    strengths: ["Fast pacing", "Strong thumbnails"],
    weaknesses: ["Repeated angles", "Low comment replies"],
    sourceType: "DEMO"
  };
}

function sortOpportunities(rows: ApiOpportunity[], sort?: string | null) {
  const nextRows = [...rows];
  switch (sort) {
    case "opportunityScore_desc":
      return nextRows.sort((a, b) => b.opportunityScore - a.opportunityScore);
    case "trendScore_desc":
      return nextRows.sort((a, b) => b.trendScore - a.trendScore || b.opportunityScore - a.opportunityScore);
    case "viralPotentialScore_desc":
      return nextRows.sort((a, b) => b.viralPotentialScore - a.viralPotentialScore || b.opportunityScore - a.opportunityScore);
    case "createdAt_asc":
      return nextRows.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    case "createdAt_desc":
    default:
      return nextRows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }
}

function getLimit(value?: string | null) {
  const parsed = Number(value ?? 50);
  if (!Number.isFinite(parsed)) {
    return 50;
  }

  return Math.min(Math.max(Math.trunc(parsed), 1), 100);
}

function matchesEnum(actual: string, expected?: string | null) {
  if (!expected || expected === "All") {
    return true;
  }

  return normalize(actual) === normalize(expected);
}

function sameFilter(actual: string | null | undefined, expected: string) {
  return typeof actual === "string" && normalize(actual) === normalize(expected);
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[\s_]+/g, "-");
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
