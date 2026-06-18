import { useEffect, useMemo, useState } from "react";
import {
  AccountCard,
  ActivityFeed,
  AnalyticsChart,
  AppHeader,
  AppSidebar,
  CampaignCard,
  ComplianceChecklist,
  ContentCard,
  EmptyState,
  FilterBar,
  FormGrid,
  PageHeader,
  RightPanel,
  ScheduleCalendar,
  ScoreBadge,
  StatCard,
  StatusBadge,
  ToggleGrid,
  UploadPanel,
  VideoOpportunityCard,
  VideoOpportunityTable
} from "./components";
import { accounts, activities, campaigns, categories, contentItems, navItems, niches, opportunities, stats } from "./data";
import type { PageId, SubNavItem, VideoOpportunity } from "./types";

const SELECTED_SOURCE_KEY = "fvn-selected-source";

export function App() {
  const initialRoute = getRouteFromPath(window.location.pathname);
  const [activePage, setActivePage] = useState<PageId>(initialRoute.page);
  const [activePath, setActivePath] = useState(initialRoute.path);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<VideoOpportunity | null>(() => readSelectedSource());
  const [toast, setToast] = useState("UI ready");

  const activeNav = useMemo(() => navItems.find((item) => item.id === activePage) ?? navItems[0], [activePage]);
  const activeSub = useMemo(() => getActiveSub(activeNav, activePath), [activeNav, activePath]);

  useEffect(() => {
    const onPopState = () => {
      const route = getRouteFromPath(window.location.pathname);
      setActivePage(route.page);
      setActivePath(route.path);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const showToast = (message: string) => {
    console.log(`[FVN demo action] ${message}`);
    setToast(message);
  };

  const navigate = (path: string) => {
    const route = getRouteFromPath(path);
    setActivePage(route.page);
    setActivePath(route.path);
    setMobileOpen(false);
    window.history.pushState({}, "", route.path);
    showToast(`Opened ${route.path}`);
  };

  const clipVideo = (item: VideoOpportunity) => {
    setSelectedSource(item);
    localStorage.setItem(SELECTED_SOURCE_KEY, JSON.stringify(item));
    navigate("/clip-studio/source-video");
  };

  const handleButtonCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    const button = (event.target as HTMLElement).closest("button");
    if (!button || button.disabled) {
      return;
    }
    const label = button.getAttribute("aria-label") || button.textContent?.trim() || "Action";
    showToast(label);
  };

  return (
    <div className="app-shell" onClickCapture={handleButtonCapture}>
      <AppSidebar
        activePage={activePage}
        activePath={activePath}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onCollapse={() => setSidebarCollapsed((value) => !value)}
        onCloseMobile={() => setMobileOpen((value) => !value)}
        onNavigate={navigate}
      />
      <div className={`app-main ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <AppHeader title={activeNav.label} path={activePath} onOpenMobile={() => setMobileOpen(true)} onAction={showToast} />
        <main className="content-layout">
          <section className="page-content">
            <ActiveSubmenuBar items={activeNav.submenu} activePath={activePath} onNavigate={navigate} />
            <PageRouter activePage={activePage} activeSub={activeSub} selectedSource={selectedSource} onClip={clipVideo} onNavigate={navigate} />
          </section>
          <RightPanel />
        </main>
      </div>
      <div className="toast" role="status">{toast}</div>
    </div>
  );
}

function PageRouter({
  activePage,
  activeSub,
  selectedSource,
  onClip,
  onNavigate
}: {
  activePage: PageId;
  activeSub: SubNavItem;
  selectedSource: VideoOpportunity | null;
  onClip: (item: VideoOpportunity) => void;
  onNavigate: (path: string) => void;
}) {
  switch (activePage) {
    case "ai-clip-intelligence":
      return <AIClipIntelligence activeSub={activeSub} onClip={onClip} />;
    case "clip-studio":
      return <ClipStudio activeSub={activeSub} selectedSource={selectedSource} onNavigate={onNavigate} />;
    case "campaign-clipper":
      return <CampaignClipper activeSub={activeSub} />;
    case "content-library":
      return <ContentLibrary activeSub={activeSub} />;
    case "scheduler":
      return <Scheduler activeSub={activeSub} />;
    case "analytics":
      return <Analytics activeSub={activeSub} />;
    case "settings":
      return <Settings activeSub={activeSub} />;
    case "dashboard":
    default:
      return <Dashboard onClip={onClip} />;
  }
}

function Dashboard({ onClip }: { onClip: (item: VideoOpportunity) => void }) {
  return (
    <>
      <PageHeader
        eyebrow="Dashboard - Demo Data"
        title="Welcome back, Andika"
        description="A clean command center for finding video opportunities, generating clips, managing campaigns, and publishing to connected accounts."
        actions={<button className="primary-button" type="button">Clip This</button>}
      />
      <StatsGrid />
      <div className="section-grid two">
        <section className="section-card large">
          <SectionTitle title="Content Performance Chart" action="View All" />
          <AnalyticsChart />
        </section>
        <section className="section-card">
          <SectionTitle title="Recent Activities" action="View All" />
          <ActivityFeed items={activities} />
        </section>
      </div>
      <section className="section-card">
        <SectionTitle title="Top 20 Video Opportunities" action="View All" />
        <VideoOpportunityTable items={opportunities} onClip={onClip} />
      </section>
      <div className="section-grid two">
        <section className="section-card">
          <SectionTitle title="Upcoming Schedule" action="View Calendar" />
          <ScheduleCalendar />
        </section>
        <section className="section-card">
          <SectionTitle title="Campaign Overview" action="View All Campaigns" />
          <div className="campaign-list">
            {campaigns.slice(0, 3).map((campaign) => (
              <CampaignCard campaign={campaign} key={campaign.name} />
            ))}
          </div>
        </section>
      </div>
      <section className="section-card">
        <SectionTitle title="Connected Accounts Summary" action="View Accounts" />
        <div className="account-grid compact-grid">
          {accounts.slice(0, 5).map((account) => (
            <AccountCard account={account} key={account.name} />
          ))}
        </div>
      </section>
      <section className="section-card">
        <SectionTitle title="Top Performing Clips" action="Preview" />
        <div className="opportunity-grid">
          {opportunities.slice(0, 2).map((item) => (
            <VideoOpportunityCard item={item} onClip={onClip} key={item.id} />
          ))}
        </div>
      </section>
    </>
  );
}

function AIClipIntelligence({ activeSub, onClip }: { activeSub: SubNavItem; onClip: (item: VideoOpportunity) => void }) {
  const detailItems = getAIItems(activeSub.key);
  return (
    <>
      <PageHeader
        eyebrow="AI Clip Intelligence"
        title={activeSub.label}
        description="The intelligence hub for trends, niches, competitors, advisor insights, and short-form video opportunity scoring."
        actions={<button className="primary-button" type="button">AI Scan</button>}
      />
      <SearchPanel title="Search keyword" button="AI Scan" placeholder="Try: AI tools, finance hooks, Islamic productivity..." />
      <FilterBar filters={["Platform", "YouTube", "TikTok", "Instagram", "Facebook", "Region", "Period", "Niche"]} />
      <StatsGrid />
      <div className="section-grid three">
        <InfoPanel title={activeSub.label} items={detailItems} />
        <InfoPanel title="Opportunity Score Summary" items={["Viral Score", "Growth Score", "Engagement Score", "Competition Score", "Clipping Score"]} />
        <InfoPanel title="Demo Data Status" items={["Demo Data", "Ready", "Not Connected API", "Saved Opportunities"]} />
      </div>
      <section className="section-card">
        <SectionTitle title={activeSub.key === "saved-opportunities" ? "Saved Opportunities" : "Top 20 Opportunities"} action="View Saved" />
        <VideoOpportunityTable items={opportunities} onClip={onClip} />
      </section>
    </>
  );
}

function ClipStudio({ activeSub, selectedSource, onNavigate }: { activeSub: SubNavItem; selectedSource: VideoOpportunity | null; onNavigate: (path: string) => void }) {
  const clipSteps = navItems.find((item) => item.id === "clip-studio")?.submenu ?? [];
  return (
    <>
      <PageHeader
        eyebrow="Clip Studio"
        title={activeSub.label}
        description="Step-by-step workflow for source intake, AI generation, editing, subtitles, captions, and export."
        actions={<button className="primary-button" type="button">Save to Library</button>}
      />
      <div className="stepper">
        {clipSteps.map((step, index) => (
          <button className={activeSub.path === step.path ? "active" : ""} type="button" onClick={() => onNavigate(step.path)} key={step.path}>
            <span>Step {index + 1}</span>
            <strong>{step.label}</strong>
          </button>
        ))}
      </div>
      {selectedSource && (
        <section className="section-card selected-source">
          <StatusBadge label="Selected Source" tone="blue" />
          <StatusBadge label="Demo Data" tone="slate" />
          <h3>{selectedSource.title}</h3>
          <p>{selectedSource.channel} - {selectedSource.platform} - {selectedSource.views} views</p>
        </section>
      )}
      <ClipStudioContent activeSub={activeSub} />
    </>
  );
}

function CampaignClipper({ activeSub }: { activeSub: SubNavItem }) {
  return (
    <>
      <PageHeader
        eyebrow="Campaign Clipper"
        title={activeSub.label}
        description="Campaign validation is included as Compliance Center, so every clip can be checked before publishing."
        actions={<button className="primary-button" type="button">Create Campaign</button>}
      />
      <div className="section-grid five">
        {[
          ["Active Campaigns", "3"],
          ["Completed Campaigns", "14"],
          ["Draft Campaigns", "2"],
          ["Compliance Status", "92%"],
          ["Campaign Score", "8.8"]
        ].map(([label, value]) => (
          <article className="mini-stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <CampaignContent activeSub={activeSub} />
    </>
  );
}

function ContentLibrary({ activeSub }: { activeSub: SubNavItem }) {
  return (
    <>
      <PageHeader
        eyebrow="Content Library"
        title={activeSub.label}
        description="Browse all content, collections, categories, search filters, and archived assets in one clean library."
        actions={<button className="primary-button" type="button">View All</button>}
      />
      <FilterBar filters={["Keyword", "Category", "Platform", "Status", "Date", "Performance", "Campaign", "Grid/List"]} />
      <ContentLibraryContent activeSub={activeSub} />
    </>
  );
}

function Scheduler({ activeSub }: { activeSub: SubNavItem }) {
  return (
    <>
      <PageHeader
        eyebrow="Scheduler"
        title={activeSub.label}
        description="Manage connected accounts, queue status, calendar views, auto posting, approvals, and logs."
        actions={<button className="primary-button" type="button">Add Account</button>}
      />
      <SchedulerContent activeSub={activeSub} />
    </>
  );
}

function Analytics({ activeSub }: { activeSub: SubNavItem }) {
  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title={activeSub.label}
        description="Overview, platform metrics, content analytics, AI insights, campaign analytics, and reports."
        actions={<button className="primary-button" type="button">PDF Export</button>}
      />
      <StatsGrid />
      <div className="section-grid two">
        <section className="section-card">
          <SectionTitle title="Overview" action="Excel Export" />
          <AnalyticsChart />
        </section>
        <section className="section-card">
          <SectionTitle title="Engagement Growth" action="Weekly" />
          <AnalyticsChart variant="bar" />
        </section>
      </div>
      <AnalyticsContent activeSub={activeSub} />
    </>
  );
}

function Settings({ activeSub }: { activeSub: SubNavItem }) {
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title={activeSub.label}
        description="Everything is labeled as demo or placeholder where a real external connection is not active."
        actions={<button className="primary-button" type="button">Save Settings</button>}
      />
      <SettingsContent activeSub={activeSub} />
    </>
  );
}

function ActiveSubmenuBar({ items, activePath, onNavigate }: { items: SubNavItem[]; activePath: string; onNavigate: (path: string) => void }) {
  return (
    <div className="tab-bar" aria-label="Page submenu tabs">
      {items.map((item) => (
        <button className={activePath === item.path ? "active" : ""} type="button" onClick={() => onNavigate(item.path)} key={item.path}>
          {item.label}
        </button>
      ))}
    </div>
  );
}

function SearchPanel({ title, placeholder, button }: { title: string; placeholder: string; button: string }) {
  return (
    <section className="section-card search-panel">
      <div>
        <StatusBadge label="Demo Data" tone="blue" />
        <h2>{title}</h2>
      </div>
      <div className="url-row">
        <input placeholder={placeholder} />
        <button className="primary-button" type="button">{button}</button>
      </div>
    </section>
  );
}

function ClipStudioContent({ activeSub }: { activeSub: SubNavItem }) {
  if (activeSub.key === "source-video") {
    return (
      <section className="section-card">
        <SectionTitle title="Source Video" action="Analyze Source" />
        <UploadPanel />
      </section>
    );
  }

  if (activeSub.key === "ai-clip-generator") {
    return (
      <div className="section-grid two">
        <section className="section-card">
          <SectionTitle title="AI Clip Generator" action="Generate Clips" />
          <FormGrid items={["Clip count", "Duration", "Platform target", "Language", "Style"]} />
          <ToggleGrid items={["Auto Hook", "Auto Subtitle", "Auto Reframe", "Auto Zoom", "Auto CTA"]} />
        </section>
        <GeneratedClips />
      </div>
    );
  }

  if (activeSub.key === "clip-editor") {
    return (
      <section className="section-card">
        <SectionTitle title="Clip Editor" action="Save Edit" />
        <div className="editor-layout">
          <div className="video-preview">Video Preview</div>
          <div className="timeline-ui">
            {["Trim", "Split", "Merge", "Crop", "Resize", "Watermark", "Branding", "CTA overlay"].map((tool) => (
              <button className="secondary-button compact" type="button" key={tool}>{tool}</button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (activeSub.key === "subtitle-studio") {
    return (
      <div className="section-grid two">
        <InfoPanel title="Subtitle List Editable" items={["00:00 Strong opening hook", "00:07 Explain key benefit", "00:18 CTA line"]} />
        <InfoPanel title="Subtitle Controls" items={["Style selector", "Language selector", "Emoji subtitle", "Karaoke subtitle", "Multi language"]} />
      </div>
    );
  }

  if (activeSub.key === "caption-generator") {
    return (
      <div className="section-grid three">
        <InfoPanel title="Generated Caption" items={["Stop wasting time editing manually. Let AI find the strongest hook and turn it into short-form clips."]} />
        <InfoPanel title="Hashtags" items={["#aitools", "#shorts", "#creatorworkflow", "#businessgrowth"]} />
        <InfoPanel title="CTA" items={["Save this workflow", "Try this today", "Follow for more AI systems"]} />
      </div>
    );
  }

  return (
    <section className="section-card">
      <SectionTitle title="Export Center" action="Export" />
      <div className="content-grid">
        {["TikTok format", "Instagram Reels", "YouTube Shorts", "Facebook Reels", "Custom export", "Save to Campaign", "Save to Library"].map((item) => (
          <article className="mini-stat" key={item}>
            <StatusBadge label="Demo Data" tone="blue" />
            <span>{item}</span>
            <button className="primary-button compact" type="button">Export</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function GeneratedClips() {
  return (
    <section className="section-card">
      <SectionTitle title="Generated Clips" action="Preview All" />
      <div className="clip-list">
        {["Hook A", "Education Cut", "CTA Ending"].map((clip, index) => (
          <div className="clip-row" key={clip}>
            <div className="mini-thumb">C{index + 1}</div>
            <div>
              <strong>{clip}</strong>
              <span>{28 + index * 6}s duration - Demo Data</span>
            </div>
            <ScoreBadge score={91 - index * 4} label="Hook" />
            <ScoreBadge score={88 - index * 3} label="Viral" />
            <StatusBadge label={index === 0 ? "Ready" : "Draft"} tone={index === 0 ? "green" : "amber"} />
            <button className="secondary-button tiny" type="button">Edit</button>
            <button className="secondary-button tiny" type="button">Save to Campaign</button>
            <button className="ghost-button tiny" type="button">Save to Library</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function CampaignContent({ activeSub }: { activeSub: SubNavItem }) {
  if (activeSub.key === "create") {
    return (
      <section className="section-card">
        <SectionTitle title="Create Campaign" action="Save Draft" />
        <FormGrid items={["Campaign name", "Campaign owner/provider", "Campaign type", "Goal", "Platform", "Start date", "End date", "Target content count", "Required videos per day", "Target views", "Target engagement", "Reward/revenue notes"]} />
      </section>
    );
  }

  if (activeSub.key === "rules") {
    return (
      <div className="section-grid three">
        {["Content Rules", "Hashtag Rules", "CTA Rules", "Publishing Rules", "Platform Rules", "Compliance Rules"].map((title) => (
          <InfoPanel title={title} items={["Demo Data", "Rule enabled", "AI suggestion available", "Fix button ready"]} key={title} />
        ))}
      </div>
    );
  }

  if (activeSub.key === "compliance") {
    return (
      <section className="section-card">
        <SectionTitle title="Compliance Center" action="Run AI Checker" />
        <ComplianceChecklist />
      </section>
    );
  }

  if (activeSub.key === "assets") {
    return <InfoPanel title="Campaign Assets" items={["Clips", "Captions", "Thumbnails", "Hashtags", "CTA assets"]} />;
  }

  if (activeSub.key === "performance") {
    return <InfoPanel title="Campaign Performance" items={["Views", "Engagement", "Followers", "Clicks", "Conversions", "Revenue"]} />;
  }

  return (
    <section className="section-card">
      <SectionTitle title={activeSub.key === "library" ? "Campaign Library" : activeSub.key === "archive" ? "Campaign Archive" : "Campaign Dashboard"} action="Filter" />
      <FilterBar filters={["Status", "Platform", "Type", "Provider"]} />
      <div className="campaign-grid">
        {campaigns.map((campaign) => (
          <CampaignCard campaign={campaign} key={campaign.name} />
        ))}
      </div>
    </section>
  );
}

function ContentLibraryContent({ activeSub }: { activeSub: SubNavItem }) {
  if (activeSub.key === "categories") {
    return <InfoPanel title="Categories" items={categories} />;
  }

  if (activeSub.key === "collections") {
    return <InfoPanel title="Collections" items={["Favorites", "Ready To Publish", "Scheduled", "Published", "Best Performers", "Archived"]} />;
  }

  if (activeSub.key === "search") {
    return (
      <section className="section-card">
        <SectionTitle title="Search Center" action="Search" />
        <FormGrid items={["Keyword", "Category", "Platform", "Status", "Date", "Performance", "Campaign"]} />
      </section>
    );
  }

  return (
    <section className="section-card">
      <SectionTitle title={activeSub.key === "archive" ? "Archive" : "All Content"} action="Grid/List Toggle" />
      <div className="content-grid">
        {contentItems.map((item) => (
          <ContentCard item={item} key={item.title} />
        ))}
      </div>
    </section>
  );
}

function SchedulerContent({ activeSub }: { activeSub: SubNavItem }) {
  if (activeSub.key === "connected-accounts") {
    return (
      <section className="section-card">
        <SectionTitle title="Connected Accounts" action="Refresh Status" />
        <div className="account-grid">
          {accounts.map((account) => (
            <AccountCard account={account} key={account.name} />
          ))}
        </div>
      </section>
    );
  }

  if (activeSub.key === "publishing-calendar") {
    return (
      <section className="section-card">
        <SectionTitle title="Publishing Calendar" action="Monthly View" />
        <FilterBar filters={["Daily", "Weekly", "Monthly", "Drag-drop style placeholder"]} />
        <ScheduleCalendar />
      </section>
    );
  }

  if (activeSub.key === "auto-posting") {
    return <InfoPanel title="Auto Posting" items={["Best time AI", "Timezone", "Posting slots", "Bulk publishing"]} />;
  }

  if (activeSub.key === "approval-center") {
    return <InfoPanel title="Approval Center" items={["Pending", "Approved", "Rejected", "Telegram Approval"]} />;
  }

  if (activeSub.key === "publishing-logs") {
    return <InfoPanel title="Publishing Logs" items={["Success", "Failed", "Retry Queue"]} />;
  }

  return <InfoPanel title="Content Queue" items={["Draft", "Ready", "Scheduled", "Published"]} />;
}

function AnalyticsContent({ activeSub }: { activeSub: SubNavItem }) {
  const map: Record<string, string[]> = {
    overview: ["Total views", "Watch time", "Followers", "Engagement", "Growth"],
    platform: ["YouTube", "TikTok", "Instagram", "Facebook"],
    content: ["Top content", "Worst content", "Best hooks", "Best CTA", "Best duration"],
    "ai-insights": ["Best niche", "Best topic", "Best format", "Best posting time", "Growth suggestions"],
    niche: niches,
    campaign: ["Campaign reach", "Engagement", "Conversion", "Revenue"],
    reports: ["Daily", "Weekly", "Monthly", "PDF export", "Excel export"]
  };

  return (
    <div className="section-grid two">
      <InfoPanel title={activeSub.label} items={map[activeSub.key] ?? map.overview} />
      <section className="section-card">
        <SectionTitle title="Insight Chart" action="Export" />
        <AnalyticsChart variant={activeSub.key === "content" ? "bar" : "area"} />
      </section>
    </div>
  );
}

function SettingsContent({ activeSub }: { activeSub: SubNavItem }) {
  const map: Record<string, string[]> = {
    profile: ["Name", "Email", "Avatar", "Plan"],
    workspace: ["Workspace name", "Logo", "Brand color", "Timezone"],
    "ai-providers": ["Gemini - Not Connected", "OpenAI - Not Connected", "Claude - Not Connected", "Custom Provider - Not Connected"],
    "social-integrations": ["YouTube OAuth - Not Connected", "TikTok OAuth - Not Connected", "Meta OAuth - Not Connected", "Telegram Bot - Not Connected"],
    storage: ["Usage cards", "Media storage", "Archive storage"],
    notifications: ["Email", "Telegram", "Browser notification"],
    security: ["Password", "2FA", "Devices", "Sessions"],
    billing: ["Subscription", "Usage", "Invoices"],
    "api-management": ["API keys", "Webhook", "External integrations"],
    "backup-restore": ["Manual backup", "Auto backup", "Restore"],
    "system-logs": ["Activity logs", "Error logs", "Audit logs"]
  };

  return (
    <div className="section-grid two">
      <InfoPanel title={activeSub.label} items={map[activeSub.key] ?? map.profile} />
      <section className="section-card">
        <SectionTitle title="Settings Form" action="Save" />
        <FormGrid items={(map[activeSub.key] ?? map.profile).slice(0, 6)} />
      </section>
    </div>
  );
}

function StatsGrid() {
  return (
    <section className="stats-grid">
      {stats.map((stat) => (
        <StatCard stat={stat} key={stat.label} />
      ))}
    </section>
  );
}

function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {action && <button className="ghost-button" type="button">{action}</button>}
    </div>
  );
}

function InfoPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="section-card">
      <SectionTitle title={title} />
      <StatusBadge label="Demo Data" tone="blue" />
      <div className="tag-cloud">
        {items.map((item, index) => (
          <StatusBadge label={item} tone={index % 3 === 0 ? "blue" : index % 3 === 1 ? "cyan" : "slate"} key={item} />
        ))}
      </div>
      {items.length === 0 && <EmptyState title="No data yet" description="Demo placeholder ready for backend integration." />}
    </section>
  );
}

function getAIItems(key: string) {
  const map: Record<string, string[]> = {
    "trend-discovery": ["Trending topics", "Trending videos", "Trending creators", "Trending keywords"],
    "niche-explorer": niches,
    "opportunity-scanner": ["Viral Score", "Growth Score", "Engagement Score", "Competition Score", "Clipping Score"],
    "competitor-intelligence": ["Channel velocity", "Posting cadence", "Winning hooks", "Format gaps"],
    "ai-advisor": ["Best topic: AI workflows", "Best format: checklist", "Best platform: TikTok", "Next action: create 6 clips"],
    "top-20-opportunities": ["Thumbnail", "Title", "Channel", "Platform", "Views", "Engagement", "Viral Score", "Clipping Score", "Niche", "Status"],
    "saved-opportunities": ["Saved clips", "Saved niches", "Saved competitor scans", "Saved AI notes"]
  };

  return map[key] ?? map["trend-discovery"];
}

function getRouteFromPath(pathname: string): { page: PageId; path: string } {
  const normalized = normalizePath(pathname);
  const allPaths = navItems.flatMap((item) => [item.path, ...item.submenu.map((sub) => sub.path)]);
  const routePath = allPaths.includes(normalized) ? normalized : "/dashboard";
  const page = navItems.find((item) => routePath === item.path || routePath.startsWith(`${item.path}/`))?.id ?? "dashboard";
  return { page, path: routePath };
}

function getActiveSub(nav: (typeof navItems)[number], activePath: string): SubNavItem {
  return nav.submenu.find((item) => item.path === activePath) ?? nav.submenu[0];
}

function normalizePath(pathname: string) {
  const trimmed = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  return trimmed === "/" ? "/dashboard" : trimmed;
}

function readSelectedSource() {
  try {
    const value = localStorage.getItem(SELECTED_SOURCE_KEY);
    return value ? (JSON.parse(value) as VideoOpportunity) : null;
  } catch {
    return null;
  }
}
