import { useEffect, useMemo, useState } from "react";
import {
  AccountCard,
  ActivityFeed,
  AnalyticsChart,
  AppHeader,
  AppShell,
  AppSidebar,
  CalendarPreview,
  CampaignCard,
  ComplianceChecklist,
  ContentCard,
  EmptyState,
  FilterBar,
  FormGrid,
  GeneratedClipList,
  PageHeader,
  RightPanel,
  StatCard,
  StatusBadge,
  ToggleGrid,
  UploadPanel,
  VideoOpportunityCard,
  VideoOpportunityTable
} from "./components";
import {
  activities,
  campaigns,
  categories,
  defaultAccounts,
  defaultContentItems,
  defaultGeneratedClips,
  defaultSchedules,
  navItems,
  niches,
  opportunities,
  stats
} from "./data/ai-clipper-demo";
import { aiProviderEnvStatus, environmentStatus, featureFlagEnvStatus, socialIntegrationEnvStatus } from "./env";
import type { Account, Campaign, ContentItem, GeneratedClip, PageId, ScheduleItem, SubNavItem, VideoOpportunity } from "./types";
import type { EnvStatusItem } from "./env";

const SELECTED_SOURCE_KEY = "fvn-selected-source";
const SAVED_OPPORTUNITIES_KEY = "fvn-saved-opportunities";
const GENERATED_CLIPS_KEY = "fvn-generated-clips";
const CONTENT_ITEMS_KEY = "fvn-content-items";
const CAMPAIGNS_KEY = "fvn-campaigns";
const SCHEDULES_KEY = "fvn-schedules";
const ACCOUNTS_KEY = "fvn-accounts";
const APPROVAL_STATUS_KEY = "fvn-approval-status";

