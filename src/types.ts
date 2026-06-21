import type { LucideIcon } from "lucide-react";

export type PageId =
  | "dashboard"
  | "ai-clip-intelligence"
  | "clip-studio"
  | "campaign-clipper"
  | "content-library"
  | "scheduler"
  | "analytics"
  | "settings";

export type StatusTone = "blue" | "cyan" | "green" | "amber" | "red" | "slate";

export interface SubNavItem {
  key: string;
  label: string;
  path: string;
}

export interface NavItem {
  id: PageId;
  label: string;
  icon: LucideIcon;
  path: string;
  submenu: SubNavItem[];
}

export interface Stat {
  label: string;
  value: string;
  delta: string;
  tone: StatusTone;
}

export interface VideoOpportunity {
  id: string;
  title: string;
  channel: string;
  platform: string;
  niche: string;
  status: "New" | "Saved" | "Analyzed" | "Ready" | "Draft" | "Scheduled" | "Published" | "Failed" | "Paused";
  views: string;
  engagement: string;
  viralScore: number;
  clippingScore: number;
  analysis: string;
  thumbnail: string;
  slug?: string;
  description?: string | null;
  keyword?: string;
  sourceType?: "DEMO" | "MANUAL" | "CSV_IMPORT" | "REAL_API";
  isSaved?: boolean;
  savedAt?: string | null;
  categoryId?: string | null;
  campaignId?: string | null;
  categorySlug?: string;
  campaignSlug?: string;
  aiRecommendation?: string;
  opportunityScore?: number;
  trendScore?: number;
  competitionScore?: number;
  performanceLevel?: "HIGH" | "MEDIUM" | "LOW";
}

export interface Campaign {
  id?: string;
  name: string;
  slug?: string;
  description?: string | null;
  platform: string;
  start: string;
  end: string;
  progress: number;
  compliance: number;
  status: "Active" | "Draft" | "Ready" | "Scheduled" | "Published" | "Failed" | "Paused" | "Completed" | "Warning";
  sourceType?: "DEMO" | "MANUAL" | "CSV_IMPORT" | "REAL_API";
}

export interface ContentItem {
  id?: string;
  title: string;
  category: string;
  platform: string;
  campaign: string;
  status: "Draft" | "Ready" | "Scheduled" | "Published" | "Failed" | "Archived";
  metric: string;
  date?: string;
  performance?: "High" | "Medium" | "Low";
}

export interface Account {
  name: string;
  platform: string;
  status: "Connected" | "Not Connected";
  health: string;
  lastSync: string;
}

export interface Activity {
  title: string;
  meta: string;
  tone: StatusTone;
}

export interface GeneratedClip {
  id: string;
  title: string;
  duration: string;
  hookScore: number;
  viralScore: number;
  status: "Draft" | "Ready" | "Saved to Library" | "Saved to Campaign";
  sourceTitle: string;
}

export interface ScheduleItem {
  id: string;
  title: string;
  account: string;
  platform: string;
  day: string;
  time: string;
  status: "Draft" | "Ready" | "Scheduled" | "Published" | "Failed" | "Paused";
  scheduledAt?: string;
  sourceType?: "DEMO" | "MANUAL" | "CSV_IMPORT" | "REAL_API";
}

export interface AIRecommendation {
  title: string;
  description: string;
  action: string;
  status: "Real Data" | "Not Connected";
}
