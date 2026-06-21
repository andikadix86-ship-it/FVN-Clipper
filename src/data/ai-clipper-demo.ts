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
import type {
  Account,
  Activity,
  AIRecommendation,
  Campaign,
  ContentItem,
  GeneratedClip,
  NavItem,
  ScheduleItem,
  Stat,
  SubNavItem,
  VideoOpportunity
} from "../types";

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
      ["ai-recommendation-today", "AI Recommendation Today"],
      ["campaign-overview", "Campaign Overview"],
      ["publishing-calendar-preview", "Publishing Calendar Preview"]
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
  },
  {
    id: "op-5",
    title: "Seven AI automations creators can build today",
    channel: "Creator Ops",
    platform: "YouTube",
    niche: "AI & Technology",
    status: "New",
    views: "721K",
    engagement: "11.3%",
    viralScore: 91,
    clippingScore: 90,
    analysis: "Clear list structure, multiple hooks, strong utility for carousel-style cuts.",
    thumbnail: "A7"
  },
  {
    id: "op-6",
    title: "The cashflow rule every beginner ignores",
    channel: "Simple Ledger",
    platform: "TikTok",
    niche: "Finance",
    status: "Ready",
    views: "654K",
    engagement: "10.5%",
    viralScore: 88,
    clippingScore: 86,
    analysis: "High comment intent, strong one-problem framing, easy subtitle extraction.",
    thumbnail: "CF"
  },
  {
    id: "op-7",
    title: "Study faster with the 20 minute recall loop",
    channel: "Edu Sprint",
    platform: "Instagram",
    niche: "Education",
    status: "New",
    views: "432K",
    engagement: "9.7%",
    viralScore: 84,
    clippingScore: 82,
    analysis: "Educational framework has clear steps and strong save/share potential.",
    thumbnail: "ED"
  },
  {
    id: "op-8",
    title: "One prompt that plans your entire content week",
    channel: "AI Creator Desk",
    platform: "YouTube",
    niche: "AI & Technology",
    status: "Analyzed",
    views: "1.1M",
    engagement: "8.8%",
    viralScore: 92,
    clippingScore: 89,
    analysis: "Prompt reveal creates curiosity and the output can be split into workflow clips.",
    thumbnail: "PR"
  },
  {
    id: "op-9",
    title: "Calm morning routine for Muslim entrepreneurs",
    channel: "Barakah Builder",
    platform: "Facebook",
    niche: "Islamic",
    status: "New",
    views: "278K",
    engagement: "12.4%",
    viralScore: 80,
    clippingScore: 83,
    analysis: "Niche alignment and reflective pacing are good for audience retention.",
    thumbnail: "BE"
  },
  {
    id: "op-10",
    title: "Affiliate landing page mistakes killing conversions",
    channel: "Offer Lab",
    platform: "TikTok",
    niche: "Affiliate",
    status: "Ready",
    views: "506K",
    engagement: "9.1%",
    viralScore: 85,
    clippingScore: 87,
    analysis: "Problem-solution cadence and direct CTA make it campaign-ready.",
    thumbnail: "AF"
  },
  {
    id: "op-11",
    title: "The hook formula used by top Shorts creators",
    channel: "Shorts Lab",
    platform: "YouTube",
    niche: "Business",
    status: "New",
    views: "934K",
    engagement: "10.2%",
    viralScore: 90,
    clippingScore: 92,
    analysis: "Hook examples are self-contained and can become several short lessons.",
    thumbnail: "HK"
  },
  {
    id: "op-12",
    title: "Healthy meal prep without counting calories",
    channel: "Fit Simple",
    platform: "Instagram",
    niche: "Health",
    status: "Saved",
    views: "601K",
    engagement: "8.5%",
    viralScore: 81,
    clippingScore: 80,
    analysis: "Visual checklist format is friendly to vertical clip repurposing.",
    thumbnail: "HL"
  },
  {
    id: "op-13",
    title: "Gaming setup upgrades under 50 dollars",
    channel: "Desk Quest",
    platform: "TikTok",
    niche: "Gaming",
    status: "New",
    views: "1.3M",
    engagement: "13.6%",
    viralScore: 93,
    clippingScore: 88,
    analysis: "Product-led structure, high replay value, and clear affiliate angle.",
    thumbnail: "GM"
  },
  {
    id: "op-14",
    title: "Breaking down today's creator economy news",
    channel: "Creator Brief",
    platform: "Facebook",
    niche: "News",
    status: "Analyzed",
    views: "342K",
    engagement: "7.8%",
    viralScore: 78,
    clippingScore: 79,
    analysis: "Timely topic but needs fast publishing and stronger hook overlay.",
    thumbnail: "NW"
  },
  {
    id: "op-15",
    title: "The simplest KPI dashboard for solo businesses",
    channel: "Operator Notes",
    platform: "YouTube",
    niche: "Business",
    status: "Ready",
    views: "488K",
    engagement: "8.4%",
    viralScore: 83,
    clippingScore: 86,
    analysis: "Dashboard walkthrough can be split by metric and CTA.",
    thumbnail: "BI"
  },
  {
    id: "op-16",
    title: "How to remember every book you read",
    channel: "Learning Loop",
    platform: "Instagram",
    niche: "Education",
    status: "New",
    views: "711K",
    engagement: "11.8%",
    viralScore: 89,
    clippingScore: 85,
    analysis: "Strong retention topic with repeatable three-step structure.",
    thumbnail: "BK"
  },
  {
    id: "op-17",
    title: "Three Duas for focus and discipline",
    channel: "Faithful Focus",
    platform: "TikTok",
    niche: "Islamic",
    status: "Saved",
    views: "459K",
    engagement: "14.2%",
    viralScore: 87,
    clippingScore: 84,
    analysis: "High share potential and simple subtitle-led edit path.",
    thumbnail: "DU"
  },
  {
    id: "op-18",
    title: "Why your reels stop at 300 views",
    channel: "Growth Repair",
    platform: "Instagram",
    niche: "Business",
    status: "New",
    views: "806K",
    engagement: "10.9%",
    viralScore: 91,
    clippingScore: 90,
    analysis: "Direct pain point, strong diagnostic framing, easy CTA overlay.",
    thumbnail: "GR"
  },
  {
    id: "op-19",
    title: "Beginner AI agent tutorial for marketers",
    channel: "Agent School",
    platform: "YouTube",
    niche: "AI & Technology",
    status: "Ready",
    views: "1.5M",
    engagement: "9.9%",
    viralScore: 95,
    clippingScore: 93,
    analysis: "Large market, high novelty, and many standalone tutorial segments.",
    thumbnail: "AG"
  },
  {
    id: "op-20",
    title: "Side hustle myths that keep people stuck",
    channel: "Income Clarity",
    platform: "TikTok",
    niche: "Motivation",
    status: "New",
    views: "693K",
    engagement: "12.7%",
    viralScore: 88,
    clippingScore: 86,
    analysis: "Myth-busting structure creates comments and quick cuts.",
    thumbnail: "SH"
  }
];

