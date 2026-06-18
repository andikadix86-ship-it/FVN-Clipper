import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  ["Demo Data", "demo-data", "Default demo category for local UI and seed records."],
  ["Business", "business", "Business clips, creator operations, and growth workflows."],
  ["Finance", "finance", "Finance education and money management content."],
  ["Education", "education", "Learning, study, and tutorial content."],
  ["AI", "ai", "AI tools, automation, and prompt workflows."],
  ["Islamic", "islamic", "Islamic education, productivity, and creator content."],
  ["Motivation", "motivation", "Mindset, focus, and discipline clips."],
  ["Gaming", "gaming", "Gaming creator and setup content."],
  ["Health", "health", "Health, wellness, and lifestyle content."],
  ["Affiliate", "affiliate", "Affiliate marketing and product-led clips."]
];

const campaigns = [
  ["AI Tools Ramadan Launch", "ai-tools-ramadan-launch", "Demo campaign for AI short-form content.", "TIKTOK", "READY", "ai", "2026-06-18", "2026-07-02"],
  ["Finance Shorts Sprint", "finance-shorts-sprint", "Finance clips for Instagram and Facebook.", "INSTAGRAM", "SCHEDULED", "finance", "2026-06-20", "2026-07-08"],
  ["Motivation Evergreen", "motivation-evergreen", "Always-on motivation content campaign.", "FACEBOOK", "PUBLISHED", "motivation", "2026-06-12", "2026-06-30"],
  ["Affiliate Product Clips", "affiliate-product-clips", "Affiliate product clips and CTA tests.", "YOUTUBE", "DRAFT", "affiliate", "2026-06-24", "2026-07-14"],
  ["Business Creator Growth", "business-creator-growth", "Business content for multi-platform republishing.", "ALL", "READY", "business", "2026-06-21", "2026-07-21"]
];

