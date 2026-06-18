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