export function App() {
  const initialRoute = getRouteFromPath(window.location.pathname);
  const [activePage, setActivePage] = useState<PageId>(initialRoute.page);
  const [activePath, setActivePath] = useState(initialRoute.path);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<VideoOpportunity | null>(() => readSelectedSource());
  const [savedOpportunities, setSavedOpportunities] = usePersistentState<VideoOpportunity[]>(SAVED_OPPORTUNITIES_KEY, []);
  const [generatedClips, setGeneratedClips] = usePersistentState<GeneratedClip[]>(GENERATED_CLIPS_KEY, []);
  const [contentLibrary, setContentLibrary] = usePersistentState<ContentItem[]>(CONTENT_ITEMS_KEY, defaultContentItems);
  const [campaignList, setCampaignList] = usePersistentState<Campaign[]>(CAMPAIGNS_KEY, campaigns);
  const [scheduleList, setScheduleList] = usePersistentState<ScheduleItem[]>(SCHEDULES_KEY, defaultSchedules);
  const [accountList, setAccountList] = usePersistentState<Account[]>(ACCOUNTS_KEY, defaultAccounts);
  const [approvalStatus, setApprovalStatus] = usePersistentState<"Pending" | "Approved" | "Rejected">(APPROVAL_STATUS_KEY, "Pending");
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

  const saveOpportunity = (item: VideoOpportunity) => {
    setSavedOpportunities((current) => (current.some((opportunity) => opportunity.id === item.id) ? current : [...current, { ...item, status: "Saved" }]));
    showToast(`Saved opportunity: ${item.title}`);
  };

  const analyzeOpportunity = (item: VideoOpportunity) => {
    setSavedOpportunities((current) => {
      const analyzed = { ...item, status: "Analyzed" as const };
      return current.some((opportunity) => opportunity.id === item.id) ? current.map((opportunity) => (opportunity.id === item.id ? analyzed : opportunity)) : [...current, analyzed];
    });
    showToast(`Analyzed opportunity: ${item.title}`);
  };

  const generateDemoClips = () => {
    const sourceTitle = selectedSource?.title ?? "Manual source video";
    const clips = defaultGeneratedClips.map((clip, index) => ({
      ...clip,
      id: `${Date.now()}-${index}`,
      sourceTitle,
      status: index === 0 ? ("Ready" as const) : ("Draft" as const)
    }));
    setGeneratedClips(clips);
    navigate("/clip-studio/ai-clip-generator");
    showToast(`Generated ${clips.length} demo clips`);
  };

  const saveClipToLibrary = (clip: GeneratedClip) => {
    setGeneratedClips((current) => current.map((item) => (item.id === clip.id ? { ...item, status: "Saved to Library" } : item)));
    setContentLibrary((current) => {
      if (current.some((item) => item.id === `library-${clip.id}`)) {
        return current;
      }
      return [
        {
          id: `library-${clip.id}`,
          title: clip.title,
          category: selectedSource?.niche ?? "AI",
          platform: selectedSource?.platform ?? "TikTok",
          campaign: "Demo Data",
          status: "Ready",
          metric: `${clip.viralScore} viral score`
        },
        ...current
      ];
    });
    showToast(`Saved ${clip.title} to Content Library`);
  };

  const saveClipToCampaign = (clip: GeneratedClip) => {
    setGeneratedClips((current) => current.map((item) => (item.id === clip.id ? { ...item, status: "Saved to Campaign" } : item)));
    setCampaignList((current) => {
      if (current.some((campaign) => campaign.name === "Demo Clip Draft Campaign")) {
        return current;
      }
      return [
        {
          name: "Demo Clip Draft Campaign",
          platform: selectedSource?.platform ?? "TikTok",
          start: "Draft",
          end: "Draft",
          progress: 10,
          compliance: 82,
          status: "Draft"
        },
        ...current
      ];
    });
    showToast(`Saved ${clip.title} to Campaign`);
  };

  const addCampaignDraft = () => {
    const draftName = `Demo Campaign Draft ${campaignList.length + 1}`;
    setCampaignList((current) => [
      {
        name: draftName,
        platform: selectedSource?.platform ?? "TikTok",
        start: "Draft",
        end: "Draft",
        progress: 0,
        compliance: 78,
        status: "Draft"
      },
      ...current
    ]);
    showToast(`Added campaign draft: ${draftName}`);
  };

  const scheduleContent = (item: ContentItem) => {
    const schedule: ScheduleItem = {
      id: `schedule-${Date.now()}`,
      title: item.title,
      account: "TikTok A",
      platform: item.platform,
      day: "Thu",
      time: "19:00",
      status: "Scheduled"
    };
    setScheduleList((current) => [schedule, ...current]);
    setContentLibrary((current) => current.map((content) => (content.title === item.title ? { ...content, status: "Scheduled", metric: `${schedule.day} ${schedule.time}` } : content)));
    showToast(`Scheduled ${item.title}`);
  };

  const toggleAccount = (account: Account) => {
    setAccountList((current) =>
      current.map((item) =>
        item.name === account.name
          ? {
              ...item,
              status: item.status === "Connected" ? "Not Connected" : "Connected",
              health: item.status === "Connected" ? "Manually disconnected" : "Demo connection active",
              lastSync: item.status === "Connected" ? "Never" : "Just now"
            }
          : item
      )
    );
    showToast(`${account.name} status toggled`);
  };

  const updateApprovalStatus = (status: "Pending" | "Approved" | "Rejected") => {
    setApprovalStatus(status);
    showToast(`Approval status: ${status}`);
  };

  return (
    <AppShell onAction={showToast}>
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
            <PageRouter
              activePage={activePage}
              activeSub={activeSub}
              accountList={accountList}
              approvalStatus={approvalStatus}
              campaignList={campaignList}
              contentLibrary={contentLibrary}
              generatedClips={generatedClips}
              savedOpportunities={savedOpportunities}
              scheduleList={scheduleList}
              selectedSource={selectedSource}
              onAnalyze={analyzeOpportunity}
              onAddCampaignDraft={addCampaignDraft}
              onClip={clipVideo}
              onGenerateClips={generateDemoClips}
              onNavigate={navigate}
              onSaveClipToCampaign={saveClipToCampaign}
              onSaveClipToLibrary={saveClipToLibrary}
              onSaveOpportunity={saveOpportunity}
              onScheduleContent={scheduleContent}
              onToggleAccount={toggleAccount}
              onUpdateApproval={updateApprovalStatus}
            />
          </section>
          <RightPanel accounts={accountList} />
        </main>
      </div>
      <div className="toast" role="status">{toast}</div>
    </AppShell>
  );
}

