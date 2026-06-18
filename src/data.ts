import {
  BarChart3,
  Bot,
  CalendarClock,
  Clapperboard,
  FolderOpen,
  LayoutDashboard,
  Megaphone,
  Settings
} from "lucide-react";
import type { Account, Activity, Campaign, ContentItem, NavItem, Stat, VideoOpportunity } from "./types";

export const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
    submenu: ["Overview", "AI Recommendation Today", "Campaign Overview", "Publishing Calendar Preview"]
  },
  {
    id: "ai-clip-intelligence",
    label: "AI Clip Intelligence",
    icon: Bot,
    path: "/ai-clip-intelligence",
    submenu: [
      "Trend Discovery",
      "Niche Explorer",
      "Opportunity Scanner",
      "Competitor Intelligence",
      "AI Advisor",
      "Top 20 Opportunities",
      "Saved Opportunities"
    ]
  },
  {
    id: "clip-studio",
    label: "Clip Studio",
    icon: Clapperboard,
    path: "/clip-studio",
    submenu: ["Source Video", "AI Clip Generator", "Clip Editor", "Subtitle Studio", "Caption Generator", "Export Center"]
  },
  {
    id: "campaign-clipper",
    label: "Campaign Clipper",
    icon: Megaphone,
    path: "/campaign-clipper",
    submenu: [
      "Campaign Dashboard",
      "Campaign Library",
      "Create Campaign",
      "Campaign Rules",
      "Campaign Assets",
      "Compliance Center",
      "Campaign Performance",
      "Campaign Archive"
    ]
  },
  {
    id: "content-library",
    label: "Content Library",
    icon: FolderOpen,
    path: "/content-library",
    submenu: ["All Content", "Categories", "Collections", "Search Center", "Archive"]
  },
  {
    id: "scheduler",
    label: "Scheduler",
    icon: CalendarClock,
    path: "/scheduler",
    submenu: ["Connected Accounts", "Content Queue", "Publishing Calendar", "Auto Posting", "Approval Center", "Publishing Logs"]
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    path: "/analytics",
    submenu: ["Overview", "Platform Analytics", "Content Analytics", "AI Insights", "Niche Analytics", "Campaign Analytics", "Reports"]
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/settings",
    submenu: [
      "Profile",
      "Workspace",
      "AI Providers",
      "Social Integrations",
      "Storage",
      "Notifications",
      "Security",
      "Billing",
      "API Management",
      "Backup & Restore",
      "System Logs"
    ]
  }
];

export const stats: Stat[] = [
  { label: "Total Clips", value: "1,284", delta: "+18% this week", tone: "blue" },
  { label: "Published", value: "726", delta: "94 ready today", tone: "green" },
  { label: "Total Views", value: "12.8M", delta: "+2.4M in 30 days", tone: "cyan" },
  { label: "Engagement", value: "8.7%", delta: "+1.2% lift", tone: "amber" },
  { label: "Connected Accounts", value: "7", delta: "2 need refresh", tone: "slate" }
];

export const opportunities: VideoOpportunity[] = [
  {
    id: "op-1",
    title: "AI tools for small business growth in 2026",
    channel: "Future Stack Daily",
    platform: "YouTube",
    views: "1.8M",
    engagement: "9.4%",
    viralScore: 94,
    clippingScore: 91,
    analysis: "Strong hook in first 8 seconds, clear short-form CTA, low edit complexity.",
    thumbnail: "AI"
  },
  {
    id: "op-2",
    title: "Morning habits that improve focus and discipline",
    channel: "Momentum Lab",
    platform: "TikTok",
    views: "842K",
    engagement: "12.1%",
    viralScore: 89,
    clippingScore: 87,
    analysis: "Repeatable structure, motivational niche, ideal for subtitle-led clips.",
    thumbnail: "MO"
  },
  {
    id: "op-3",
    title: "Beginner finance mistakes and fast fixes",
    channel: "Pocket CFO",
    platform: "Instagram",
    views: "513K",
    engagement: "8.9%",
    viralScore: 86,
    clippingScore: 84,
    analysis: "List format maps well into three vertical clips with CTA overlays.",
    thumbnail: "FN"
  },
  {
    id: "op-4",
    title: "Islamic productivity lessons for creators",
    channel: "Barakah Studio",
    platform: "Facebook",
    views: "389K",
    engagement: "10.8%",
    viralScore: 82,
    clippingScore: 85,
    analysis: "High save potential and calm pacing for educational short clips.",
    thumbnail: "IS"
  }
];