const opportunityTitles = [
  ["AI tools for small business growth in 2026", "ai-tools-small-business-growth-2026", "AI", "ai tools", "YOUTUBE", "READY", "HIGH", 96, 93, 38, 95, "ai-tools-ramadan-launch"],
  ["Morning habits that improve focus and discipline", "morning-habits-focus-discipline", "Motivation", "morning habits", "TIKTOK", "READY", "HIGH", 91, 88, 42, 90, "motivation-evergreen"],
  ["Beginner finance mistakes and fast fixes", "beginner-finance-mistakes-fast-fixes", "Finance", "finance mistakes", "INSTAGRAM", "SCHEDULED", "MEDIUM", 84, 81, 48, 83, "finance-shorts-sprint"],
  ["Islamic productivity lessons for creators", "islamic-productivity-lessons-creators", "Islamic", "islamic productivity", "FACEBOOK", "READY", "MEDIUM", 82, 80, 44, 85, null],
  ["Seven AI automations creators can build today", "seven-ai-automations-creators-build-today", "AI", "ai automations", "YOUTUBE", "READY", "HIGH", 94, 92, 36, 93, "ai-tools-ramadan-launch"],
  ["The cashflow rule every beginner ignores", "cashflow-rule-beginner-ignores", "Finance", "cashflow", "TIKTOK", "READY", "HIGH", 89, 86, 45, 88, "finance-shorts-sprint"],
  ["Study faster with the 20 minute recall loop", "study-faster-20-minute-recall-loop", "Education", "study faster", "INSTAGRAM", "DRAFT", "MEDIUM", 78, 74, 52, 79, null],
  ["One prompt that plans your entire content week", "one-prompt-plans-content-week", "AI", "content prompt", "YOUTUBE", "READY", "HIGH", 93, 91, 40, 92, "ai-tools-ramadan-launch"],
  ["Calm morning routine for Muslim entrepreneurs", "calm-morning-routine-muslim-entrepreneurs", "Islamic", "morning routine", "FACEBOOK", "DRAFT", "MEDIUM", 80, 78, 46, 82, null],
  ["Affiliate landing page mistakes killing conversions", "affiliate-landing-page-mistakes-conversions", "Affiliate", "landing page", "TIKTOK", "READY", "HIGH", 87, 84, 43, 86, "affiliate-product-clips"],
  ["The hook formula used by top Shorts creators", "hook-formula-top-shorts-creators", "Business", "hook formula", "YOUTUBE", "READY", "HIGH", 92, 89, 37, 91, "business-creator-growth"],
  ["Healthy meal prep without counting calories", "healthy-meal-prep-without-counting-calories", "Health", "meal prep", "INSTAGRAM", "DRAFT", "LOW", 70, 68, 58, 72, null],
  ["Gaming setup upgrades under 50 dollars", "gaming-setup-upgrades-under-50-dollars", "Gaming", "gaming setup", "TIKTOK", "READY", "HIGH", 95, 93, 35, 94, "affiliate-product-clips"],
  ["Breaking down creator economy news", "creator-economy-news-breakdown", "Business", "creator economy", "FACEBOOK", "DRAFT", "MEDIUM", 76, 79, 55, 74, "business-creator-growth"],
  ["The simplest KPI dashboard for solo businesses", "simplest-kpi-dashboard-solo-businesses", "Business", "kpi dashboard", "YOUTUBE", "READY", "MEDIUM", 83, 79, 49, 82, "business-creator-growth"],
  ["How to remember every book you read", "remember-every-book-you-read", "Education", "reading system", "INSTAGRAM", "READY", "HIGH", 88, 86, 41, 87, null],
  ["Three duas for focus and discipline", "three-duas-focus-discipline", "Islamic", "duas focus", "TIKTOK", "READY", "HIGH", 86, 84, 42, 88, null],
  ["Why your reels stop at 300 views", "why-reels-stop-at-300-views", "Business", "reels growth", "INSTAGRAM", "READY", "HIGH", 90, 87, 39, 90, "business-creator-growth"],
  ["Beginner AI agent tutorial for marketers", "beginner-ai-agent-tutorial-marketers", "AI", "ai agent", "YOUTUBE", "READY", "HIGH", 97, 94, 34, 96, "ai-tools-ramadan-launch"],
  ["Side hustle myths that keep people stuck", "side-hustle-myths-keep-people-stuck", "Motivation", "side hustle", "TIKTOK", "DRAFT", "MEDIUM", 81, 80, 50, 82, "motivation-evergreen"],
  ["Islamic finance basics for young creators", "islamic-finance-basics-young-creators", "Finance", "islamic finance", "FACEBOOK", "READY", "MEDIUM", 79, 77, 47, 81, "finance-shorts-sprint"],
  ["AI thumbnail prompts for YouTube Shorts", "ai-thumbnail-prompts-youtube-shorts", "AI", "thumbnail prompts", "YOUTUBE", "READY", "HIGH", 89, 90, 44, 89, "ai-tools-ramadan-launch"],
  ["Desk productivity setup for remote founders", "desk-productivity-setup-remote-founders", "Business", "remote setup", "INSTAGRAM", "SCHEDULED", "MEDIUM", 82, 78, 48, 80, "business-creator-growth"],
  ["Low budget affiliate content system", "low-budget-affiliate-content-system", "Affiliate", "affiliate content", "TIKTOK", "READY", "HIGH", 88, 85, 41, 87, "affiliate-product-clips"],
  ["Student workflow using AI note summaries", "student-workflow-ai-note-summaries", "Education", "ai notes", "YOUTUBE", "DRAFT", "MEDIUM", 77, 74, 53, 78, null],
  ["Healthy sleep habits for creator burnout", "healthy-sleep-habits-creator-burnout", "Health", "sleep habits", "INSTAGRAM", "DRAFT", "LOW", 69, 66, 57, 70, null],
  ["Gaming highlight edits that increase retention", "gaming-highlight-edits-increase-retention", "Gaming", "gaming edits", "YOUTUBE", "READY", "HIGH", 90, 88, 40, 91, null],
  ["Facebook reels CTA examples for service businesses", "facebook-reels-cta-service-businesses", "Business", "facebook cta", "FACEBOOK", "READY", "MEDIUM", 80, 78, 46, 79, "business-creator-growth"],
  ["Motivation script structure for 30 second clips", "motivation-script-structure-30-second-clips", "Motivation", "motivation script", "TIKTOK", "READY", "HIGH", 85, 83, 44, 86, "motivation-evergreen"],
  ["Affiliate product comparison clips that convert", "affiliate-product-comparison-clips-convert", "Affiliate", "product comparison", "INSTAGRAM", "SCHEDULED", "HIGH", 87, 84, 43, 88, "affiliate-product-clips"]
];

