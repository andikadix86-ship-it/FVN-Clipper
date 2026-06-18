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
  status: "New" | "Saved" | "Analyzed" | "Ready";
  views: string;
  engagement: string;
  viralScore: number;
  clippingScore: number;
  analysis: string;
  thumbnail: string;
}

export interface Campaign {
  name: string;
  platform: string;
  start: string;
  end: string;
  progress: number;
  compliance: number;
  status: "Active" | "Draft" | "Completed" | "Warning";
}

export interface ContentItem {
  id?: string;
  title: string;
  category: string;
  platform: string;
  campaign: string;
  status: "Draft" | "Ready" | "Scheduled" | "Published" | "Archived";
  metric: string;
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
  status: "Draft" | "Ready" | "Scheduled" | "Published";
}

export interface AIRecommendation {
  title: string;
  description: string;
  action: string;
  status: "Demo Data" | "Not Connected";
}