export const campaigns: Campaign[] = [
  { name: "AI Tools Ramadan Launch", platform: "TikTok, YouTube", start: "Jun 18", end: "Jul 02", progress: 68, compliance: 96, status: "Active" },
  { name: "Finance Shorts Sprint", platform: "Instagram", start: "Jun 20", end: "Jul 08", progress: 34, compliance: 88, status: "Warning" },
  { name: "Motivation Evergreen", platform: "Facebook", start: "Jun 12", end: "Jun 30", progress: 82, compliance: 92, status: "Active" },
  { name: "Affiliate Product Clips", platform: "YouTube", start: "Draft", end: "Draft", progress: 12, compliance: 74, status: "Draft" }
];

export const defaultContentItems: ContentItem[] = [
  { id: "content-1", title: "AI CRM in 30 seconds", category: "AI", platform: "TikTok", campaign: "AI Tools Ramadan Launch", status: "Ready", metric: "8.2 score", date: "2026-06-18", performance: "High" },
  { id: "content-2", title: "Three budget rules", category: "Finance", platform: "Instagram", campaign: "Finance Shorts Sprint", status: "Scheduled", metric: "Jun 19, 09:00", date: "2026-06-19", performance: "Medium" },
  { id: "content-3", title: "Discipline hook test", category: "Motivation", platform: "YouTube", campaign: "Motivation Evergreen", status: "Published", metric: "124K views", date: "2026-06-17", performance: "High" },
  { id: "content-4", title: "Health myth opener", category: "Health", platform: "Facebook", campaign: "Unassigned", status: "Draft", metric: "Needs caption", date: "2026-06-20", performance: "Low" },
  { id: "content-5", title: "Gaming setup affiliate", category: "Affiliate", platform: "TikTok", campaign: "Affiliate Product Clips", status: "Ready", metric: "CTA valid", date: "2026-06-21", performance: "Medium" },
  { id: "content-6", title: "Learning AI basics", category: "Education", platform: "LinkedIn", campaign: "Unassigned", status: "Archived", metric: "Archived", date: "2026-06-12", performance: "Low" }
];