export const campaigns: Campaign[] = [
  { name: "AI Tools Ramadan Launch", platform: "TikTok, YouTube", start: "Jun 18", end: "Jul 02", progress: 68, compliance: 96, status: "Active" },
  { name: "Finance Shorts Sprint", platform: "Instagram", start: "Jun 20", end: "Jul 08", progress: 34, compliance: 88, status: "Warning" },
  { name: "Motivation Evergreen", platform: "Facebook", start: "Jun 12", end: "Jun 30", progress: 82, compliance: 92, status: "Active" },
  { name: "Affiliate Product Clips", platform: "YouTube", start: "Draft", end: "Draft", progress: 12, compliance: 74, status: "Draft" }
];

export const contentItems: ContentItem[] = [
  { title: "AI CRM in 30 seconds", category: "AI", platform: "TikTok", campaign: "AI Tools Ramadan Launch", status: "Ready", metric: "8.2 score" },
  { title: "Three budget rules", category: "Finance", platform: "Instagram", campaign: "Finance Shorts Sprint", status: "Scheduled", metric: "Jun 19, 09:00" },
  { title: "Discipline hook test", category: "Motivation", platform: "YouTube", campaign: "Motivation Evergreen", status: "Published", metric: "124K views" },
  { title: "Health myth opener", category: "Health", platform: "Facebook", campaign: "Demo Data", status: "Draft", metric: "Needs caption" },
  { title: "Gaming setup affiliate", category: "Affiliate", platform: "TikTok", campaign: "Affiliate Product Clips", status: "Ready", metric: "CTA valid" },
  { title: "Learning AI basics", category: "Education", platform: "LinkedIn", campaign: "Demo Data", status: "Archived", metric: "Archived" }
];

export const accounts: Account[] = [
  { name: "TikTok A", platform: "TikTok", status: "Connected", health: "Ready" },
  { name: "TikTok B", platform: "TikTok", status: "Connected", health: "Token healthy" },
  { name: "YouTube A", platform: "YouTube", status: "Connected", health: "Ready" },
  { name: "YouTube B", platform: "YouTube", status: "Connected", health: "Refresh due" },
  { name: "Instagram A", platform: "Instagram", status: "Connected", health: "Ready" },
  { name: "Facebook Page", platform: "Facebook", status: "Not Connected", health: "OAuth required" },
  { name: "LinkedIn Brand", platform: "LinkedIn", status: "Coming Soon", health: "Coming Soon" },
  { name: "X Growth", platform: "X", status: "Coming Soon", health: "Coming Soon" }
];

export const activities: Activity[] = [
  { title: "Generated 12 demo clips from YouTube source", meta: "8 minutes ago", tone: "blue" },
  { title: "Compliance warning on Finance Shorts Sprint", meta: "22 minutes ago", tone: "amber" },
  { title: "TikTok A publishing job completed", meta: "1 hour ago", tone: "green" },
  { title: "AI found 20 new opportunities in AI & Technology", meta: "2 hours ago", tone: "cyan" }
];

export const chartData = [
  { name: "Mon", views: 38000, engagement: 8.1 },
  { name: "Tue", views: 54000, engagement: 8.5 },
  { name: "Wed", views: 42000, engagement: 7.9 },
  { name: "Thu", views: 78000, engagement: 9.2 },
  { name: "Fri", views: 91000, engagement: 9.8 },
  { name: "Sat", views: 73000, engagement: 8.8 },
  { name: "Sun", views: 96000, engagement: 10.1 }
];

export const categories = ["Business", "Finance", "Education", "AI", "Islamic", "Motivation", "Gaming", "Health", "Affiliate", "Custom Category"];
export const niches = ["Business", "Finance", "Education", "AI & Technology", "Motivation", "Islamic", "Health", "Gaming", "Affiliate", "News", "Custom Niche"];
export const platforms = ["YouTube", "TikTok", "Instagram", "Facebook", "X", "LinkedIn"];