const recommendations = [
  ["Prioritize AI automation clips today", "AI automation opportunities have the highest demo opportunity scores.", "HIGH", "NICHE", "Open Top 20", "/ai-clip-intelligence/top-20-opportunities"],
  ["Schedule TikTok finance clips before evening", "Finance Shorts Sprint has scheduled content waiting for evening slots.", "MEDIUM", "PUBLISHING", "Open Calendar", "/dashboard/publishing-calendar-preview"],
  ["Review affiliate CTA quality", "Affiliate Product Clips has high opportunity but needs stronger CTA variants.", "MEDIUM", "CAMPAIGN", "Review Campaign", "/dashboard/campaign-overview"],
  ["Save top gaming product ideas", "Gaming setup topics show strong affiliate angle potential.", "HIGH", "CONTENT", "Save Opportunities", "/ai-clip-intelligence/opportunities?saved=true"],
  ["Connect real API sources before auto posting", "Current data source is DEMO. Real APIs are not connected yet.", "HIGH", "WARNING", "Open Settings", "/settings/social-integrations"],
  ["Use Islamic productivity as niche test", "Islamic productivity has medium competition and strong retention signals.", "MEDIUM", "NICHE", "Explore Niche", "/ai-clip-intelligence/niche-explorer"],
  ["Publish education clips as carousel-style shorts", "Education demos show strong save/share potential.", "LOW", "GROWTH", "Open Advisor", "/ai-clip-intelligence/ai-advisor"],
  ["Refresh campaign calendar", "Several demo schedules are ready for calendar preview.", "MEDIUM", "PUBLISHING", "Open Calendar", "/dashboard/publishing-calendar-preview"],
  ["Build competitor benchmark from YouTube demos", "YouTube competitor profiles have the largest audience baseline.", "LOW", "GROWTH", "Open Competitors", "/ai-clip-intelligence/competitor-intelligence"],
  ["Use Top 20 list for clip selection", "Sort by opportunityScore desc and start from the first 20 records.", "HIGH", "CONTENT", "Open Top 20", "/ai-clip-intelligence/top-20-opportunities"]
];

const competitors = [
  ["Future Stack Daily", "YOUTUBE", "@futurestack", "AI", 820000, 180000, 9.4],
  ["Momentum Lab", "TIKTOK", "@momentumlab", "Motivation", 540000, 126000, 12.1],
  ["Pocket CFO", "INSTAGRAM", "@pocketcfo", "Finance", 310000, 79000, 8.9],
  ["Barakah Studio", "FACEBOOK", "@barakahstudio", "Islamic", 220000, 61000, 10.8],
  ["Creator Ops", "YOUTUBE", "@creatorops", "AI", 690000, 144000, 11.3],
  ["Desk Quest", "TIKTOK", "@deskquest", "Gaming", 760000, 173000, 13.6],
  ["Offer Lab", "TIKTOK", "@offerlab", "Affiliate", 290000, 68000, 9.1],
  ["Learning Loop", "INSTAGRAM", "@learningloop", "Education", 430000, 98000, 11.8]
];

