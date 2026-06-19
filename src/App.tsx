import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import {
  AccountCard,
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
  SocialIcon,
  StatCard,
  StatusBadge,
  ToggleGrid,
  UploadPanel,
  VideoOpportunityCard,
  VideoOpportunityTable
} from "./components";
import {
  campaigns,
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
import {
  buildOpportunityUrl,
  fetchApiData,
  formatEnumLabel,
  mapCampaign,
  mapOpportunity,
  mapSchedule,
  toApiPerformance,
  toApiPlatform,
  toApiStatus,
  type ApiCampaign,
  type ApiCategory,
  type ApiCompetitor,
  type ApiOpportunity,
  type ApiPublishingSchedule,
  type ApiRecommendation,
  type DashboardOverviewData,
  type OpportunityQuery
} from "./api";

const SELECTED_SOURCE_KEY = "fvn-selected-source";
const SAVED_OPPORTUNITIES_KEY = "fvn-saved-opportunities";
const GENERATED_CLIPS_KEY = "fvn-generated-clips";
const CONTENT_ITEMS_KEY = "fvn-content-items";
const CAMPAIGNS_KEY = "fvn-campaigns";
const SCHEDULES_KEY = "fvn-schedules";
const ACCOUNTS_KEY = "fvn-accounts";
const APPROVAL_STATUS_KEY = "fvn-approval-status";

type PlatformFilter = "All" | "YouTube" | "TikTok" | "Instagram" | "Facebook";
type StatusFilter = "All" | ContentItem["status"] | "Paused";
type PerformanceFilter = "All" | "High" | "Medium" | "Low";
type ViewMode = "grid" | "list";

interface DemoFilterState {
  keyword: string;
  category: string;
  platform: PlatformFilter;
  status: StatusFilter;
  date: string;
  performance: PerformanceFilter;
  campaign: string;
}

const defaultDemoFilters: DemoFilterState = {
  keyword: "",
  category: "Demo Data",
  platform: "All",
  status: "All",
  date: "",
  performance: "All",
  campaign: "All"
};

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
  const [opportunityList, setOpportunityList] = useState<VideoOpportunity[]>(opportunities);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState("Not scanned yet");
  const [scanSummary, setScanSummary] = useState<string[]>(["New opportunities found: 0", "Best niche: Demo Data", "Best platform: Demo Data", "Average clipping score: 0"]);
  const [analysisTarget, setAnalysisTarget] = useState<VideoOpportunity | null>(null);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [accountPlatform, setAccountPlatform] = useState("YouTube");
  const [accountName, setAccountName] = useState("");
  const [accountHandle, setAccountHandle] = useState("");
  const [connectionMode, setConnectionMode] = useState<"Demo Connect" | "OAuth Placeholder">("Demo Connect");
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

  const saveOpportunity = async (item: VideoOpportunity) => {
    try {
      await fetchApiData<ApiOpportunity>(`/api/ai-clip-intelligence/opportunities/${item.id}/save`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ saved: !item.isSaved })
      });
      showToast(`${item.isSaved ? "Unsaved" : "Saved"} opportunity: ${item.title}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to update opportunity");
    }
  };

  const analyzeOpportunity = (item: VideoOpportunity) => {
    setAnalysisTarget(item);
    setSavedOpportunities((current) => {
      const analyzed = { ...item, status: "Analyzed" as const };
      return current.some((opportunity) => opportunity.id === item.id) ? current.map((opportunity) => (opportunity.id === item.id ? analyzed : opportunity)) : [...current, analyzed];
    });
    showToast(`Analyzed opportunity: ${item.title}`);
  };

  const runAIScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const sorted = [...opportunityList].sort((a, b) => b.clippingScore - a.clippingScore);
      const average = Math.round(sorted.reduce((total, item) => total + item.clippingScore, 0) / sorted.length);
      setOpportunityList(sorted);
      setLastScanned(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setScanSummary([
        `New opportunities found: ${sorted.length}`,
        `Best niche: ${sorted[0]?.niche ?? "Demo Data"}`,
        `Best platform: ${sorted[0]?.platform ?? "Demo Data"}`,
        `Average clipping score: ${average}`
      ]);
      setIsScanning(false);
      showToast("AI scan completed");
    }, 900);
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
          metric: `${clip.viralScore} viral score`,
          date: "2026-06-18",
          performance: clip.viralScore >= 88 ? "High" : "Medium"
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

  const archiveContent = (item: ContentItem) => {
    setContentLibrary((current) => current.map((content) => (content.title === item.title ? { ...content, status: "Archived", metric: "Archived" } : content)));
    showToast(`Archived ${item.title}`);
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

  const refreshAccount = (account: Account) => {
    setAccountList((current) => current.map((item) => (item.name === account.name ? { ...item, lastSync: "Just now", health: item.status === "Connected" ? "Ready" : "OAuth required" } : item)));
    showToast(`Refreshed ${account.name}`);
  };

  const connectAccountFromModal = () => {
    const name = accountName.trim() || `${accountPlatform} Demo`;
    const status = connectionMode === "Demo Connect" ? "Connected" : "Not Connected";
    setAccountList((current) => [
      {
        name,
        platform: accountPlatform,
        status,
        health: connectionMode === "Demo Connect" ? `Demo connected ${accountHandle || "account"}` : "OAuth placeholder not configured",
        lastSync: connectionMode === "Demo Connect" ? "Just now" : "Never"
      },
      ...current
    ]);
    setAddAccountOpen(false);
    setAccountName("");
    setAccountHandle("");
    showToast(connectionMode === "Demo Connect" ? "Account connected" : "OAuth is not configured yet");
  };

  const updateApprovalStatus = (status: "Pending" | "Approved" | "Rejected") => {
    setApprovalStatus(status);
    showToast(`Approval status: ${status}`);
  };

  const handleCreateSelect = (action: "clip" | "campaign" | "schedule" | "account" | "scan") => {
    if (action === "clip") {
      navigate("/clip-studio/source-video");
    } else if (action === "campaign") {
      navigate("/campaign-clipper/create");
    } else if (action === "schedule") {
      navigate("/scheduler/publishing-calendar");
    } else if (action === "account") {
      setAddAccountOpen(true);
    } else {
      navigate("/ai-clip-intelligence/top-20-opportunities");
      runAIScan();
    }
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
        <AppHeader title={activeNav.label} path={activePath} onOpenMobile={() => setMobileOpen(true)} onAction={showToast} onCreateSelect={handleCreateSelect} />
        <main className={`content-layout ${activePage === "dashboard" ? "dashboard-layout" : ""}`}>
          <section className="page-content">
            {activePage !== "dashboard" && <ActiveSubmenuBar items={activeNav.submenu} activePath={activePath} onNavigate={navigate} />}
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
              onOpenAddAccount={() => setAddAccountOpen(true)}
              onRefreshAccount={refreshAccount}
              onRunAIScan={runAIScan}
              onArchiveContent={archiveContent}
              onSaveClipToCampaign={saveClipToCampaign}
              onSaveClipToLibrary={saveClipToLibrary}
              onSaveOpportunity={saveOpportunity}
              onScheduleContent={scheduleContent}
              onToggleAccount={toggleAccount}
              onUpdateApproval={updateApprovalStatus}
              isScanning={isScanning}
              lastScanned={lastScanned}
              opportunityList={opportunityList}
              scanSummary={scanSummary}
            />
          </section>
          {activePage !== "dashboard" && <RightPanel accounts={accountList} />}
        </main>
      </div>
      {analysisTarget && <AnalysisModal item={analysisTarget} onClose={() => setAnalysisTarget(null)} />}
      {addAccountOpen && (
        <AddAccountModal
          accountHandle={accountHandle}
          accountName={accountName}
          connectionMode={connectionMode}
          platform={accountPlatform}
          onCancel={() => setAddAccountOpen(false)}
          onConnect={connectAccountFromModal}
          onHandleChange={setAccountHandle}
          onModeChange={setConnectionMode}
          onNameChange={setAccountName}
          onPlatformChange={setAccountPlatform}
        />
      )}
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
  onArchiveContent,
  onClip,
  onGenerateClips,
  onNavigate,
  onOpenAddAccount,
  onRefreshAccount,
  onRunAIScan,
  onSaveClipToCampaign,
  onSaveClipToLibrary,
  onSaveOpportunity,
  onScheduleContent,
  onToggleAccount,
  onUpdateApproval,
  isScanning,
  lastScanned,
  opportunityList,
  scanSummary
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
  onArchiveContent: (item: ContentItem) => void;
  onClip: (item: VideoOpportunity) => void;
  onGenerateClips: () => void;
  onNavigate: (path: string) => void;
  onOpenAddAccount: () => void;
  onRefreshAccount: (account: Account) => void;
  onRunAIScan: () => void;
  onSaveClipToCampaign: (clip: GeneratedClip) => void;
  onSaveClipToLibrary: (clip: GeneratedClip) => void;
  onSaveOpportunity: (item: VideoOpportunity) => void;
  onScheduleContent: (item: ContentItem) => void;
  onToggleAccount: (account: Account) => void;
  onUpdateApproval: (status: "Pending" | "Approved" | "Rejected") => void;
  isScanning: boolean;
  lastScanned: string;
  opportunityList: VideoOpportunity[];
  scanSummary: string[];
}) {
  switch (activePage) {
    case "ai-clip-intelligence":
      return (
        <AIClipIntelligence
          activeSub={activeSub}
          isScanning={isScanning}
          lastScanned={lastScanned}
          opportunities={opportunityList}
          savedOpportunities={savedOpportunities}
          scanSummary={scanSummary}
          onAnalyze={onAnalyze}
          onClip={onClip}
          onNavigate={onNavigate}
          onRunAIScan={onRunAIScan}
          onSave={onSaveOpportunity}
        />
      );
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
      return <ContentLibrary activeSub={activeSub} contentItems={contentLibrary} onArchiveContent={onArchiveContent} onScheduleContent={onScheduleContent} />;
    case "scheduler":
      return <Scheduler activeSub={activeSub} accounts={accountList} approvalStatus={approvalStatus} schedules={scheduleList} onOpenAddAccount={onOpenAddAccount} onRefreshAccount={onRefreshAccount} onToggleAccount={onToggleAccount} onUpdateApproval={onUpdateApproval} />;
    case "analytics":
      return <Analytics activeSub={activeSub} contentCount={contentLibrary.length} scheduleCount={scheduleList.length} />;
    case "settings":
      return <Settings activeSub={activeSub} />;
    case "dashboard":
    default:
      return <Dashboard activeSub={activeSub} campaigns={campaignList} opportunities={opportunityList} schedules={scheduleList} onAnalyze={onAnalyze} onClip={onClip} onNavigate={onNavigate} onSave={onSaveOpportunity} />;
  }
}

function Dashboard({
  activeSub,
  onNavigate
}: {
  activeSub: SubNavItem;
  campaigns: Campaign[];
  opportunities: VideoOpportunity[];
  schedules: ScheduleItem[];
  onAnalyze: (item: VideoOpportunity) => void;
  onClip: (item: VideoOpportunity) => void;
  onNavigate: (path: string) => void;
  onSave: (item: VideoOpportunity) => void;
}) {
  const overview = useApiResource<DashboardOverviewData>("/api/dashboard/overview", activeSub.key === "overview");
  const recommendationState = useApiResource<ApiRecommendation[]>("/api/dashboard/recommendations", activeSub.key === "overview" || activeSub.key === "ai-recommendation-today");
  const campaignState = useApiResource<ApiCampaign[]>("/api/dashboard/campaigns", activeSub.key === "overview" || activeSub.key === "campaign-overview");
  const calendarState = useApiResource<ApiPublishingSchedule[]>("/api/dashboard/publishing-calendar", activeSub.key === "overview" || activeSub.key === "publishing-calendar-preview");
  const topOpportunityState = useApiResource<ApiOpportunity[]>(buildOpportunityUrl({ limit: 20, sort: "opportunityScore_desc" }), activeSub.key === "overview");

  if (activeSub.key === "ai-recommendation-today") {
    return (
      <>
        <DashboardHero />
        <ApiStateView state={recommendationState} emptyTitle="No recommendations yet" emptyDescription="Database returned no AI Recommendation Today records.">
          {(items) => (
            <section className="section-card">
              <SectionTitle title="AI Recommendation Today" action="Open AI Advisor" onAction={() => onNavigate("/ai-clip-intelligence/ai-advisor")} />
              <RecommendationList items={items} />
            </section>
          )}
        </ApiStateView>
      </>
    );
  }

  if (activeSub.key === "campaign-overview") {
    const campaignItems = campaignState.data?.map(mapCampaign) ?? [];

    return (
      <>
        <DashboardHero />
        <ApiStateView state={campaignState} emptyTitle="No campaigns found" emptyDescription="Database returned no campaign records.">
          {() => (
            <section className="section-card">
              <SectionTitle title="Campaign Overview" action="View All Campaigns" onAction={() => onNavigate("/campaign-clipper/library")} />
              <div className="campaign-grid">
                {campaignItems.map((campaign) => (
                  <CampaignCard campaign={campaign} key={campaign.id ?? campaign.name} />
                ))}
              </div>
            </section>
          )}
        </ApiStateView>
      </>
    );
  }

  if (activeSub.key === "publishing-calendar-preview") {
    const scheduleItems = calendarState.data?.map(mapSchedule) ?? [];

    return (
      <>
        <DashboardHero />
        <ApiStateView state={calendarState} emptyTitle="No publishing schedules found" emptyDescription="Database returned no calendar records.">
          {() => (
            <>
              <section className="section-card">
                <SectionTitle title="Publishing Calendar Preview" action="Open Calendar" onAction={() => onNavigate("/scheduler/publishing-calendar")} />
                <CalendarPreview schedules={scheduleItems} />
              </section>
              <section className="section-card">
                <SectionTitle title="Upcoming Schedule" action="Content Queue" onAction={() => onNavigate("/scheduler/content-queue")} />
                <DashboardSchedule schedules={scheduleItems} />
              </section>
            </>
          )}
        </ApiStateView>
      </>
    );
  }

  return (
    <>
      <DashboardHero />
      <ApiStateViewObject state={overview} emptyTitle="No dashboard overview data" emptyDescription="Database returned no overview metrics.">
        {(data) => (
          <DashboardOverviewLayout
            calendarState={calendarState}
            campaignState={campaignState}
            data={data}
            onNavigate={onNavigate}
            recommendationState={recommendationState}
            topOpportunityState={topOpportunityState}
          />
        )}
      </ApiStateViewObject>
    </>
  );
}

function DashboardHero() {
  return (
    <section className="dashboard-hero">
      <div>
        <h1>Dashboard Overview</h1>
        <p>Welcome back. Here's what's happening with your content empire today.</p>
      </div>
      <button className="date-button" type="button">
        Friday, 19 Jun 2026
      </button>
    </section>
  );
}

function DashboardSchedule({ schedules }: { schedules: ScheduleItem[] }) {
  const rows = schedules.slice(0, 4);

  return (
    <div className="dashboard-schedule">
      {rows.length === 0 && <EmptyState title="No schedule data" description="Database returned no publishing schedule records." />}
      {rows.map((schedule) => (
        <div className="schedule-row" key={schedule.id}>
          <span className="schedule-time">{schedule.time}</span>
          <SocialIcon platform={schedule.platform} />
          <span className="schedule-copy">
            <strong>{schedule.title}</strong>
            <small>{schedule.account}</small>
          </span>
          <span className="schedule-day">Today</span>
          {schedule.sourceType && <StatusBadge label={schedule.sourceType} tone={schedule.sourceType === "DEMO" ? "blue" : "slate"} />}
        </div>
      ))}
    </div>
  );
}

function TopClipRow({ item, index, onClip }: { item: VideoOpportunity; index: number; onClip: (item: VideoOpportunity) => void }) {
  return (
    <article className="top-clip-row">
      <span className="top-clip-index">{index}</span>
      <div className="mini-thumb">{item.thumbnail}</div>
      <div className="top-clip-copy">
        <strong>{item.title}</strong>
        <span>
          <SocialIcon platform={item.platform} size="small" />
          {item.platform}
        </span>
      </div>
      <div className="top-clip-metric">
        <small>Views</small>
        <strong>{item.views}</strong>
      </div>
      <div className="top-clip-metric">
        <small>Eng.</small>
        <strong>{item.engagement}</strong>
      </div>
      {item.sourceType && <StatusBadge label={item.sourceType} tone={item.sourceType === "DEMO" ? "blue" : "slate"} />}
      <button className="primary-button compact" type="button" onClick={() => onClip(item)}>Clip</button>
    </article>
  );
}

function AIClipIntelligence({
  activeSub,
  isScanning,
  onAnalyze,
  onClip,
  onNavigate,
  onRunAIScan,
  onSave
}: {
  activeSub: SubNavItem;
  isScanning: boolean;
  lastScanned: string;
  opportunities: VideoOpportunity[];
  savedOpportunities: VideoOpportunity[];
  scanSummary: string[];
  onAnalyze: (item: VideoOpportunity) => void;
  onClip: (item: VideoOpportunity) => void;
  onNavigate: (path: string) => void;
  onRunAIScan: () => void;
  onSave: (item: VideoOpportunity) => void | Promise<void>;
}) {
  const [showDemoFilters, setShowDemoFilters] = useState(true);
  const [filters, setFilters] = useState<DemoFilterState>(defaultDemoFilters);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const categoryState = useApiResource<ApiCategory[]>("/api/ai-clip-intelligence/categories", true);
  const campaignState = useApiResource<ApiCampaign[]>("/api/dashboard/campaigns", true);
  const recommendationState = useApiResource<ApiRecommendation[]>("/api/dashboard/recommendations", activeSub.key === "ai-advisor");
  const competitorState = useApiResource<ApiCompetitor[]>("/api/ai-clip-intelligence/competitors", activeSub.key === "competitor-intelligence");
  const opportunityUrl = useMemo(() => {
    const query: OpportunityQuery = {
      keyword: filters.keyword,
      category: filters.category,
      platform: filters.platform === "All" ? undefined : toApiPlatform(filters.platform),
      status: filters.status === "All" ? undefined : toApiStatus(filters.status),
      date: filters.date,
      performance: filters.performance === "All" ? undefined : toApiPerformance(filters.performance),
      campaign: filters.campaign
    };

    if (activeSub.key === "top-20-opportunities") {
      query.limit = 20;
      query.sort = "opportunityScore_desc";
    }

    if (activeSub.key === "saved-opportunities") {
      query.saved = true;
    }

    return buildOpportunityUrl(query);
  }, [activeSub.key, filters]);
  const opportunityState = useApiResource<ApiOpportunity[]>(opportunityUrl, activeSub.key !== "competitor-intelligence" && activeSub.key !== "ai-advisor");
  const mappedOpportunities = useMemo(() => (opportunityState.data ?? []).map(mapOpportunity), [opportunityState.data]);

  const updateFilter = <K extends keyof DemoFilterState>(key: K, value: DemoFilterState[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultDemoFilters);
    setViewMode("grid");
  };

  const saveFromApi = async (item: VideoOpportunity) => {
    await onSave(item);
    opportunityState.reload();
  };

  return (
    <>
      <PageHeader
        eyebrow="AI Clip Intelligence"
        title={activeSub.label}
        description="The intelligence hub for trends, niches, competitors, advisor insights, and short-form video opportunity scoring."
        actions={<button className="primary-button" type="button" onClick={onRunAIScan}>{isScanning ? "Scanning..." : "AI Scan"}</button>}
      />
      {activeSub.key !== "competitor-intelligence" && activeSub.key !== "ai-advisor" && (
        <OpportunityFilterPanel
          campaignOptions={campaignState.data ?? []}
          categoryOptions={categoryState.data ?? []}
          filters={filters}
          showDemoFilters={showDemoFilters}
          viewMode={viewMode}
          onReset={resetFilters}
          onToggle={() => setShowDemoFilters((value) => !value)}
          onUpdate={updateFilter}
          onViewModeChange={setViewMode}
        />
      )}
      <AIClipIntelligenceSubPage
        activeSub={activeSub}
        competitorState={competitorState}
        opportunityState={opportunityState}
        opportunities={mappedOpportunities}
        recommendationState={recommendationState}
        viewMode={viewMode}
        onAnalyze={onAnalyze}
        onClip={onClip}
        onNavigate={onNavigate}
        onSave={saveFromApi}
      />
    </>
  );
}

function AIClipIntelligenceSubPage({
  activeSub,
  competitorState,
  opportunityState,
  opportunities,
  recommendationState,
  viewMode,
  onAnalyze,
  onClip,
  onNavigate,
  onSave
}: {
  activeSub: SubNavItem;
  competitorState: ApiResourceState<ApiCompetitor[]>;
  opportunityState: ApiResourceState<ApiOpportunity[]>;
  opportunities: VideoOpportunity[];
  recommendationState: ApiResourceState<ApiRecommendation[]>;
  viewMode: ViewMode;
  onAnalyze: (item: VideoOpportunity) => void;
  onClip: (item: VideoOpportunity) => void;
  onNavigate: (path: string) => void;
  onSave: (item: VideoOpportunity) => void | Promise<void>;
}) {
  if (activeSub.key === "trend-discovery") {
    return (
      <ApiStateView state={opportunityState} emptyTitle="No trend opportunities found" emptyDescription="Try adjusting keyword, platform, category, or date filters.">
        {() => <OpportunityResults title="Trend Discovery" items={opportunities} viewMode={viewMode} onAnalyze={onAnalyze} onClip={onClip} onSave={onSave} />}
      </ApiStateView>
    );
  }

  if (activeSub.key === "niche-explorer") {
    return (
      <ApiStateView state={opportunityState} emptyTitle="No niche opportunities found" emptyDescription="Database returned no opportunities for the current niche filters.">
        {() => <NicheExplorerResults items={opportunities} />}
      </ApiStateView>
    );
  }

  if (activeSub.key === "opportunity-scanner") {
    return (
      <ApiStateView state={opportunityState} emptyTitle="No scanned opportunities found" emptyDescription="Database returned no records for the active scanner filters.">
        {() => (
          <OpportunityResults
            title="Scanned Opportunities"
            action="View Top 20"
            items={opportunities}
            viewMode={viewMode}
            onAction={() => onNavigate("/ai-clip-intelligence/top-20-opportunities")}
            onAnalyze={onAnalyze}
            onClip={onClip}
            onSave={onSave}
          />
        )}
      </ApiStateView>
    );
  }

  if (activeSub.key === "competitor-intelligence") {
    return (
      <ApiStateView state={competitorState} emptyTitle="No competitors found" emptyDescription="Database returned no competitor profiles.">
        {(items) => <CompetitorResults items={items} />}
      </ApiStateView>
    );
  }

  if (activeSub.key === "ai-advisor") {
    return (
      <ApiStateView state={recommendationState} emptyTitle="No AI advisor recommendations found" emptyDescription="Database returned no dashboard recommendations for advisor view.">
        {(items) => (
          <section className="section-card">
            <SectionTitle title="AI Advisor" action="Open Clip Studio" onAction={() => onNavigate("/clip-studio/source-video")} />
            <RecommendationList items={items} />
          </section>
        )}
      </ApiStateView>
    );
  }

  return (
    <ApiStateView
      state={opportunityState}
      emptyTitle={activeSub.key === "saved-opportunities" ? "No saved opportunities yet" : "No top opportunities found"}
      emptyDescription={activeSub.key === "saved-opportunities" ? "Use Save on an opportunity to store it in the database." : "Database returned no opportunities for the Top 20 query."}
    >
      {() => (
        <OpportunityResults
          title={activeSub.key === "saved-opportunities" ? "Saved Opportunities" : "Top 20 Opportunities"}
          action="View Saved"
          items={opportunities}
          viewMode={viewMode}
          onAction={() => onNavigate("/ai-clip-intelligence/saved-opportunities")}
          onAnalyze={onAnalyze}
          onClip={onClip}
          onSave={onSave}
        />
      )}
    </ApiStateView>
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
        actions={<button className="primary-button" type="button" onClick={onAddCampaignDraft}>Create Campaign</button>}
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

function ContentLibrary({
  activeSub,
  contentItems,
  onArchiveContent,
  onScheduleContent
}: {
  activeSub: SubNavItem;
  contentItems: ContentItem[];
  onArchiveContent: (item: ContentItem) => void;
  onScheduleContent: (item: ContentItem) => void;
}) {
  const [showDemoFilters, setShowDemoFilters] = useState(true);
  const [filters, setFilters] = useState<DemoFilterState>(defaultDemoFilters);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const categoryState = useApiResource<ApiCategory[]>("/api/ai-clip-intelligence/categories", true);
  const campaignOptions = useMemo(() => ["All", ...Array.from(new Set(contentItems.map((item) => item.campaign)))], [contentItems]);
  const filteredItems = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();

    return contentItems.filter((item) => {
      const itemPerformance = getContentPerformance(item);
      const searchable = [item.title, item.category, item.platform, item.status, item.campaign, item.metric].join(" ").toLowerCase();
      const matchesKeyword = !keyword || searchable.includes(keyword);
      const matchesCategory = filters.category === "Demo Data" || item.category === filters.category;
      const matchesPlatform = filters.platform === "All" || item.platform === filters.platform;
      const matchesStatus = filters.status === "All" || item.status === filters.status;
      const matchesDate = !filters.date || item.date === filters.date;
      const matchesPerformance = filters.performance === "All" || itemPerformance === filters.performance;
      const matchesCampaign = filters.campaign === "All" || item.campaign === filters.campaign;

      return matchesKeyword && matchesCategory && matchesPlatform && matchesStatus && matchesDate && matchesPerformance && matchesCampaign;
    });
  }, [contentItems, filters]);

  const updateFilter = <K extends keyof DemoFilterState>(key: K, value: DemoFilterState[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultDemoFilters);
    setViewMode("grid");
  };

  return (
    <>
      <PageHeader
        eyebrow="Content Library"
        title={activeSub.label}
        description="Browse all content, collections, categories, search filters, and archived assets in one clean library."
        actions={<button className="primary-button" type="button">View All</button>}
      />
      <DemoFilterPanel
        campaignOptions={campaignOptions}
        categoryOptions={(categoryState.data ?? []).map((category) => category.name)}
        filters={filters}
        showDemoFilters={showDemoFilters}
        viewMode={viewMode}
        onReset={resetFilters}
        onToggle={() => setShowDemoFilters((value) => !value)}
        onUpdate={updateFilter}
        onViewModeChange={setViewMode}
      />
      <ContentLibraryContent activeSub={activeSub} categories={categoryState.data ?? []} contentItems={filteredItems} onArchiveContent={onArchiveContent} onScheduleContent={onScheduleContent} viewMode={viewMode} />
    </>
  );
}

function Scheduler({
  activeSub,
  accounts,
  approvalStatus,
  schedules,
  onOpenAddAccount,
  onRefreshAccount,
  onToggleAccount,
  onUpdateApproval
}: {
  activeSub: SubNavItem;
  accounts: Account[];
  approvalStatus: "Pending" | "Approved" | "Rejected";
  schedules: ScheduleItem[];
  onOpenAddAccount: () => void;
  onRefreshAccount: (account: Account) => void;
  onToggleAccount: (account: Account) => void;
  onUpdateApproval: (status: "Pending" | "Approved" | "Rejected") => void;
}) {
  return (
    <>
      <PageHeader
        eyebrow="Scheduler"
        title={activeSub.label}
        description="Manage connected accounts, queue status, calendar views, auto posting, approvals, and logs."
        actions={<button className="primary-button" type="button" onClick={onOpenAddAccount}>Add Account</button>}
      />
      <SchedulerContent activeSub={activeSub} accounts={accounts} approvalStatus={approvalStatus} schedules={schedules} onOpenAddAccount={onOpenAddAccount} onRefreshAccount={onRefreshAccount} onToggleAccount={onToggleAccount} onUpdateApproval={onUpdateApproval} />
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

interface ApiResourceState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

function ApiStateView<T extends unknown[]>({
  state,
  emptyTitle,
  emptyDescription,
  children
}: {
  state: ApiResourceState<T>;
  emptyTitle: string;
  emptyDescription: string;
  children: (data: T) => ReactNode;
}) {
  if (state.loading) {
    return <EmptyState title="Loading database data..." description="Fetching the latest records from the API." />;
  }

  if (state.error) {
    return <EmptyState title="Unable to load database data" description={state.error} />;
  }

  if (!state.data || state.data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return <>{children(state.data)}</>;
}

function ApiStateViewObject<T>({
  state,
  emptyTitle,
  emptyDescription,
  children
}: {
  state: ApiResourceState<T>;
  emptyTitle: string;
  emptyDescription: string;
  children: (data: T) => ReactNode;
}) {
  if (state.loading) {
    return <EmptyState title="Loading database data..." description="Fetching the latest records from the API." />;
  }

  if (state.error) {
    return <EmptyState title="Unable to load database data" description={state.error} />;
  }

  if (!state.data) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return <>{children(state.data)}</>;
}

function DashboardMetricGrid({ data, recommendationCount }: { data: DashboardOverviewData; recommendationCount?: number }) {
  const dashboardStats = [
    { label: "Total Projects", value: String(data.totals.campaigns + data.totals.opportunities), delta: "Database records", tone: "blue" as const },
    { label: "AI Recommendations Today", value: String(recommendationCount ?? data.latestRecommendations.length), delta: "Latest database advice", tone: "cyan" as const },
    { label: "Active Campaigns", value: String(data.totals.campaigns), delta: "Campaign overview", tone: "slate" as const },
    { label: "Scheduled Posts", value: String(data.totals.scheduledPosts), delta: "Publishing calendar", tone: "amber" as const },
    { label: "Saved Opportunities", value: String(data.totals.savedOpportunities), delta: "Saved opportunities", tone: "green" as const }
  ];

  return (
    <section className="stats-grid dashboard-kpis">
      {dashboardStats.map((stat) => (
        <StatCard stat={stat} key={stat.label} />
      ))}
    </section>
  );
}

function DashboardOverviewLayout({
  calendarState,
  campaignState,
  data,
  onNavigate,
  recommendationState,
  topOpportunityState
}: {
  calendarState: ApiResourceState<ApiPublishingSchedule[]>;
  campaignState: ApiResourceState<ApiCampaign[]>;
  data: DashboardOverviewData;
  onNavigate: (path: string) => void;
  recommendationState: ApiResourceState<ApiRecommendation[]>;
  topOpportunityState: ApiResourceState<ApiOpportunity[]>;
}) {
  const topOpportunities = (topOpportunityState.data ?? []).map(mapOpportunity).slice(0, 5);

  return (
    <div className="dashboard-overview-grid">
      <DashboardMetricGrid data={data} recommendationCount={recommendationState.data?.length} />
      <DashboardPanel className="dashboard-panel-recommendations" title="AI Recommendation Today" action="View All" onAction={() => onNavigate("/dashboard/ai-recommendation-today")}>
        <PanelApiState state={recommendationState} emptyTitle="Tidak ada data yang cocok.">
          {(items) => <RecommendationList items={items.slice(0, 3)} />}
        </PanelApiState>
        <button className="panel-footer-button" type="button" onClick={() => onNavigate("/dashboard/ai-recommendation-today")}>Explore More Recommendations</button>
      </DashboardPanel>
      <DashboardPanel title="Campaign Overview" action="View All" onAction={() => onNavigate("/dashboard/campaign-overview")}>
        <PanelApiState state={campaignState} emptyTitle="Tidak ada data yang cocok.">
          {(items) => <CampaignOverviewList items={items.slice(0, 5)} />}
        </PanelApiState>
        <button className="panel-footer-button" type="button" onClick={() => onNavigate("/dashboard/campaign-overview")}>Manage Campaigns</button>
      </DashboardPanel>
      <DashboardPanel className="dashboard-panel-calendar" title="Publishing Calendar Preview" action="Today" onAction={() => onNavigate("/dashboard/publishing-calendar-preview")}>
        <PanelApiState state={calendarState} emptyTitle="Tidak ada data yang cocok.">
          {(items) => <PublishingPreviewPanel schedules={items.map(mapSchedule)} />}
        </PanelApiState>
        <button className="panel-footer-button" type="button" onClick={() => onNavigate("/dashboard/publishing-calendar-preview")}>View Full Calendar</button>
      </DashboardPanel>
      <DashboardPanel className="dashboard-panel-top" title="Top Opportunities" action="View Full Opportunities" onAction={() => onNavigate("/ai-clip-intelligence/top-20-opportunities")}>
        <PanelApiState state={topOpportunityState} emptyTitle="Tidak ada data yang cocok.">
          {() => <TopOpportunityRanking items={topOpportunities} />}
        </PanelApiState>
      </DashboardPanel>
      <DashboardPanel title="Insights at a Glance">
        <InsightsAtGlance data={data} opportunities={topOpportunities} />
      </DashboardPanel>
    </div>
  );
}

function DashboardPanel({ action, children, className = "", onAction, title }: { action?: string; children: ReactNode; className?: string; onAction?: () => void; title: string }) {
  return (
    <section className={`section-card dashboard-panel ${className}`}>
      <SectionTitle title={title} action={action} onAction={onAction} />
      {children}
    </section>
  );
}

function PanelApiState<T extends unknown[]>({ children, emptyTitle, state }: { children: (data: T) => ReactNode; emptyTitle: string; state: ApiResourceState<T> }) {
  if (state.loading) {
    return <div className="dashboard-skeleton"><span /><span /><span /></div>;
  }

  if (state.error) {
    return <EmptyState title="Unable to load database data" description={state.error} />;
  }

  if (!state.data || state.data.length === 0) {
    return <EmptyState title={emptyTitle} description="Data dari API kosong untuk panel ini." />;
  }

  return <>{children(state.data)}</>;
}

function CampaignOverviewList({ items }: { items: ApiCampaign[] }) {
  return (
    <div className="dashboard-list">
      {items.map((item) => (
        <article className="dashboard-list-row" key={item.id}>
          <div className="mini-thumb">{item.name.slice(0, 2).toUpperCase()}</div>
          <div className="dashboard-list-copy">
            <strong>{item.name}</strong>
            <span>{formatEnumLabel(item.platform)}{item.category ? ` - ${item.category.name}` : ""}</span>
          </div>
          <StatusBadge label={formatEnumLabel(item.status)} tone={item.status === "FAILED" ? "red" : item.status === "PAUSED" ? "amber" : "green"} />
          <div className="dashboard-score">
            <small>Items</small>
            <strong>{item._count?.opportunities ?? 0}</strong>
          </div>
        </article>
      ))}
    </div>
  );
}

function PublishingPreviewPanel({ schedules }: { schedules: ScheduleItem[] }) {
  const rows = schedules.slice(0, 8);

  return (
    <div className="calendar-preview-list">
      {rows.map((schedule) => (
        <article className="calendar-preview-item" key={schedule.id}>
          <span className="schedule-time">{schedule.time}</span>
          <SocialIcon platform={schedule.platform} size="small" />
          <div className="dashboard-list-copy">
            <strong>{schedule.title}</strong>
            <span>{schedule.day} - {schedule.status}</span>
          </div>
          {schedule.sourceType && <StatusBadge label={schedule.sourceType} tone={schedule.sourceType === "DEMO" ? "blue" : "slate"} />}
        </article>
      ))}
    </div>
  );
}

function TopOpportunityRanking({ items }: { items: VideoOpportunity[] }) {
  return (
    <div className="ranking-list">
      {items.map((item, index) => (
        <article className="ranking-row" key={item.id}>
          <span className="rank-badge">{index + 1}</span>
          <div className="dashboard-list-copy">
            <strong>{item.title}</strong>
            <span>{item.niche}</span>
          </div>
          <strong>{item.opportunityScore ?? item.clippingScore}</strong>
          <div className="rank-progress"><span style={{ width: `${item.opportunityScore ?? item.clippingScore}%` }} /></div>
          {item.sourceType && <StatusBadge label={item.sourceType} tone={item.sourceType === "DEMO" ? "blue" : "slate"} />}
        </article>
      ))}
    </div>
  );
}

function InsightsAtGlance({ data, opportunities }: { data: DashboardOverviewData; opportunities: VideoOpportunity[] }) {
  const avgScore = opportunities.length ? Math.round(opportunities.reduce((total, item) => total + (item.opportunityScore ?? item.clippingScore), 0) / opportunities.length) : 0;
  const published = data.totals.publishedPosts;
  const scheduled = data.totals.scheduledPosts;

  return (
    <div className="insight-grid">
      <article className="mini-stat">
        <span>Avg Opportunity Score</span>
        <strong>{avgScore}</strong>
        <small>From top opportunities</small>
      </article>
      <article className="mini-stat">
        <span>Scheduled / Published</span>
        <strong>{scheduled}/{published}</strong>
        <small>Publishing status</small>
      </article>
      <article className="mini-stat">
        <span>Failed Posts</span>
        <strong>{data.totals.failedPosts}</strong>
        <small>Needs attention</small>
      </article>
      <div className="dashboard-tip">
        <Sparkles size={18} />
        <span>Tip: keep a steady publishing rhythm and start from the highest opportunity score.</span>
      </div>
    </div>
  );
}

function RecommendationList({ items }: { items: ApiRecommendation[] }) {
  return (
    <div className="recommendation-panel">
      {items.map((item) => (
        <article className="recommendation-row" key={item.id}>
          <StatusBadge label={item.sourceType} tone={item.sourceType === "DEMO" ? "blue" : "slate"} />
          <div>
            <small>{item.priority} - {formatEnumLabel(item.recommendationType)}</small>
            <strong>{item.title}</strong>
            <span>{item.summary}</span>
          </div>
          {item.actionLabel && <StatusBadge label={item.actionLabel} tone="cyan" />}
        </article>
      ))}
    </div>
  );
}

function OpportunityFilterPanel({
  campaignOptions,
  categoryOptions,
  filters,
  showDemoFilters,
  viewMode,
  onReset,
  onToggle,
  onUpdate,
  onViewModeChange
}: {
  campaignOptions: ApiCampaign[];
  categoryOptions: ApiCategory[];
  filters: DemoFilterState;
  showDemoFilters: boolean;
  viewMode: ViewMode;
  onReset: () => void;
  onToggle: () => void;
  onUpdate: <K extends keyof DemoFilterState>(key: K, value: DemoFilterState[K]) => void;
  onViewModeChange: (mode: ViewMode) => void;
}) {
  return (
    <section className="section-card demo-filter-card">
      <div className="section-title">
        <h2>Demo filters</h2>
        <div className="row wrap">
          <button className="secondary-button compact" type="button" onClick={onToggle}>{showDemoFilters ? "Hide Demo Filters" : "Show Demo Filters"}</button>
          <button className="ghost-button compact" type="button" onClick={onReset}>Reset Filters</button>
        </div>
      </div>
      {showDemoFilters && (
        <div className="demo-filter-grid">
          <label>
            <span>Keyword</span>
            <input value={filters.keyword} onChange={(event) => onUpdate("keyword", event.target.value)} placeholder="Search title, keyword, niche..." />
          </label>
          <label>
            <span>Category</span>
            <select value={filters.category} onChange={(event) => onUpdate("category", event.target.value)}>
              <option value="Demo Data">Demo Data</option>
              {categoryOptions.map((item) => (
                <option value={item.slug} key={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Platform</span>
            <select value={filters.platform} onChange={(event) => onUpdate("platform", event.target.value as PlatformFilter)}>
              {(["All", "YouTube", "TikTok", "Instagram", "Facebook"] as const).map((item) => (
                <option value={item} key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Status</span>
            <select value={filters.status} onChange={(event) => onUpdate("status", event.target.value as StatusFilter)}>
              {(["All", "Draft", "Ready", "Scheduled", "Published", "Failed", "Paused"] as const).map((item) => (
                <option value={item} key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Date</span>
            <input type="date" value={filters.date} onChange={(event) => onUpdate("date", event.target.value)} />
          </label>
          <label>
            <span>Performance</span>
            <select value={filters.performance} onChange={(event) => onUpdate("performance", event.target.value as PerformanceFilter)}>
              {(["All", "High", "Medium", "Low"] as const).map((item) => (
                <option value={item} key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Campaign</span>
            <select value={filters.campaign} onChange={(event) => onUpdate("campaign", event.target.value)}>
              <option value="All">All</option>
              {campaignOptions.map((item) => (
                <option value={item.slug} key={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <div className="view-toggle" aria-label="Grid/List view mode">
            <span>Grid/List</span>
            <button className={viewMode === "grid" ? "active" : ""} type="button" onClick={() => onViewModeChange("grid")}>Grid</button>
            <button className={viewMode === "list" ? "active" : ""} type="button" onClick={() => onViewModeChange("list")}>List</button>
          </div>
        </div>
      )}
    </section>
  );
}

function OpportunityResults({
  title,
  action,
  items,
  viewMode,
  onAction,
  onAnalyze,
  onClip,
  onSave
}: {
  title: string;
  action?: string;
  items: VideoOpportunity[];
  viewMode: ViewMode;
  onAction?: () => void;
  onAnalyze: (item: VideoOpportunity) => void;
  onClip: (item: VideoOpportunity) => void;
  onSave: (item: VideoOpportunity) => void | Promise<void>;
}) {
  return (
    <section className="section-card">
      <SectionTitle title={title} action={action ?? (viewMode === "grid" ? "Grid View" : "List View")} onAction={onAction} />
      {items.length === 0 ? (
        <EmptyState title="Tidak ada data yang cocok dengan filter saat ini." description="Adjust filters or reset the database query." />
      ) : viewMode === "grid" ? (
        <div className="opportunity-grid">
          {items.map((item) => (
            <VideoOpportunityCard item={item} onClip={onClip} onSave={onSave} key={item.id} />
          ))}
        </div>
      ) : (
        <VideoOpportunityTable items={items} onAnalyze={onAnalyze} onClip={onClip} onSave={onSave} />
      )}
    </section>
  );
}

function NicheExplorerResults({ items }: { items: VideoOpportunity[] }) {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.niche] = (acc[item.niche] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="section-grid two">
      <section className="section-card">
        <SectionTitle title="Niche Explorer" />
        <div className="tag-cloud">
          {Object.entries(counts).map(([niche, count]) => (
            <StatusBadge label={`${niche}: ${count}`} tone="blue" key={niche} />
          ))}
        </div>
      </section>
      <section className="section-card">
        <SectionTitle title="Highest Opportunity By Niche" />
        <div className="top-clip-list">
          {items.slice(0, 8).map((item, index) => (
            <TopClipRow item={item} index={index + 1} onClip={() => undefined} key={item.id} />
          ))}
        </div>
      </section>
    </div>
  );
}

function CompetitorResults({ items }: { items: ApiCompetitor[] }) {
  return (
    <div className="section-grid three">
      {items.map((item) => (
        <section className="section-card" key={item.id}>
          <SectionTitle title={item.name} />
          <div className="tag-cloud">
            <StatusBadge label={item.sourceType} tone={item.sourceType === "DEMO" ? "blue" : "slate"} />
            <StatusBadge label={formatEnumLabel(item.platform)} tone="cyan" />
            <StatusBadge label={item.niche} tone="slate" />
          </div>
          <p className="muted">{item.handle ?? item.profileUrl ?? "No handle provided"}</p>
          <div className="compact-grid" style={{ marginTop: 12 }}>
            <article className="mini-stat">
              <span>Followers</span>
              <strong>{formatNumber(item.followers)}</strong>
            </article>
            <article className="mini-stat">
              <span>Avg Views</span>
              <strong>{formatNumber(item.avgViews)}</strong>
            </article>
            <article className="mini-stat">
              <span>Engagement</span>
              <strong>{item.avgEngagement ?? 0}%</strong>
            </article>
          </div>
        </section>
      ))}
    </div>
  );
}

function DemoFilterPanel({
  campaignOptions,
  categoryOptions,
  filters,
  showDemoFilters,
  viewMode,
  onReset,
  onToggle,
  onUpdate,
  onViewModeChange
}: {
  campaignOptions: string[];
  categoryOptions: string[];
  filters: DemoFilterState;
  showDemoFilters: boolean;
  viewMode: ViewMode;
  onReset: () => void;
  onToggle: () => void;
  onUpdate: <K extends keyof DemoFilterState>(key: K, value: DemoFilterState[K]) => void;
  onViewModeChange: (mode: ViewMode) => void;
}) {
  return (
    <section className="section-card demo-filter-card">
      <div className="section-title">
        <h2>Demo filters</h2>
        <div className="row wrap">
          <button className="secondary-button compact" type="button" onClick={onToggle}>
            {showDemoFilters ? "Hide Demo Filters" : "Show Demo Filters"}
          </button>
          <button className="ghost-button compact" type="button" onClick={onReset}>Reset Filters</button>
        </div>
      </div>
      {showDemoFilters && (
        <div className="demo-filter-grid">
          <label>
            <span>Keyword</span>
            <input value={filters.keyword} onChange={(event) => onUpdate("keyword", event.target.value)} placeholder="Search title, keyword, campaign..." />
          </label>
          <label>
            <span>Category</span>
            <select value={filters.category} onChange={(event) => onUpdate("category", event.target.value)}>
              {["Demo Data", ...categoryOptions.filter((item) => item !== "Demo Data")].map((item) => (
                <option value={item} key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Platform</span>
            <select value={filters.platform} onChange={(event) => onUpdate("platform", event.target.value as PlatformFilter)}>
              {(["All", "YouTube", "TikTok", "Instagram", "Facebook"] as const).map((item) => (
                <option value={item} key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Status</span>
            <select value={filters.status} onChange={(event) => onUpdate("status", event.target.value as StatusFilter)}>
              {(["All", "Draft", "Ready", "Scheduled", "Published", "Failed"] as const).map((item) => (
                <option value={item} key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Date</span>
            <input type="date" value={filters.date} onChange={(event) => onUpdate("date", event.target.value)} />
          </label>
          <label>
            <span>Performance</span>
            <select value={filters.performance} onChange={(event) => onUpdate("performance", event.target.value as PerformanceFilter)}>
              {(["All", "High", "Medium", "Low"] as const).map((item) => (
                <option value={item} key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Campaign</span>
            <select value={filters.campaign} onChange={(event) => onUpdate("campaign", event.target.value)}>
              {campaignOptions.map((item) => (
                <option value={item} key={item}>{item}</option>
              ))}
            </select>
          </label>
          <div className="view-toggle" aria-label="Grid/List view mode">
            <span>Grid/List</span>
            <button className={viewMode === "grid" ? "active" : ""} type="button" onClick={() => onViewModeChange("grid")}>Grid</button>
            <button className={viewMode === "list" ? "active" : ""} type="button" onClick={() => onViewModeChange("list")}>List</button>
          </div>
        </div>
      )}
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
        <section className="section-card">
          <SectionTitle title="Subtitle Controls" action="Generate Subtitle" />
          <div className="tag-cloud">
            {["Style selector", "Language selector", "Emoji subtitle", "Karaoke subtitle", "Multi language"].map((item) => <StatusBadge label={item} tone="cyan" key={item} />)}
          </div>
          <div className="row wrap" style={{ marginTop: 14 }}>
            <button className="secondary-button" type="button">Generate Subtitle</button>
            <button className="secondary-button" type="button">Translate</button>
            <button className="ghost-button" type="button">Apply Style</button>
          </div>
        </section>
      </div>
    );
  }

  if (activeSub.key === "caption-generator") {
    return (
      <div className="section-grid three">
        <InfoPanel title="Generated Caption" items={["Stop wasting time editing manually. Let AI find the strongest hook and turn it into short-form clips."]} />
        <InfoPanel title="Hashtags" items={["#aitools", "#shorts", "#creatorworkflow", "#businessgrowth"]} />
        <section className="section-card">
          <SectionTitle title="CTA" action="Generate Caption" />
          <div className="tag-cloud">
            {["Save this workflow", "Try this today", "Follow for more AI systems"].map((item) => <StatusBadge label={item} tone="blue" key={item} />)}
          </div>
          <div className="row wrap" style={{ marginTop: 14 }}>
            <button className="primary-button" type="button">Generate Caption</button>
            <button className="secondary-button" type="button">Copy</button>
          </div>
        </section>
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

function ContentLibraryContent({
  activeSub,
  categories,
  contentItems,
  onArchiveContent,
  onScheduleContent,
  viewMode
}: {
  activeSub: SubNavItem;
  categories: ApiCategory[];
  contentItems: ContentItem[];
  onArchiveContent: (item: ContentItem) => void;
  onScheduleContent: (item: ContentItem) => void;
  viewMode: ViewMode;
}) {
  const visibleItems = activeSub.key === "archive" ? contentItems.filter((item) => item.status === "Archived") : contentItems;

  if (activeSub.key === "categories") {
    return (
      <section className="section-card">
        <SectionTitle title="Categories" action="Dropdown Active" />
        <div className="category-dropdown-row">
          <label>
            <span>Category</span>
            <select defaultValue="Demo Data">
              {categories.map((item) => (
                <option value={item.slug} key={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <StatusBadge label="Demo Data" tone="blue" />
        </div>
        <p className="muted">Use the filter panel above to apply the category dropdown to the content results.</p>
      </section>
    );
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
      <SectionTitle title={activeSub.key === "archive" ? "Archive" : "All Content"} action={viewMode === "grid" ? "Grid View" : "List View"} />
      {visibleItems.length === 0 ? (
        <EmptyState title="Tidak ada data yang cocok dengan filter saat ini." description="Reset filters or adjust the demo filter values." />
      ) : (
        <div className={viewMode === "grid" ? "content-grid" : "content-list"}>
          {visibleItems.map((item) => (
          <ContentCard item={item} onArchive={onArchiveContent} onSchedule={onScheduleContent} key={`${item.id}-${item.title}`} />
          ))}
        </div>
      )}
    </section>
  );
}

function SchedulerContent({
  activeSub,
  accounts,
  approvalStatus,
  schedules,
  onOpenAddAccount,
  onRefreshAccount,
  onToggleAccount,
  onUpdateApproval
}: {
  activeSub: SubNavItem;
  accounts: Account[];
  approvalStatus: "Pending" | "Approved" | "Rejected";
  schedules: ScheduleItem[];
  onOpenAddAccount: () => void;
  onRefreshAccount: (account: Account) => void;
  onToggleAccount: (account: Account) => void;
  onUpdateApproval: (status: "Pending" | "Approved" | "Rejected") => void;
}) {
  if (activeSub.key === "connected-accounts") {
    return (
      <section className="section-card">
        <SectionTitle title="Connected Accounts" action="Add Account" onAction={onOpenAddAccount} />
        <div className="account-grid">
          {accounts.map((account) => (
            <AccountCard account={account} onRefresh={onRefreshAccount} onToggle={onToggleAccount} key={account.name} />
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

function AnalysisModal({ item, onClose }: { item: VideoOpportunity; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <SectionTitle title="AI Analysis" action="Close" onAction={onClose} />
        <StatusBadge label="Demo Data" tone="blue" />
        <h3>{item.title}</h3>
        <p>{item.analysis}</p>
        <div className="tag-cloud">
          <StatusBadge label={`Viral ${item.viralScore}`} tone="green" />
          <StatusBadge label={`Clipping ${item.clippingScore}`} tone="blue" />
          <StatusBadge label={item.niche} tone="cyan" />
          <StatusBadge label={item.platform} tone="slate" />
        </div>
        <button className="primary-button" type="button" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

function AddAccountModal({
  accountHandle,
  accountName,
  connectionMode,
  platform,
  onCancel,
  onConnect,
  onHandleChange,
  onModeChange,
  onNameChange,
  onPlatformChange
}: {
  accountHandle: string;
  accountName: string;
  connectionMode: "Demo Connect" | "OAuth Placeholder";
  platform: string;
  onCancel: () => void;
  onConnect: () => void;
  onHandleChange: (value: string) => void;
  onModeChange: (value: "Demo Connect" | "OAuth Placeholder") => void;
  onNameChange: (value: string) => void;
  onPlatformChange: (value: string) => void;
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <SectionTitle title="Add Account" action="Cancel" onAction={onCancel} />
        <div className="modal-form">
          <label>
            <span>Platform</span>
            <select value={platform} onChange={(event) => onPlatformChange(event.target.value)}>
              {["YouTube", "TikTok", "Instagram", "Facebook", "X", "LinkedIn"].map((item) => (
                <option value={item} key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Account name</span>
            <input value={accountName} onChange={(event) => onNameChange(event.target.value)} placeholder="Example: TikTok C" />
          </label>
          <label>
            <span>Username / handle</span>
            <input value={accountHandle} onChange={(event) => onHandleChange(event.target.value)} placeholder="@fvnclipper" />
          </label>
          <label>
            <span>Connection mode</span>
            <select value={connectionMode} onChange={(event) => onModeChange(event.target.value as "Demo Connect" | "OAuth Placeholder")}>
              <option value="Demo Connect">Demo Connect</option>
              <option value="OAuth Placeholder">OAuth Placeholder</option>
            </select>
          </label>
        </div>
        <div className="row wrap">
          <button className="primary-button" type="button" onClick={onConnect}>Connect Account</button>
          <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
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

function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {action && <button className="ghost-button" type="button" onClick={onAction}>{action}</button>}
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

function getContentPerformance(item: ContentItem): "High" | "Medium" | "Low" {
  if (item.performance) {
    return item.performance;
  }

  if (item.status === "Published" || item.metric.toLowerCase().includes("views")) {
    return "High";
  }

  if (item.status === "Ready" || item.status === "Scheduled") {
    return "Medium";
  }

  return "Low";
}

function useApiResource<T>(url: string, enabled: boolean): ApiResourceState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchApiData<T>(url, { signal: controller.signal })
      .then((value) => {
        setData(value);
      })
      .catch((caught) => {
        if (controller.signal.aborted) {
          return;
        }
        setData(null);
        setError(caught instanceof Error ? caught.message : "Failed to load API data");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [enabled, reloadKey, url]);

  return {
    data,
    error,
    loading,
    reload: () => setReloadKey((value) => value + 1)
  };
}

function formatNumber(value?: number | null) {
  if (value === undefined || value === null) {
    return "0";
  }

  return Intl.NumberFormat("en", { notation: "compact" }).format(value);
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