function PageRouter({
  activePage,
  activeSub,
  accountList,
  approvalStatus,
  campaignList,
  contentLibrary,
  generatedClips,
  savedOpportunities,
  scheduleList,
  selectedSource,
  onAnalyze,
  onAddCampaignDraft,
  onClip,
  onGenerateClips,
  onNavigate,
  onSaveClipToCampaign,
  onSaveClipToLibrary,
  onSaveOpportunity,
  onScheduleContent,
  onToggleAccount,
  onUpdateApproval
}: {
  activePage: PageId;
  activeSub: SubNavItem;
  accountList: Account[];
  approvalStatus: "Pending" | "Approved" | "Rejected";
  campaignList: Campaign[];
  contentLibrary: ContentItem[];
  generatedClips: GeneratedClip[];
  savedOpportunities: VideoOpportunity[];
  scheduleList: ScheduleItem[];
  selectedSource: VideoOpportunity | null;
  onAnalyze: (item: VideoOpportunity) => void;
  onAddCampaignDraft: () => void;
  onClip: (item: VideoOpportunity) => void;
  onGenerateClips: () => void;
  onNavigate: (path: string) => void;
  onSaveClipToCampaign: (clip: GeneratedClip) => void;
  onSaveClipToLibrary: (clip: GeneratedClip) => void;
  onSaveOpportunity: (item: VideoOpportunity) => void;
  onScheduleContent: (item: ContentItem) => void;
  onToggleAccount: (account: Account) => void;
  onUpdateApproval: (status: "Pending" | "Approved" | "Rejected") => void;
}) {
  switch (activePage) {
    case "ai-clip-intelligence":
      return <AIClipIntelligence activeSub={activeSub} savedOpportunities={savedOpportunities} onAnalyze={onAnalyze} onClip={onClip} onSave={onSaveOpportunity} />;
    case "clip-studio":
      return (
        <ClipStudio
          activeSub={activeSub}
          generatedClips={generatedClips}
          selectedSource={selectedSource}
          onGenerateClips={onGenerateClips}
          onNavigate={onNavigate}
          onSaveClipToCampaign={onSaveClipToCampaign}
          onSaveClipToLibrary={onSaveClipToLibrary}
        />
      );
    case "campaign-clipper":
      return <CampaignClipper activeSub={activeSub} campaigns={campaignList} generatedClips={generatedClips} onAddCampaignDraft={onAddCampaignDraft} />;
    case "content-library":
      return <ContentLibrary activeSub={activeSub} contentItems={contentLibrary} onScheduleContent={onScheduleContent} />;
    case "scheduler":
      return <Scheduler activeSub={activeSub} accounts={accountList} approvalStatus={approvalStatus} schedules={scheduleList} onToggleAccount={onToggleAccount} onUpdateApproval={onUpdateApproval} />;
    case "analytics":
      return <Analytics activeSub={activeSub} contentCount={contentLibrary.length} scheduleCount={scheduleList.length} />;
    case "settings":
      return <Settings activeSub={activeSub} />;
    case "dashboard":
    default:
      return <Dashboard accounts={accountList} campaigns={campaignList} schedules={scheduleList} onAnalyze={onAnalyze} onClip={onClip} onSave={onSaveOpportunity} />;
  }
}