const scheduleTemplates = [
  ["AI CRM in 30 seconds", "SHORTS", "YOUTUBE", "SCHEDULED", "ai-tools-ramadan-launch", "ai-tools-small-business-growth-2026"],
  ["Three budget rules", "REELS", "INSTAGRAM", "SCHEDULED", "finance-shorts-sprint", "beginner-finance-mistakes-fast-fixes"],
  ["Discipline hook test", "CLIP", "TIKTOK", "PUBLISHED", "motivation-evergreen", "morning-habits-focus-discipline"],
  ["Health myth opener", "REELS", "INSTAGRAM", "DRAFT", null, "healthy-meal-prep-without-counting-calories"],
  ["Gaming setup affiliate", "CLIP", "TIKTOK", "READY", "affiliate-product-clips", "gaming-setup-upgrades-under-50-dollars"],
  ["Learning AI basics", "SHORTS", "YOUTUBE", "READY", null, "student-workflow-ai-note-summaries"],
  ["Creator KPI checklist", "POST", "FACEBOOK", "SCHEDULED", "business-creator-growth", "simplest-kpi-dashboard-solo-businesses"],
  ["Affiliate CTA test", "REELS", "INSTAGRAM", "FAILED", "affiliate-product-clips", "affiliate-product-comparison-clips-convert"],
  ["AI agent tutorial cut", "SHORTS", "YOUTUBE", "SCHEDULED", "ai-tools-ramadan-launch", "beginner-ai-agent-tutorial-marketers"],
  ["Islamic productivity reminder", "POST", "FACEBOOK", "READY", null, "islamic-productivity-lessons-creators"],
  ["Finance cashflow cut", "CLIP", "TIKTOK", "SCHEDULED", "finance-shorts-sprint", "cashflow-rule-beginner-ignores"],
  ["Business reels diagnosis", "REELS", "INSTAGRAM", "PUBLISHED", "business-creator-growth", "why-reels-stop-at-300-views"],
  ["Gaming highlight tutorial", "SHORTS", "YOUTUBE", "READY", null, "gaming-highlight-edits-increase-retention"],
  ["Morning routine post", "POST", "FACEBOOK", "DRAFT", null, "calm-morning-routine-muslim-entrepreneurs"],
  ["Motivation 30 second structure", "CLIP", "TIKTOK", "SCHEDULED", "motivation-evergreen", "motivation-script-structure-30-second-clips"]
];

function dateAt(day, hour) {
  return new Date(Date.UTC(2026, 5, day, hour, 0, 0));
}

