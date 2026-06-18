CREATE TYPE "SourceType" AS ENUM ('DEMO', 'MANUAL', 'CSV_IMPORT', 'REAL_API');
CREATE TYPE "Platform" AS ENUM ('ALL', 'YOUTUBE', 'TIKTOK', 'INSTAGRAM', 'FACEBOOK');
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'READY', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'PAUSED');
CREATE TYPE "PerformanceLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "PriorityLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "RecommendationType" AS ENUM ('NICHE', 'CAMPAIGN', 'CONTENT', 'PUBLISHING', 'WARNING', 'GROWTH');
CREATE TYPE "PublishingContentType" AS ENUM ('CLIP', 'IMAGE', 'STORY', 'SHORTS', 'REELS', 'POST');

CREATE TABLE "Category" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sourceType" "SourceType" NOT NULL DEFAULT 'DEMO',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Campaign" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "platform" "Platform" NOT NULL DEFAULT 'ALL',
  "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "categoryId" TEXT,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "sourceType" "SourceType" NOT NULL DEFAULT 'DEMO',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiClipOpportunity" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "niche" TEXT NOT NULL,
  "keyword" TEXT NOT NULL,
  "platform" "Platform" NOT NULL,
  "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "performanceLevel" "PerformanceLevel" NOT NULL,
  "opportunityScore" INTEGER NOT NULL,
  "trendScore" INTEGER NOT NULL,
  "competitionScore" INTEGER NOT NULL,
  "viralPotentialScore" INTEGER NOT NULL,
  "aiRecommendation" TEXT NOT NULL,
  "hookIdeas" JSONB NOT NULL,
  "contentAngles" JSONB NOT NULL,
  "thumbnailIdeas" JSONB,
  "sourceUrl" TEXT,
  "sourceType" "SourceType" NOT NULL DEFAULT 'DEMO',
  "isSaved" BOOLEAN NOT NULL DEFAULT false,
  "savedAt" TIMESTAMP(3),
  "categoryId" TEXT,
  "campaignId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiClipOpportunity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AiClipOpportunity_opportunityScore_check" CHECK ("opportunityScore" >= 0 AND "opportunityScore" <= 100),
  CONSTRAINT "AiClipOpportunity_trendScore_check" CHECK ("trendScore" >= 0 AND "trendScore" <= 100),
  CONSTRAINT "AiClipOpportunity_competitionScore_check" CHECK ("competitionScore" >= 0 AND "competitionScore" <= 100),
  CONSTRAINT "AiClipOpportunity_viralPotentialScore_check" CHECK ("viralPotentialScore" >= 0 AND "viralPotentialScore" <= 100)
);

CREATE TABLE "DashboardRecommendation" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "priority" "PriorityLevel" NOT NULL,
  "recommendationType" "RecommendationType" NOT NULL,
  "actionLabel" TEXT,
  "actionTarget" TEXT,
  "sourceType" "SourceType" NOT NULL DEFAULT 'DEMO',
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DashboardRecommendation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PublishingSchedule" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "contentType" "PublishingContentType" NOT NULL,
  "platform" "Platform" NOT NULL,
  "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "campaignId" TEXT,
  "opportunityId" TEXT,
  "sourceType" "SourceType" NOT NULL DEFAULT 'DEMO',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PublishingSchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompetitorProfile" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "platform" "Platform" NOT NULL,
  "handle" TEXT,
  "profileUrl" TEXT,
  "niche" TEXT NOT NULL,
  "followers" INTEGER,
  "avgViews" INTEGER,
  "avgEngagement" DOUBLE PRECISION,
  "contentPattern" JSONB,
  "strengths" JSONB,
  "weaknesses" JSONB,
  "sourceType" "SourceType" NOT NULL DEFAULT 'DEMO',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CompetitorProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_isActive_idx" ON "Category"("isActive");
CREATE INDEX "Category_sourceType_idx" ON "Category"("sourceType");

CREATE UNIQUE INDEX "Campaign_slug_key" ON "Campaign"("slug");
CREATE INDEX "Campaign_categoryId_idx" ON "Campaign"("categoryId");
CREATE INDEX "Campaign_platform_idx" ON "Campaign"("platform");
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");
CREATE INDEX "Campaign_sourceType_idx" ON "Campaign"("sourceType");

CREATE UNIQUE INDEX "AiClipOpportunity_slug_key" ON "AiClipOpportunity"("slug");
CREATE INDEX "AiClipOpportunity_categoryId_idx" ON "AiClipOpportunity"("categoryId");
CREATE INDEX "AiClipOpportunity_campaignId_idx" ON "AiClipOpportunity"("campaignId");
CREATE INDEX "AiClipOpportunity_platform_idx" ON "AiClipOpportunity"("platform");
CREATE INDEX "AiClipOpportunity_status_idx" ON "AiClipOpportunity"("status");
CREATE INDEX "AiClipOpportunity_performanceLevel_idx" ON "AiClipOpportunity"("performanceLevel");
CREATE INDEX "AiClipOpportunity_isSaved_idx" ON "AiClipOpportunity"("isSaved");
CREATE INDEX "AiClipOpportunity_opportunityScore_idx" ON "AiClipOpportunity"("opportunityScore");
CREATE INDEX "AiClipOpportunity_createdAt_idx" ON "AiClipOpportunity"("createdAt");
CREATE INDEX "AiClipOpportunity_sourceType_idx" ON "AiClipOpportunity"("sourceType");

CREATE INDEX "DashboardRecommendation_priority_idx" ON "DashboardRecommendation"("priority");
CREATE INDEX "DashboardRecommendation_recommendationType_idx" ON "DashboardRecommendation"("recommendationType");
CREATE INDEX "DashboardRecommendation_isRead_idx" ON "DashboardRecommendation"("isRead");
CREATE INDEX "DashboardRecommendation_sourceType_idx" ON "DashboardRecommendation"("sourceType");
CREATE INDEX "DashboardRecommendation_createdAt_idx" ON "DashboardRecommendation"("createdAt");

CREATE INDEX "PublishingSchedule_campaignId_idx" ON "PublishingSchedule"("campaignId");
CREATE INDEX "PublishingSchedule_opportunityId_idx" ON "PublishingSchedule"("opportunityId");
CREATE INDEX "PublishingSchedule_platform_idx" ON "PublishingSchedule"("platform");
CREATE INDEX "PublishingSchedule_status_idx" ON "PublishingSchedule"("status");
CREATE INDEX "PublishingSchedule_scheduledAt_idx" ON "PublishingSchedule"("scheduledAt");
CREATE INDEX "PublishingSchedule_sourceType_idx" ON "PublishingSchedule"("sourceType");

CREATE INDEX "CompetitorProfile_platform_idx" ON "CompetitorProfile"("platform");
CREATE INDEX "CompetitorProfile_niche_idx" ON "CompetitorProfile"("niche");
CREATE INDEX "CompetitorProfile_sourceType_idx" ON "CompetitorProfile"("sourceType");

ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AiClipOpportunity" ADD CONSTRAINT "AiClipOpportunity_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AiClipOpportunity" ADD CONSTRAINT "AiClipOpportunity_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PublishingSchedule" ADD CONSTRAINT "PublishingSchedule_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PublishingSchedule" ADD CONSTRAINT "PublishingSchedule_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "AiClipOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
