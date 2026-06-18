import { useMemo, useState } from "react";
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
import type { PageId, VideoOpportunity } from "./types";

export function App() {
  const initialPage = getPageFromPath();
  const [activePage, setActivePage] = useState<PageId>(initialPage);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<VideoOpportunity | null>(null);

  const activeNav = useMemo(() => navItems.find((item) => item.id === activePage) ?? navItems[0], [activePage]);

  const navigate = (page: PageId) => {
    setActivePage(page);
    setMobileOpen(false);
    window.history.pushState({}, "", navItems.find((item) => item.id === page)?.path ?? "/dashboard");
  };

  const clipVideo = (item: VideoOpportunity) => {
    setSelectedSource(item);
    navigate("clip-studio");
  };

  return (
    <div className="app-shell">
      <AppSidebar
        activePage={activePage}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onCollapse={() => setSidebarCollapsed((value) => !value)}
        onCloseMobile={() => setMobileOpen((value) => !value)}
        onNavigate={navigate}
      />
      <div className={`app-main ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <AppHeader title={activeNav.label} path={activeNav.path} onOpenMobile={() => setMobileOpen(true)} />
        <main className="content-layout">
          <section className="page-content">
            <PageRouter activePage={activePage} selectedSource={selectedSource} onClip={clipVideo} />
          </section>
          <RightPanel />
        </main>
      </div>
    </div>
  );
}

function PageRouter({ activePage, selectedSource, onClip }: { activePage: PageId; selectedSource: VideoOpportunity | null; onClip: (item: VideoOpportunity) => void }) {
  switch (activePage) {
    case "ai-clip-intelligence":
      return <AIClipIntelligence onClip={onClip} />;
    case "clip-studio":
      return <ClipStudio selectedSource={selectedSource} />;
    case "campaign-clipper":
      return <CampaignClipper />;
    case "content-library":
      return <ContentLibrary />;
    case "scheduler":
      return <Scheduler />;
    case "analytics":
      return <Analytics />;
    case "settings":
      return <Settings />;
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
        title="Welcome back to FVN AI Clipper"
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
        <div className="opportunity-grid">
          {opportunities.map((item) => (
            <VideoOpportunityCard item={item} onClip={onClip} key={item.id} />
          ))}
        </div>
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
    </>
  );
}

function AIClipIntelligence({ onClip }: { onClip: (item: VideoOpportunity) => void }) {
  return (
    <>
      <PageHeader
        eyebrow="AI Clip Intelligence"
        title="Discover clip opportunities before they peak"
        description="Search keywords, filter platforms and niches, then send the strongest videos directly into Clip Studio."
        actions={<button className="primary-button" type="button">Save Opportunity</button>}
      />
      <FilterBar filters={["Keyword", "YouTube", "TikTok", "Instagram", "Facebook", "Region", "Period", "Niche"]} />
      <StatsGrid />
      <div className="section-grid three">
        <InfoPanel title="Trend Discovery" items={["Trending topics", "Trending videos", "Trending creators", "Trending keywords"]} />
        <InfoPanel title="Niche Explorer" items={niches} />
        <InfoPanel title="Opportunity Scanner" items={["Viral Score", "Growth Score", "Engagement Score", "Competition Score", "Clipping Score"]} />
      </div>
      <section className="section-card">
        <SectionTitle title="Top 20 Opportunities" action="View Saved" />
        <VideoOpportunityTable items={opportunities} onClip={onClip} />
      </section>
      <div className="section-grid two">
        <InfoPanel title="Competitor Intelligence" items={["Channel velocity", "Posting cadence", "Winning hooks", "Format gaps"]} />
        <InfoPanel title="AI Advisor" items={["Best topic: AI workflows", "Best format: checklist", "Best platform: TikTok", "Next action: create 6 clips"]} />
      </div>
    </>
  );
}

function ClipStudio({ selectedSource }: { selectedSource: VideoOpportunity | null }) {
  return (
    <>
      <PageHeader
        eyebrow="Clip Studio"
        title="Create, edit, caption, and export short clips"
        description="Source intake, AI generation, editing controls, subtitle studio, captions, and exports are grouped into one workflow."
        actions={<button className="primary-button" type="button">Save to Library</button>}
      />
      {selectedSource && (
        <section className="section-card selected-source">
          <StatusBadge label="Selected Source" tone="blue" />
          <h3>{selectedSource.title}</h3>
          <p>{selectedSource.channel} - {selectedSource.platform} - {selectedSource.views} views</p>
        </section>
      )}
      <section className="section-card">
        <SectionTitle title="Source Video" action="Cloud Storage Coming Soon" />
        <UploadPanel />
      </section>
      <div className="section-grid two">
        <section className="section-card">
          <SectionTitle title="AI Clip Generator" action="Generate Clips" />
          <FormGrid items={["Clip count", "Duration", "Platform target", "Language", "Video style"]} />
          <ToggleGrid items={["Subtitle on/off", "Auto Hook", "Auto Reframe", "Auto Zoom", "Auto CTA"]} />
        </section>
        <section className="section-card">
          <SectionTitle title="Generated Clip List" action="Preview" />
          <div className="clip-list">
            {["Hook A", "Education Cut", "CTA Ending"].map((clip, index) => (
              <div className="clip-row" key={clip}>
                <div className="mini-thumb">C{index + 1}</div>
                <div>
                  <strong>{clip}</strong>
                  <span>{28 + index * 6}s duration</span>
                </div>
                <ScoreBadge score={91 - index * 4} label="Clip" />
                <button className="secondary-button tiny" type="button">Preview</button>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="section-grid three">
        <InfoPanel title="Clip Editor" items={["Video preview", "Timeline editor UI", "Trim", "Split", "Merge", "Crop", "Resize", "Watermark", "Branding", "CTA overlay"]} />
        <InfoPanel title="Subtitle Studio" items={["Auto subtitle", "Translate subtitle", "Subtitle style", "Emoji subtitle", "Karaoke subtitle", "Multi language"]} />
        <InfoPanel title="Caption Generator" items={["Caption AI", "Hook Generator", "CTA Generator", "Hashtag Generator", "SEO Generator"]} />
      </div>
      <section className="section-card">
        <SectionTitle title="Export Center" action="Export" />
        <div className="tag-cloud">
          {["TikTok format", "Instagram Reels", "YouTube Shorts", "Facebook Reels", "Custom export", "Save to Campaign", "Save to Library"].map((item) => (
            <StatusBadge label={item} tone="cyan" key={item} />
          ))}
        </div>
      </section>
    </>
  );
}

function CampaignClipper() {
  return (
    <>
      <PageHeader
        eyebrow="Campaign Clipper"
        title="Plan campaigns with rules, assets, compliance, and performance"
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
      <section className="section-card">
        <SectionTitle title="Campaign Dashboard" action="Campaign Library" />
        <div className="campaign-grid">
          {campaigns.map((campaign) => (
            <CampaignCard campaign={campaign} key={campaign.name} />
          ))}
        </div>
      </section>
      <div className="section-grid two">
        <section className="section-card">
          <SectionTitle title="Create Campaign" action="Save Draft" />
          <FormGrid items={["Campaign Name", "Campaign Type", "Campaign Goal", "Target Platform", "Target Audience", "Start Date", "End Date", "Target Content Count", "Target Views", "Target Engagement"]} />
        </section>
        <section className="section-card">
          <SectionTitle title="Compliance Center" action="Run AI Checker" />
          <ComplianceChecklist />
        </section>
      </div>
      <div className="section-grid three">
        <InfoPanel title="Campaign Rules" items={["Minimum videos per day", "Maximum videos per day", "Required duration", "Required CTA", "Required product mention", "Required hashtags", "Blocked hashtags", "Posting schedule"]} />
        <InfoPanel title="Campaign Assets" items={["Generated clips", "Captions", "Thumbnails", "Hashtags", "CTA assets"]} />
        <InfoPanel title="Campaign Performance" items={["Views", "Engagement", "Followers", "Clicks", "Conversions", "Revenue"]} />
      </div>
    </>
  );
}

function ContentLibrary() {
  return (
    <>
      <PageHeader
        eyebrow="Content Library"
        title="Organize every clip by category, campaign, and performance"
        description="Browse all content, collections, categories, search filters, and archived assets in one clean library."
        actions={<button className="primary-button" type="button">View All</button>}
      />
      <FilterBar filters={["Keyword", "Category", "Platform", "Status", "Date", "Performance", "Campaign", "Grid/List"]} />
      <section className="section-card">
        <SectionTitle title="All Content" action="List Toggle" />
        <div className="content-grid">
          {contentItems.map((item) => (
            <ContentCard item={item} key={item.title} />
          ))}
        </div>
      </section>
      <div className="section-grid three">
        <InfoPanel title="Auto Categories" items={categories} />
        <InfoPanel title="Collections" items={["Favorites", "Ready To Publish", "Scheduled", "Published", "Best Performers", "Archived"]} />
        <InfoPanel title="Content Detail" items={["Video preview", "Subtitle", "Caption", "Thumbnail", "Campaign history", "Publishing history", "Analytics snapshot"]} />
      </div>
    </>
  );
}

function Scheduler() {
  return (
    <>
      <PageHeader
        eyebrow="Scheduler"
        title="Schedule publishing across multi-account destinations"
        description="Manage connected accounts, queue status, calendar views, auto posting, approvals, and logs."
        actions={<button className="primary-button" type="button">Add Account</button>}
      />
      <section className="section-card">
        <SectionTitle title="Connected Accounts" action="Refresh Status" />
        <div className="account-grid">
          {accounts.map((account) => (
            <AccountCard account={account} key={account.name} />
          ))}
        </div>
      </section>
      <div className="section-grid two">
        <section className="section-card">
          <SectionTitle title="Publishing Calendar" action="Monthly View" />
          <ScheduleCalendar />
        </section>
        <section className="section-card">
          <SectionTitle title="Content Queue" action="Bulk Publishing" />
          <InfoPanel title="Queue Status" items={["Draft", "Ready", "Scheduled", "Published"]} />
          <InfoPanel title="Approval Center" items={["Pending", "Approved", "Rejected", "Telegram Approval placeholder"]} />
        </section>
      </div>
      <div className="section-grid two">
        <InfoPanel title="Auto Posting" items={["Posting schedule", "Bulk publishing", "AI best time", "Timezone management"]} />
        <InfoPanel title="Publishing Logs" items={["Success", "Failed", "Retry Queue"]} />
      </div>
    </>
  );
}

function Analytics() {
  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Track performance and turn insights into better clips"
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
      <div className="section-grid three">
        <InfoPanel title="Platform Analytics" items={["YouTube", "TikTok", "Instagram", "Facebook"]} />
        <InfoPanel title="Content Analytics" items={["Top content", "Worst content", "Best hooks", "Best CTA", "Best duration"]} />
        <InfoPanel title="AI Insights" items={["Best niche", "Best topic", "Best format", "Best posting time", "Growth suggestions"]} />
      </div>
      <div className="section-grid two">
        <InfoPanel title="Campaign Analytics" items={["Campaign reach", "Campaign engagement", "Campaign conversion", "Campaign revenue"]} />
        <InfoPanel title="Reports" items={["Daily", "Weekly", "Monthly", "PDF Export", "Excel Export"]} />
      </div>
    </>
  );
}

function Settings() {
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Configure workspace, integrations, providers, security, and logs"
        description="Everything is labeled as demo or placeholder where a real external connection is not active."
        actions={<button className="primary-button" type="button">Save Settings</button>}
      />
      <div className="section-grid three">
        <InfoPanel title="Profile" items={["Name", "Email", "Avatar", "Plan"]} />
        <InfoPanel title="Workspace" items={["Workspace name", "Brand color", "Logo", "Timezone"]} />
        <InfoPanel title="AI Providers" items={["Gemini", "OpenAI", "Claude", "Custom Provider"]} />
      </div>
      <div className="section-grid three">
        <InfoPanel title="Social Integrations" items={["YouTube OAuth", "TikTok OAuth", "Meta OAuth", "Telegram Bot"]} />
        <InfoPanel title="Storage" items={["Usage", "Media storage", "Archive storage"]} />
        <InfoPanel title="Notifications" items={["Email", "Telegram", "Browser notification"]} />
      </div>
      <div className="section-grid three">
        <InfoPanel title="Security" items={["Password", "2FA", "Device management", "Session management"]} />
        <InfoPanel title="Billing" items={["Subscription", "Usage", "Invoices"]} />
        <InfoPanel title="API Management" items={["API keys", "Webhook", "External integrations"]} />
      </div>
      <div className="section-grid two">
        <InfoPanel title="Backup & Restore" items={["Manual backup", "Auto backup", "Restore"]} />
        <InfoPanel title="System Logs" items={["Activity logs", "Error logs", "Audit logs"]} />
      </div>
    </>
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
      <div className="tag-cloud">
        {items.map((item, index) => (
          <StatusBadge label={item} tone={index % 3 === 0 ? "blue" : index % 3 === 1 ? "cyan" : "slate"} key={item} />
        ))}
      </div>
      {items.length === 0 && <EmptyState title="No data yet" description="Demo placeholder ready for backend integration." />}
    </section>
  );
}

function getPageFromPath(): PageId {
  const path = window.location.pathname.replace("/", "");
  return navItems.find((item) => item.id === path)?.id ?? "dashboard";
}
