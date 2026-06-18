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
import type { Account, Activity, Campaign, ContentItem, NavItem, Stat, SubNavItem, VideoOpportunity } from "./types";

const sub = (base: string, items: Array<[string, string]>): SubNavItem[] =>
  items.map(([key, label]) => ({
    key,
    label,
    path: key === "overview" && base === "/dashboard" ? base : `${base}/${key}`
  }));

export const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
    submenu: sub("/dashboard", [
      ["overview", "Overview"],
      ["ai-recommendation", "AI Recommendation Today"],
      ["campaign-overview", "Campaign Overview"],
      ["publishing-calendar", "Publishing Calendar Preview"]
    ])
  },
  {
    id: "ai-clip-intelligence",
    label: "AI Clip Intelligence",
    icon: Bot,
    path: "/ai-clip-intelligence",
    submenu: sub("/ai-clip-intelligence", [
      ["trend-discovery", "Trend Discovery"],
      ["niche-explorer", "Niche Explorer"],
      ["opportunity-scanner", "Opportunity Scanner"],
      ["competitor-intelligence", "Competitor Intelligence"],
      ["ai-advisor", "AI Advisor"],
      ["top-20-opportunities", "Top 20 Opportunities"],
      ["saved-opportunities", "Saved Opportunities"]
    ])
  },
  {
    id: "clip-studio",
    label: "Clip Studio",
    icon: Clapperboard,
    path: "/clip-studio",
    submenu: sub("/clip-studio", [
      ["source-video", "Source Video"],
      ["ai-clip-generator", "AI Clip Generator"],
      ["clip-editor", "Clip Editor"],
      ["subtitle-studio", "Subtitle Studio"],
      ["caption-generator", "Caption Generator"],
      ["export-center", "Export Center"]
    ])
  },
  {
    id: "campaign-clipper",
    label: "Campaign Clipper",
    icon: Megaphone,
    path: "/campaign-clipper",
    submenu: [
      { key: "dashboard", label: "Campaign Dashboard", path: "/campaign-clipper/dashboard" },
      { key: "library", label: "Campaign Library", path: "/campaign-clipper/library" },
      { key: "create", label: "Create Campaign", path: "/campaign-clipper/create" },
      { key: "rules", label: "Campaign Rules", path: "/campaign-clipper/rules" },
      { key: "assets", label: "Campaign Assets", path: "/campaign-clipper/assets" },
      { key: "compliance", label: "Compliance Center", path: "/campaign-clipper/compliance" },
      { key: "performance", label: "Campaign Performance", path: "/campaign-clipper/performance" },
      { key: "archive", label: "Campaign Archive", path: "/campaign-clipper/archive" }
    ]
  },
  {
    id: "content-library",
    label: "Content Library",
    icon: FolderOpen,
    path: "/content-library",
    submenu: sub("/content-library", [
      ["all", "All Content"],
      ["categories", "Categories"],
      ["collections", "Collections"],
      ["search", "Search Center"],
      ["archive", "Archive"]
    ])
  },
  {
    id: "scheduler",
    label: "Scheduler",
    icon: CalendarClock,
    path: "/scheduler",
    submenu: sub("/scheduler", [
      ["connected-accounts", "Connected Accounts"],
      ["content-queue", "Content Queue"],
      ["publishing-calendar", "Publishing Calendar"],
      ["auto-posting", "Auto Posting"],
      ["approval-center", "Approval Center"],
      ["publishing-logs", "Publishing Logs"]
    ])
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    path: "/analytics",
    submenu: [
      { key: "overview", label: "Overview", path: "/analytics/overview" },
      { key: "platform", label: "Platform Analytics", path: "/analytics/platform" },
      { key: "content", label: "Content Analytics", path: "/analytics/content" },
      { key: "ai-insights", label: "AI Insights", path: "/analytics/ai-insights" },
      { key: "niche", label: "Niche Analytics", path: "/analytics/niche" },
      { key: "campaign", label: "Campaign Analytics", path: "/analytics/campaign" },
      { key: "reports", label: "Reports", path: "/analytics/reports" }
    ]
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/settings",
    submenu: sub("/settings", [
      ["profile", "Profile"],
      ["workspace", "Workspace"],
      ["ai-providers", "AI Providers"],
      ["social-integrations", "Social Integrations"],
      ["storage", "Storage"],
      ["notifications", "Notifications"],
      ["security", "Security"],
      ["billing", "Billing"],
      ["api-management", "API Management"],
      ["backup-restore", "Backup & Restore"],
      ["system-logs", "System Logs"]
    ])
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
    niche: "AI & Technology",
    status: "New",
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
    niche: "Motivation",
    status: "Ready",
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
    niche: "Finance",
    status: "Saved",
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
    niche: "Islamic",
    status: "Analyzed",
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
  { name: "TikTok A", platform: "TikTok", status: "Connected", health: "Ready", lastSync: "12 minutes ago" },
  { name: "TikTok B", platform: "TikTok", status: "Connected", health: "Token healthy", lastSync: "29 minutes ago" },
  { name: "YouTube A", platform: "YouTube", status: "Connected", health: "Ready", lastSync: "1 hour ago" },
  { name: "YouTube B", platform: "YouTube", status: "Connected", health: "Refresh due", lastSync: "Yesterday" },
  { name: "Instagram A", platform: "Instagram", status: "Connected", health: "Ready", lastSync: "18 minutes ago" },
  { name: "Facebook Page", platform: "Facebook", status: "Not Connected", health: "OAuth required", lastSync: "Never" },
  { name: "LinkedIn Brand", platform: "LinkedIn", status: "Not Connected", health: "API not connected", lastSync: "Never" },
  { name: "X Growth", platform: "X", status: "Not Connected", health: "API not connected", lastSync: "Never" }
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