function Dashboard({
  accounts,
  campaigns,
  schedules,
  onAnalyze,
  onClip,
  onSave
}: {
  accounts: Account[];
  campaigns: Campaign[];
  schedules: ScheduleItem[];
  onAnalyze: (item: VideoOpportunity) => void;
  onClip: (item: VideoOpportunity) => void;
  onSave: (item: VideoOpportunity) => void;
}) {
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
        <VideoOpportunityTable items={opportunities} onAnalyze={onAnalyze} onClip={onClip} onSave={onSave} />
      </section>
      <div className="section-grid two">
        <section className="section-card">
          <SectionTitle title="Upcoming Schedule" action="View Calendar" />
          <CalendarPreview schedules={schedules} />
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

function AIClipIntelligence({
  activeSub,
  savedOpportunities,
  onAnalyze,
  onClip,
  onSave
}: {
  activeSub: SubNavItem;
  savedOpportunities: VideoOpportunity[];
  onAnalyze: (item: VideoOpportunity) => void;
  onClip: (item: VideoOpportunity) => void;
  onSave: (item: VideoOpportunity) => void;
}) {
  const detailItems = getAIItems(activeSub.key);
  const tableItems = activeSub.key === "saved-opportunities" ? savedOpportunities : opportunities;
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
        {tableItems.length === 0 ? (
          <EmptyState title="No saved opportunities yet" description="Click Save on any opportunity to store it here as Demo Data." />
        ) : (
          <VideoOpportunityTable items={tableItems} onAnalyze={onAnalyze} onClip={onClip} onSave={onSave} />
        )}
      </section>
    </>
  );
}

function ClipStudio({
  activeSub,
  generatedClips,
  selectedSource,
  onGenerateClips,
  onNavigate,
  onSaveClipToCampaign,
  onSaveClipToLibrary
}: {
  activeSub: SubNavItem;
  generatedClips: GeneratedClip[];
  selectedSource: VideoOpportunity | null;
  onGenerateClips: () => void;
  onNavigate: (path: string) => void;
  onSaveClipToCampaign: (clip: GeneratedClip) => void;
  onSaveClipToLibrary: (clip: GeneratedClip) => void;
}) {
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
      <ClipStudioContent
        activeSub={activeSub}
        generatedClips={generatedClips}
        onGenerateClips={onGenerateClips}
        onSaveClipToCampaign={onSaveClipToCampaign}
        onSaveClipToLibrary={onSaveClipToLibrary}
      />
    </>
  );
}

function CampaignClipper({
  activeSub,
  campaigns,
  generatedClips,
  onAddCampaignDraft
}: {
  activeSub: SubNavItem;
  campaigns: Campaign[];
  generatedClips: GeneratedClip[];
  onAddCampaignDraft: () => void;
}) {
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
      <CampaignContent activeSub={activeSub} campaigns={campaigns} generatedClips={generatedClips} onAddCampaignDraft={onAddCampaignDraft} />
    </>
  );
}

function ContentLibrary({ activeSub, contentItems, onScheduleContent }: { activeSub: SubNavItem; contentItems: ContentItem[]; onScheduleContent: (item: ContentItem) => void }) {
  return (
    <>
      <PageHeader
        eyebrow="Content Library"
        title={activeSub.label}
        description="Browse all content, collections, categories, search filters, and archived assets in one clean library."
        actions={<button className="primary-button" type="button">View All</button>}
      />
      <FilterBar filters={["Keyword", "Category", "Platform", "Status", "Date", "Performance", "Campaign", "Grid/List"]} />
      <ContentLibraryContent activeSub={activeSub} contentItems={contentItems} onScheduleContent={onScheduleContent} />
    </>
  );
}

function Scheduler({
  activeSub,
  accounts,
  approvalStatus,
  schedules,
  onToggleAccount,
  onUpdateApproval
}: {
  activeSub: SubNavItem;
  accounts: Account[];
  approvalStatus: "Pending" | "Approved" | "Rejected";
  schedules: ScheduleItem[];
  onToggleAccount: (account: Account) => void;
  onUpdateApproval: (status: "Pending" | "Approved" | "Rejected") => void;
}) {
  return (
    <>
      <PageHeader
        eyebrow="Scheduler"
        title={activeSub.label}
        description="Manage connected accounts, queue status, calendar views, auto posting, approvals, and logs."
        actions={<button className="primary-button" type="button">Add Account</button>}
      />
      <SchedulerContent activeSub={activeSub} accounts={accounts} approvalStatus={approvalStatus} schedules={schedules} onToggleAccount={onToggleAccount} onUpdateApproval={onUpdateApproval} />
    </>
  );
}