async function main() {
  const categoryBySlug = new Map();
  for (const [name, slug, description] of categories) {
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name, description, isActive: true, sourceType: "DEMO" },
      create: { name, slug, description, isActive: true, sourceType: "DEMO" }
    });
    categoryBySlug.set(slug, category);
  }

  const campaignBySlug = new Map();
  for (const [name, slug, description, platform, status, categorySlug, startDate, endDate] of campaigns) {
    const campaign = await prisma.campaign.upsert({
      where: { slug },
      update: {
        name,
        description,
        platform,
        status,
        categoryId: categoryBySlug.get(categorySlug)?.id,
        startDate: new Date(`${startDate}T00:00:00.000Z`),
        endDate: new Date(`${endDate}T00:00:00.000Z`),
        sourceType: "DEMO"
      },
      create: {
        name,
        slug,
        description,
        platform,
        status,
        categoryId: categoryBySlug.get(categorySlug)?.id,
        startDate: new Date(`${startDate}T00:00:00.000Z`),
        endDate: new Date(`${endDate}T00:00:00.000Z`),
        sourceType: "DEMO"
      }
    });
    campaignBySlug.set(slug, campaign);
  }

  const opportunityBySlug = new Map();
  for (const [index, row] of opportunityTitles.entries()) {
    const [title, slug, niche, keyword, platform, status, performanceLevel, opportunityScore, trendScore, competitionScore, viralPotentialScore, campaignSlug] = row;
    const category = categoryBySlug.get(niche.toLowerCase().replace(/\s+/g, "-")) ?? categoryBySlug.get("demo-data");
    const campaign = campaignSlug ? campaignBySlug.get(campaignSlug) : null;
    const opportunity = await prisma.aiClipOpportunity.upsert({
      where: { slug },
      update: {
        title,
        description: `DEMO opportunity for ${niche} content sourced from mock dashboard data.`,
        niche,
        keyword,
        platform,
        status,
        performanceLevel,
        opportunityScore,
        trendScore,
        competitionScore,
        viralPotentialScore,
        aiRecommendation: `Use this ${niche} demo opportunity for short-form testing and validate with real API data later.`,
        hookIdeas: [`Open with a ${keyword} pain point`, "Show the fastest win", "End with a direct CTA"],
        contentAngles: [`Beginner ${niche} angle`, "Checklist format", "Before and after framing"],
        thumbnailIdeas: { text: keyword, style: "high contrast demo thumbnail" },
        sourceUrl: `https://example.com/demo/opportunities/${slug}`,
        sourceType: "DEMO",
        isSaved: index % 7 === 0,
        savedAt: index % 7 === 0 ? dateAt(18, 8 + (index % 8)) : null,
        categoryId: category?.id,
        campaignId: campaign?.id,
        createdAt: dateAt(12 + (index % 8), 7 + (index % 10))
      },
      create: {
        title,
        slug,
        description: `DEMO opportunity for ${niche} content sourced from mock dashboard data.`,
        niche,
        keyword,
        platform,
        status,
        performanceLevel,
        opportunityScore,
        trendScore,
        competitionScore,
        viralPotentialScore,
        aiRecommendation: `Use this ${niche} demo opportunity for short-form testing and validate with real API data later.`,
        hookIdeas: [`Open with a ${keyword} pain point`, "Show the fastest win", "End with a direct CTA"],
        contentAngles: [`Beginner ${niche} angle`, "Checklist format", "Before and after framing"],
        thumbnailIdeas: { text: keyword, style: "high contrast demo thumbnail" },
        sourceUrl: `https://example.com/demo/opportunities/${slug}`,
        sourceType: "DEMO",
        isSaved: index % 7 === 0,
        savedAt: index % 7 === 0 ? dateAt(18, 8 + (index % 8)) : null,
        categoryId: category?.id,
        campaignId: campaign?.id,
        createdAt: dateAt(12 + (index % 8), 7 + (index % 10))
      }
    });
    opportunityBySlug.set(slug, opportunity);
  }

  for (const [index, [title, summary, priority, recommendationType, actionLabel, actionTarget]] of recommendations.entries()) {
    await prisma.dashboardRecommendation.upsert({
      where: { id: `demo-rec-${index + 1}` },
      update: { title, summary, priority, recommendationType, actionLabel, actionTarget, sourceType: "DEMO", isRead: false },
      create: { id: `demo-rec-${index + 1}`, title, summary, priority, recommendationType, actionLabel, actionTarget, sourceType: "DEMO" }
    });
  }

  for (const [index, [title, contentType, platform, status, campaignSlug, opportunitySlug]] of scheduleTemplates.entries()) {
    const scheduledAt = dateAt(18 + (index % 7), 8 + (index % 10));
    await prisma.publishingSchedule.upsert({
      where: { id: `demo-schedule-${index + 1}` },
      update: {
        title,
        contentType,
        platform,
        status,
        scheduledAt,
        publishedAt: status === "PUBLISHED" ? scheduledAt : null,
        campaignId: campaignSlug ? campaignBySlug.get(campaignSlug)?.id : null,
        opportunityId: opportunitySlug ? opportunityBySlug.get(opportunitySlug)?.id : null,
        sourceType: "DEMO"
      },
      create: {
        id: `demo-schedule-${index + 1}`,
        title,
        contentType,
        platform,
        status,
        scheduledAt,
        publishedAt: status === "PUBLISHED" ? scheduledAt : null,
        campaignId: campaignSlug ? campaignBySlug.get(campaignSlug)?.id : null,
        opportunityId: opportunitySlug ? opportunityBySlug.get(opportunitySlug)?.id : null,
        sourceType: "DEMO"
      }
    });
  }

  for (const [index, [name, platform, handle, niche, followers, avgViews, avgEngagement]] of competitors.entries()) {
    await prisma.competitorProfile.upsert({
      where: { id: `demo-competitor-${index + 1}` },
      update: {
        name,
        platform,
        handle,
        profileUrl: `https://example.com/demo/competitors/${handle.replace("@", "")}`,
        niche,
        followers,
        avgViews,
        avgEngagement,
        contentPattern: { cadence: "3-5 short clips weekly", format: "hook-list-cta" },
        strengths: ["Strong hooks", "Consistent posting", "Clear niche"],
        weaknesses: ["Limited platform diversification", "CTA could be clearer"],
        sourceType: "DEMO"
      },
      create: {
        id: `demo-competitor-${index + 1}`,
        name,
        platform,
        handle,
        profileUrl: `https://example.com/demo/competitors/${handle.replace("@", "")}`,
        niche,
        followers,
        avgViews,
        avgEngagement,
        contentPattern: { cadence: "3-5 short clips weekly", format: "hook-list-cta" },
        strengths: ["Strong hooks", "Consistent posting", "Clear niche"],
        weaknesses: ["Limited platform diversification", "CTA could be clearer"],
        sourceType: "DEMO"
      }
    });
  }
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