export const defaultAccounts: Account[] = [
  { name: "TikTok A", platform: "TikTok", status: "Connected", health: "Ready", lastSync: "12 minutes ago" },
  { name: "TikTok B", platform: "TikTok", status: "Connected", health: "Token healthy", lastSync: "29 minutes ago" },
  { name: "YouTube A", platform: "YouTube", status: "Connected", health: "Ready", lastSync: "1 hour ago" },
  { name: "YouTube B", platform: "YouTube", status: "Connected", health: "Refresh due", lastSync: "Yesterday" },
  { name: "Instagram A", platform: "Instagram", status: "Connected", health: "Ready", lastSync: "18 minutes ago" },
  { name: "Facebook Page", platform: "Facebook", status: "Not Connected", health: "OAuth required", lastSync: "Never" },
  { name: "LinkedIn Brand", platform: "LinkedIn", status: "Not Connected", health: "API not connected", lastSync: "Never" },
  { name: "X Growth", platform: "X", status: "Not Connected", health: "API not connected", lastSync: "Never" }
];

export const defaultGeneratedClips: GeneratedClip[] = [
  { id: "clip-1", title: "Hook A", duration: "28s", hookScore: 91, viralScore: 88, status: "Ready", sourceTitle: "AI tools for small business growth in 2026" },
  { id: "clip-2", title: "Education Cut", duration: "34s", hookScore: 87, viralScore: 85, status: "Draft", sourceTitle: "AI tools for small business growth in 2026" },
  { id: "clip-3", title: "CTA Ending", duration: "40s", hookScore: 83, viralScore: 82, status: "Draft", sourceTitle: "AI tools for small business growth in 2026" }
];

export const defaultSchedules: ScheduleItem[] = [
  { id: "schedule-1", title: "Three budget rules", account: "Instagram A", platform: "Instagram", day: "Thu", time: "09:00", status: "Scheduled" },
  { id: "schedule-2", title: "Discipline hook test", account: "YouTube A", platform: "YouTube", day: "Fri", time: "19:30", status: "Published" }
];

export const activities: Activity[] = [
  { title: "Generated 12 demo clips from YouTube source", meta: "8 minutes ago", tone: "blue" },
  { title: "Compliance warning on Finance Shorts Sprint", meta: "22 minutes ago", tone: "amber" },
  { title: "TikTok A publishing job completed", meta: "1 hour ago", tone: "green" },
  { title: "AI found 20 new opportunities in AI & Technology", meta: "2 hours ago", tone: "cyan" }
];

export const recommendations: AIRecommendation[] = [
  {
    title: "AI Recommendation For You",
    description: "Prioritize AI & Technology clips today. Best posting window is 19:00 to 21:00 Asia/Jakarta.",
    action: "Apply Recommendation",
    status: "Real Data"
  },
  {
    title: "Integration Reminder",
    description: "Connect Facebook, LinkedIn, and X before enabling automated publishing.",
    action: "Review Integrations",
    status: "Not Connected"
  }
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

export const analyticsMetrics = ["Total views", "Watch time", "Followers", "Engagement", "Growth"];
export const categories = ["Business", "Finance", "Education", "AI", "Islamic", "Motivation", "Gaming", "Health", "Affiliate"];
export const niches = ["Business", "Finance", "Education", "AI & Technology", "Motivation", "Islamic", "Health", "Gaming", "Affiliate", "News", "Custom Niche"];
export const platforms = ["YouTube", "TikTok", "Instagram", "Facebook", "X", "LinkedIn"];