function Analytics({ activeSub, contentCount, scheduleCount }: { activeSub: SubNavItem; contentCount: number; scheduleCount: number }) {
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
      <AnalyticsContent activeSub={activeSub} contentCount={contentCount} scheduleCount={scheduleCount} />
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

function ClipStudioContent({
  activeSub,
  generatedClips,
  onGenerateClips,
  onSaveClipToCampaign,
  onSaveClipToLibrary
}: {
  activeSub: SubNavItem;
  generatedClips: GeneratedClip[];
  onGenerateClips: () => void;
  onSaveClipToCampaign: (clip: GeneratedClip) => void;
  onSaveClipToLibrary: (clip: GeneratedClip) => void;
}) {
  if (activeSub.key === "source-video") {
    return (
      <section className="section-card">
        <SectionTitle title="Source Video" action="Generate Clips" />
        <UploadPanel />
        <div className="row wrap" style={{ marginTop: 14 }}>
          <button className="primary-button" type="button" onClick={onGenerateClips}>Generate Demo Clips</button>
          <button className="secondary-button" type="button">Analyze Source</button>
        </div>
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
          <button className="primary-button" type="button" onClick={onGenerateClips}>Generate Clips</button>
        </section>
        <GeneratedClipList clips={generatedClips} onSaveToCampaign={onSaveClipToCampaign} onSaveToLibrary={onSaveClipToLibrary} />
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
      <GeneratedClipList clips={generatedClips} onSaveToCampaign={onSaveClipToCampaign} onSaveToLibrary={onSaveClipToLibrary} />
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

function CampaignContent({
  activeSub,
  campaigns,
  generatedClips,
  onAddCampaignDraft
}: {
  activeSub: SubNavItem;
  campaigns: Campaign[];
  generatedClips: GeneratedClip[];
  onAddCampaignDraft: () => void;
}) {
  if (activeSub.key === "create") {
    return (
      <section className="section-card">
        <SectionTitle title="Create Campaign" action="Save Draft" />
        <FormGrid items={["Campaign name", "Campaign owner/provider", "Campaign type", "Goal", "Platform", "Start date", "End date", "Target content count", "Required videos per day", "Target views", "Target engagement", "Reward/revenue notes"]} />
        <div className="row wrap" style={{ marginTop: 14 }}>
          <button className="primary-button" type="button" onClick={onAddCampaignDraft}>Add Campaign Draft</button>
        </div>
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
    return (
      <div className="section-grid two">
        <InfoPanel title="Campaign Assets" items={["Clips", "Captions", "Thumbnails", "Hashtags", "CTA assets"]} />
        <InfoPanel title="Saved Campaign Clips" items={generatedClips.filter((clip) => clip.status === "Saved to Campaign").map((clip) => clip.title)} />
      </div>
    );
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

function ContentLibraryContent({ activeSub, contentItems, onScheduleContent }: { activeSub: SubNavItem; contentItems: ContentItem[]; onScheduleContent: (item: ContentItem) => void }) {
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
          <ContentCard item={item} onSchedule={onScheduleContent} key={`${item.id}-${item.title}`} />
        ))}
      </div>
    </section>
  );
}

function SchedulerContent({
  activeSub,
  accounts,
  approvalStatus,
  schedules,
  onToggleAccount,
  onUpdateApproval
}: {
  activeSub: SubNavItem;
  accounts: Account[];
  approvalStatus: "Pending" | "Approved" | "Rejected";
  schedules: ScheduleItem[];
  onToggleAccount: (account: Account) => void;
  onUpdateApproval: (status: "Pending" | "Approved" | "Rejected") => void;
}) {
  if (activeSub.key === "connected-accounts") {
    return (
      <section className="section-card">
        <SectionTitle title="Connected Accounts" action="Refresh Status" />
        <div className="account-grid">
          {accounts.map((account) => (
            <AccountCard account={account} onToggle={onToggleAccount} key={account.name} />
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
        <CalendarPreview schedules={schedules} />
      </section>
    );
  }

  if (activeSub.key === "auto-posting") {
    return <InfoPanel title="Auto Posting" items={["Best time AI", "Timezone", "Posting slots", "Bulk publishing"]} />;
  }

  if (activeSub.key === "approval-center") {
    return (
      <section className="section-card">
        <SectionTitle title="Approval Center" action="Telegram Approval" />
        <StatusBadge label={approvalStatus} tone={approvalStatus === "Approved" ? "green" : approvalStatus === "Rejected" ? "red" : "amber"} />
        <div className="row wrap" style={{ marginTop: 14 }}>
          {(["Pending", "Approved", "Rejected"] as const).map((status) => (
            <button className="secondary-button" type="button" onClick={() => onUpdateApproval(status)} key={status}>{status}</button>
          ))}
        </div>
      </section>
    );
  }

  if (activeSub.key === "publishing-logs") {
    return <InfoPanel title="Publishing Logs" items={["Success", "Failed", "Retry Queue"]} />;
  }

  return <InfoPanel title="Content Queue" items={["Draft", "Ready", "Scheduled", "Published", ...schedules.map((schedule) => `${schedule.title} - ${schedule.status}`)]} />;
}

function AnalyticsContent({ activeSub, contentCount, scheduleCount }: { activeSub: SubNavItem; contentCount: number; scheduleCount: number }) {
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
      <InfoPanel title={activeSub.label} items={[...(map[activeSub.key] ?? map.overview), `${contentCount} library items`, `${scheduleCount} scheduled items`]} />
      <section className="section-card">
        <SectionTitle title="Insight Chart" action="Export" />
        <AnalyticsChart variant={activeSub.key === "content" ? "bar" : "area"} />
      </section>
    </div>
  );
}

function SettingsContent({ activeSub }: { activeSub: SubNavItem }) {
  if (activeSub.key === "ai-providers") {
    return <EnvStatusPanel title="AI Providers" description="Secret keys stay server-side. The UI reads public feature flags and shows safe provider status." items={aiProviderEnvStatus} />;
  }

  if (activeSub.key === "social-integrations") {
    return <EnvStatusPanel title="Social Integrations" description="OAuth secrets are not exposed to the frontend. Demo mode and real API flags drive these statuses." items={socialIntegrationEnvStatus} />;
  }

  if (activeSub.key === "api-management") {
    return (
      <div className="section-grid two">
        <EnvStatusPanel title="Feature Flags" description="Public environment flags for demo data, real API mode, and auto-posting." items={featureFlagEnvStatus} />
        <InfoPanel title="API Management" items={["API keys", "Webhook", "External integrations", `App: ${environmentStatus.appName}`, `URL: ${environmentStatus.appUrl}`]} />
      </div>
    );
  }

  const map: Record<string, string[]> = {
    profile: ["Name", "Email", "Avatar", "Plan"],
    workspace: ["Workspace name", "Logo", "Brand color", "Timezone"],
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

function EnvStatusPanel({ title, description, items }: { title: string; description: string; items: EnvStatusItem[] }) {
  return (
    <section className="section-card">
      <SectionTitle title={title} action="Open ENV_SETUP" />
      <p className="muted env-description">{description}</p>
      <div className="env-status-grid">
        {items.map((item) => (
          <article className="env-status-card" key={item.name}>
            <div className="row between gap">
              <strong>{item.name}</strong>
              <StatusBadge label={item.status} tone={item.tone} />
            </div>
            <p>{item.note}</p>
            <div className="tag-cloud">
              {item.required.map((key) => (
                <StatusBadge label={key} tone="slate" key={key} />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
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

function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
