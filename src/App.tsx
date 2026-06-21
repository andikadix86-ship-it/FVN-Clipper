import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Edit3, Film, Link2, Loader2, Save, Sparkles, Star } from "lucide-react";
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
  VideoOpportunityCard,
  VideoOpportunityTable
} from "./components";
import {
  navItems,
  niches,
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
  type ApiAiGenerateResult,
  toApiPerformance,
  toApiPlatform,
  toApiStatus,
  type ApiAiProviderStatus,
  type ApiCampaign,
  type ApiCategory,
  type ApiConnectionCheck,
  type ApiConnectionStatus,
  type ApiCompetitor,
  type ApiOpportunity,
  type ApiPublishingSchedule,
  type ApiRecommendation,
  type DashboardOverviewData,
  type OpportunityQuery
} from "./api";
import {
  DEFAULT_CLIP_COUNT,
  DEFAULT_SOURCE_DURATION_MINUTES,
  DEFAULT_VIDEO_QUALITY,
  MAX_CLIP_COUNT,
  MAX_SOURCE_DURATION_MINUTES,
  clipStudioQualityOptions,
  clipStudioTargetPlatforms,
  detectSourcePlatform,
  resolveClipStudioMetadata,
  validateSourceVideoUrl,
  type ClipStudioClipResult,
  type ClipStudioVideoMetadata,
  type ClipStudioTargetPlatform,
  type ClipStudioVideoQuality
} from "./clip-studio-service";

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

interface DataFilterState {
  keyword: string;
  category: string;
  platform: PlatformFilter;
  status: StatusFilter;
  date: string;
  performance: PerformanceFilter;
  campaign: string;
}

const defaultDataFilters: DataFilterState = {
  keyword: "",
  category: "All",
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
  const [contentLibrary, setContentLibrary] = usePersistentState<ContentItem[]>(CONTENT_ITEMS_KEY, []);
  const [campaignList, setCampaignList] = usePersistentState<Campaign[]>(CAMPAIGNS_KEY, []);
  const [scheduleList, setScheduleList] = usePersistentState<ScheduleItem[]>(SCHEDULES_KEY, []);
  const [accountList, setAccountList] = usePersistentState<Account[]>(ACCOUNTS_KEY, []);
  const [approvalStatus, setApprovalStatus] = usePersistentState<"Pending" | "Approved" | "Rejected">(APPROVAL_STATUS_KEY, "Pending");
  const [opportunityList, setOpportunityList] = useState<VideoOpportunity[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState("Not scanned yet");
  const [scanSummary, setScanSummary] = useState<string[]>(["New opportunities found: 0", "Best niche: NOT_CONNECTED", "Best platform: NOT_CONNECTED", "Average clipping score: 0"]);
  const [analysisTarget, setAnalysisTarget] = useState<VideoOpportunity | null>(null);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [accountPlatform, setAccountPlatform] = useState("YouTube");
  const [accountName, setAccountName] = useState("");
  const [accountHandle, setAccountHandle] = useState("");
  const [connectionMode, setConnectionMode] = useState<"OAuth Placeholder">("OAuth Placeholder");
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
    console.log(`[FVN action] ${message}`);
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

  const runAIScan = async () => {
    setIsScanning(true);
    try {
      const result = await fetchApiData<{
        received: number;
        saved: number;
        opportunities: ApiOpportunity[];
      }>("/api/ai-clip-intelligence/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({})
      });

      const average = result.opportunities.length
        ? Math.round(result.opportunities.reduce((total, item) => total + item.opportunityScore, 0) / result.opportunities.length)
        : 0;

      setLastScanned(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setScanSummary([
        `New opportunities found: ${result.saved}`,
        `Best niche: ${result.opportunities[0]?.niche ?? "NOT_CONNECTED"}`,
        `Best platform: ${result.opportunities[0]?.platform ?? "NOT_CONNECTED"}`,
        `Average clipping score: ${average}`
      ]);

      showToast(`AI scan completed: ${result.saved} new opportunities saved.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to run AI scan";
      showToast(`Scan Error: ${msg}`);
      throw error;
    } finally {
      setIsScanning(false);
    }
  };

  const generateRealClips = () => {
    navigate("/clip-studio/source-video");
    showToast("Use Source Video to generate clips through the configured AI provider.");
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
          campaign: selectedSource?.campaignSlug ?? "Unassigned",
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
      if (current.some((campaign) => campaign.name === "Clip Draft Campaign")) {
        return current;
      }
      return [
        {
          name: "Clip Draft Campaign",
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
    const draftName = `Manual Campaign Draft ${campaignList.length + 1}`;
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
              health: item.status === "Connected" ? "Manually disconnected" : "OAuth flow required before reconnect.",
              lastSync: "Never"
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
    const name = accountName.trim() || `${accountPlatform} Account`;
    setAccountList((current) => [
      {
        name,
        platform: accountPlatform,
        status: "Not Connected",
        health: accountHandle ? `OAuth required for ${accountHandle}` : "OAuth access token not connected.",
        lastSync: "Never"
      },
      ...current
    ]);
    setAddAccountOpen(false);
    setAccountName("");
    setAccountHandle("");
    showToast("OAuth is not configured yet");
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
        <main className={`content-layout ${activePage === "dashboard" ? "dashboard-layout" : ""} ${shouldShowConnectedAccountsPanel(activePage, activeSub.key) ? "has-right-panel" : "no-right-panel"}`}>
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
              onGenerateClips={generateRealClips}
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
          {shouldShowConnectedAccountsPanel(activePage, activeSub.key) && <RightPanel accounts={accountList} />}
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
  const connectionState = useApiResource<ApiConnectionStatus>("/api/connections/status", activeSub.key === "overview");

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
    <ApiStateViewObject state={overview} emptyTitle="No dashboard overview data" emptyDescription="Database returned no overview metrics.">
      {(data) => (
        <DashboardOverviewLayout
          calendarState={calendarState}
          campaignState={campaignState}
          connectionState={connectionState}
          data={data}
          onNavigate={onNavigate}
          recommendationState={recommendationState}
          topOpportunityState={topOpportunityState}
        />
      )}
    </ApiStateViewObject>
  );
}

function DashboardHero() {
  return (
    <section className="dashboard-hero">
      <div>
        <div className="dashboard-title-row">
          <h1>Dashboard Overview</h1>
          <StatusBadge label="REAL DATA MODE" tone="green" />
        </div>
        <p>Connection failures are shown directly. No fallback records are used in real mode.</p>
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
          {schedule.sourceType && <StatusBadge label={schedule.sourceType} tone={sourceTypeTone(schedule.sourceType)} />}
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
      {item.sourceType && <StatusBadge label={item.sourceType} tone={sourceTypeTone(item.sourceType)} />}
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
  const [showDataFilters, setShowDataFilters] = useState(true);
  const [filters, setFilters] = useState<DataFilterState>(defaultDataFilters);
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

  const updateFilter = <K extends keyof DataFilterState>(key: K, value: DataFilterState[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultDataFilters);
    setViewMode("grid");
  };

  const saveFromApi = async (item: VideoOpportunity) => {
    await onSave(item);
    opportunityState.reload();
  };

  const handleRunAIScan = async () => {
    try {
      await onRunAIScan();
      opportunityState.reload();
    } catch (error) {
      // Error handled by onRunAIScan toast
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="AI Clip Intelligence"
        title={activeSub.label}
        description="The intelligence hub for trends, niches, competitors, advisor insights, and short-form video opportunity scoring."
        actions={<button className="primary-button" type="button" onClick={handleRunAIScan} disabled={isScanning}>{isScanning ? "Scanning..." : "AI Scan"}</button>}
      />
      {activeSub.key !== "competitor-intelligence" && activeSub.key !== "ai-advisor" && (
        <OpportunityFilterPanel
          campaignOptions={campaignState.data ?? []}
          categoryOptions={categoryState.data ?? []}
          filters={filters}
          showDataFilters={showDataFilters}
          viewMode={viewMode}
          onReset={resetFilters}
          onToggle={() => setShowDataFilters((value) => !value)}
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
        description="Generate banyak clip dari satu video panjang dengan kontrol durasi, kualitas, dan output siap publish."
        actions={<span className="clip-studio-new-badge">Fitur Baru</span>}
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
          {selectedSource.sourceType && <StatusBadge label={selectedSource.sourceType} tone={selectedSource.sourceType === "REAL_API" ? "green" : "slate"} />}
          <h3>{selectedSource.title}</h3>
          <p>{selectedSource.channel} - {selectedSource.platform} - {selectedSource.views} views</p>
        </section>
      )}
      <ClipStudioContent
        activeSub={activeSub}
        generatedClips={generatedClips}
        selectedSource={selectedSource}
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
  const [showDataFilters, setShowDataFilters] = useState(true);
  const [filters, setFilters] = useState<DataFilterState>(defaultDataFilters);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const categoryState = useApiResource<ApiCategory[]>("/api/ai-clip-intelligence/categories", true);
  const campaignOptions = useMemo(() => ["All", ...Array.from(new Set(contentItems.map((item) => item.campaign)))], [contentItems]);
  const filteredItems = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();

    return contentItems.filter((item) => {
      const itemPerformance = getContentPerformance(item);
      const searchable = [item.title, item.category, item.platform, item.status, item.campaign, item.metric].join(" ").toLowerCase();
      const matchesKeyword = !keyword || searchable.includes(keyword);
      const matchesCategory = filters.category === "All" || item.category === filters.category;
      const matchesPlatform = filters.platform === "All" || item.platform === filters.platform;
      const matchesStatus = filters.status === "All" || item.status === filters.status;
      const matchesDate = !filters.date || item.date === filters.date;
      const matchesPerformance = filters.performance === "All" || itemPerformance === filters.performance;
      const matchesCampaign = filters.campaign === "All" || item.campaign === filters.campaign;

      return matchesKeyword && matchesCategory && matchesPlatform && matchesStatus && matchesDate && matchesPerformance && matchesCampaign;
    });
  }, [contentItems, filters]);

  const updateFilter = <K extends keyof DataFilterState>(key: K, value: DataFilterState[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultDataFilters);
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
        showDataFilters={showDataFilters}
        viewMode={viewMode}
        onReset={resetFilters}
        onToggle={() => setShowDataFilters((value) => !value)}
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
    { label: "Total Projects", value: String(data.totals.campaigns + data.totals.opportunities), delta: "REAL_API records", tone: "blue" as const },
    { label: "AI Recommendations Today", value: String(recommendationCount ?? data.latestRecommendations.length), delta: "Latest real advice", tone: "cyan" as const },
    { label: "Active Campaigns", value: String(data.totals.campaigns), delta: "Campaign records", tone: "slate" as const },
    { label: "Scheduled Posts", value: String(data.totals.scheduledPosts), delta: "Publishing records", tone: "amber" as const },
    { label: "Saved Opportunities", value: String(data.totals.savedOpportunities), delta: "Saved real opportunities", tone: "green" as const }
  ];

  return (
    <section className="stats-grid dashboard-kpis">
      {dashboardStats.map((stat) => (
        <StatCard stat={stat} key={stat.label} />
      ))}
    </section>
  );
}

function ConnectionStatusPanel({ state }: { state: ApiResourceState<ApiConnectionStatus> }) {
  if (state.loading) {
    return <EmptyState title="Checking real connections..." description="Testing database, AI provider, video source, social, and marketplace integrations." />;
  }

  if (state.error) {
    return <EmptyState title="Unable to validate real connections" description={state.error} />;
  }

  const checks = state.data?.checks ?? [];

  return (
    <section className="section-card" data-testid="connection-status-panel">
      <SectionTitle title="Real Source Connections" action="Refresh" onAction={state.reload} />
      <p className="muted env-description">Live connection checks use project `.env` values. Secrets are masked before reaching the UI.</p>
      {checks.length === 0 ? (
        <EmptyState title="No connection checks available" description="Connection status endpoint returned no provider checks." />
      ) : (
        <div className="env-status-grid">
          {checks.map((check) => (
            <ConnectionStatusCard check={check} key={check.id} />
          ))}
        </div>
      )}
    </section>
  );
}

function ConnectionStatusCard({ check }: { check: ApiConnectionCheck }) {
  return (
    <article className="env-status-card">
      <div className="row between gap">
        <strong>{check.label}</strong>
        <StatusBadge label={check.status} tone={connectionStatusTone(check.status)} />
      </div>
      <p>{check.technicalReason}</p>
      <div className="tag-cloud">
        <StatusBadge label={check.sourceType} tone="green" />
        <StatusBadge label={check.provider} tone="slate" />
        <StatusBadge label={check.kind} tone="cyan" />
        {typeof check.latencyMs === "number" && <StatusBadge label={`${check.latencyMs}ms`} tone="slate" />}
      </div>
    </article>
  );
}

function connectionStatusTone(status: ApiConnectionCheck["status"]) {
  if (status === "CONNECTED") return "green";
  if (status === "NOT_CONNECTED") return "amber";
  if (status === "UNSUPPORTED") return "slate";
  return "red";
}

function sourceTypeTone(sourceType: string) {
  return sourceType === "REAL_API" ? "green" : sourceType === "CSV_IMPORT" || sourceType === "MANUAL" ? "cyan" : "slate";
}

function DashboardOverviewLayout({
  calendarState,
  campaignState,
  connectionState,
  data,
  onNavigate,
  recommendationState,
  topOpportunityState
}: {
  calendarState: ApiResourceState<ApiPublishingSchedule[]>;
  campaignState: ApiResourceState<ApiCampaign[]>;
  connectionState: ApiResourceState<ApiConnectionStatus>;
  data: DashboardOverviewData;
  onNavigate: (path: string) => void;
  recommendationState: ApiResourceState<ApiRecommendation[]>;
  topOpportunityState: ApiResourceState<ApiOpportunity[]>;
}) {
  const topOpportunities = (topOpportunityState.data ?? []).map(mapOpportunity).slice(0, 5);

  return (
    <div className="dashboard-page">
      <section className="dashboard-top-section">
        <DashboardHero />
        <DashboardMetricGrid data={data} recommendationCount={recommendationState.data?.length} />
      </section>

      <ConnectionStatusPanel state={connectionState} />

      <section className="dashboard-middle-grid">
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
      </section>

      <section className="dashboard-bottom-grid">
        <DashboardPanel className="dashboard-panel-top" title="Top Opportunities" action="View Full Opportunities" onAction={() => onNavigate("/ai-clip-intelligence/top-20-opportunities")}>
          <PanelApiState state={topOpportunityState} emptyTitle="Tidak ada data yang cocok.">
            {() => <TopOpportunityRanking items={topOpportunities} />}
          </PanelApiState>
        </DashboardPanel>
        <DashboardPanel title="Insights at a Glance">
          <InsightsAtGlance data={data} opportunities={topOpportunities} />
        </DashboardPanel>
      </section>
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
          {schedule.sourceType && <StatusBadge label={schedule.sourceType} tone={sourceTypeTone(schedule.sourceType)} />}
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
          {item.sourceType && <StatusBadge label={item.sourceType} tone={sourceTypeTone(item.sourceType)} />}
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
          <StatusBadge label={item.sourceType} tone={sourceTypeTone(item.sourceType)} />
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
  showDataFilters,
  viewMode,
  onReset,
  onToggle,
  onUpdate,
  onViewModeChange
}: {
  campaignOptions: ApiCampaign[];
  categoryOptions: ApiCategory[];
  filters: DataFilterState;
  showDataFilters: boolean;
  viewMode: ViewMode;
  onReset: () => void;
  onToggle: () => void;
  onUpdate: <K extends keyof DataFilterState>(key: K, value: DataFilterState[K]) => void;
  onViewModeChange: (mode: ViewMode) => void;
}) {
  return (
    <section className="section-card demo-filter-card">
      <div className="section-title">
        <h2>Real data filters</h2>
        <div className="row wrap">
          <button className="secondary-button compact" type="button" onClick={onToggle}>{showDataFilters ? "Hide Filters" : "Show Filters"}</button>
          <button className="ghost-button compact" type="button" onClick={onReset}>Reset Filters</button>
        </div>
      </div>
      {showDataFilters && (
        <div className="demo-filter-grid">
          <label>
            <span>Keyword</span>
            <input value={filters.keyword} onChange={(event) => onUpdate("keyword", event.target.value)} placeholder="Search title, keyword, niche..." />
          </label>
          <label>
            <span>Category</span>
            <select value={filters.category} onChange={(event) => onUpdate("category", event.target.value)}>
              <option value="All">All</option>
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
    <div className="niche-explorer-layout">
      <section className="section-card niche-list-panel">
        <SectionTitle title="Niche Explorer" />
        <div className="tag-cloud">
          {Object.entries(counts).map(([niche, count]) => (
            <StatusBadge label={`${niche}: ${count}`} tone="blue" key={niche} />
          ))}
        </div>
      </section>
      <section className="section-card niche-opportunity-panel">
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
            <StatusBadge label={item.sourceType} tone={sourceTypeTone(item.sourceType)} />
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
  showDataFilters,
  viewMode,
  onReset,
  onToggle,
  onUpdate,
  onViewModeChange
}: {
  campaignOptions: string[];
  categoryOptions: string[];
  filters: DataFilterState;
  showDataFilters: boolean;
  viewMode: ViewMode;
  onReset: () => void;
  onToggle: () => void;
  onUpdate: <K extends keyof DataFilterState>(key: K, value: DataFilterState[K]) => void;
  onViewModeChange: (mode: ViewMode) => void;
}) {
  return (
    <section className="section-card demo-filter-card">
      <div className="section-title">
        <h2>Real data filters</h2>
        <div className="row wrap">
          <button className="secondary-button compact" type="button" onClick={onToggle}>
            {showDataFilters ? "Hide Filters" : "Show Filters"}
          </button>
          <button className="ghost-button compact" type="button" onClick={onReset}>Reset Filters</button>
        </div>
      </div>
      {showDataFilters && (
        <div className="demo-filter-grid">
          <label>
            <span>Keyword</span>
            <input value={filters.keyword} onChange={(event) => onUpdate("keyword", event.target.value)} placeholder="Search title, keyword, campaign..." />
          </label>
          <label>
            <span>Category</span>
            <select value={filters.category} onChange={(event) => onUpdate("category", event.target.value)}>
              {["All", ...categoryOptions.filter((item) => item !== "All")].map((item) => (
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
  selectedSource,
  onGenerateClips,
  onSaveClipToCampaign,
  onSaveClipToLibrary
}: {
  activeSub: SubNavItem;
  generatedClips: GeneratedClip[];
  selectedSource: VideoOpportunity | null;
  onGenerateClips: () => void;
  onSaveClipToCampaign: (clip: GeneratedClip) => void;
  onSaveClipToLibrary: (clip: GeneratedClip) => void;
}) {
  if (activeSub.key === "source-video") {
    return <ClipStudioSourceVideoPanel selectedSource={selectedSource} onSaveClipToLibrary={onSaveClipToLibrary} />;
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
            <StatusBadge label="REAL_API" tone="green" />
            <span>{item}</span>
            <button className="primary-button compact" type="button">Export</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ClipStudioSourceVideoPanel({
  selectedSource,
  onSaveClipToLibrary
}: {
  selectedSource: VideoOpportunity | null;
  onSaveClipToLibrary: (clip: GeneratedClip) => void;
}) {
  const selectedSourceUrl = useMemo(() => {
    if (!selectedSource) return "";
    return `https://www.youtube.com/watch?v=${encodeURIComponent(selectedSource.slug ?? selectedSource.id)}`;
  }, [selectedSource]);
  const [sourceVideoUrl, setSourceVideoUrl] = useState(selectedSourceUrl);
  const [sourceDurationMinutes, setSourceDurationMinutes] = useState(DEFAULT_SOURCE_DURATION_MINUTES);
  const [clipCount, setClipCount] = useState(DEFAULT_CLIP_COUNT);
  const [videoQuality, setVideoQuality] = useState<ClipStudioVideoQuality>(DEFAULT_VIDEO_QUALITY);
  const [targetPlatform, setTargetPlatform] = useState<ClipStudioTargetPlatform>("YouTube");
  const [clips, setClips] = useState<ClipStudioClipResult[]>([]);
  const [metadata, setMetadata] = useState<ClipStudioVideoMetadata | null>(null);
  const [notice, setNotice] = useState("Masukkan link YouTube, TikTok, Instagram/Reels, atau video publik lain untuk dianalisis.");
  const [workflowStatus, setWorkflowStatus] = useState<"empty" | "analyzing" | "analyzed" | "generating" | "success" | "error">("empty");
  const [uploadName, setUploadName] = useState("");

  useEffect(() => {
    setSourceVideoUrl(selectedSourceUrl);
    setMetadata(null);
    setClips([]);
    setWorkflowStatus("empty");
  }, [selectedSourceUrl]);

  const sourcePlatform = useMemo(() => detectSourcePlatform(sourceVideoUrl), [sourceVideoUrl]);
  const sourceUrlError = useMemo(() => {
    try {
      validateSourceVideoUrl(sourceVideoUrl);
      return "";
    } catch (error) {
      return error instanceof Error ? error.message : "Masukkan URL video yang valid.";
    }
  }, [sourceVideoUrl]);
  const durationError = sourceDurationMinutes > MAX_SOURCE_DURATION_MINUTES ? "Durasi video maksimal 3 jam." : sourceDurationMinutes <= 0 ? "Durasi video tidak valid." : "";
  const countError = clipCount < 1 || clipCount > MAX_CLIP_COUNT ? "Jumlah video harus 1 sampai 15 clip." : "";
  const isBusy = workflowStatus === "analyzing" || workflowStatus === "generating";
  const canAnalyze = !sourceUrlError && !durationError && !isBusy;
  const canGenerate = !sourceUrlError && !durationError && !countError && Boolean(metadata) && !isBusy;
  const durationStatus = durationError || sourceUrlError || "Mendukung durasi hingga 3 jam untuk link video publik";

  const updateClipStatus = (clipId: string, status: ClipStudioClipResult["status"]) => {
    setClips((current) => current.map((clip) => (clip.id === clipId ? { ...clip, status } : clip)));
  };

  const handleAnalyze = () => {
    if (!canAnalyze) {
      setWorkflowStatus("error");
      setNotice(sourceUrlError || durationError || "Lengkapi link source video terlebih dahulu.");
      return;
    }

    setWorkflowStatus("analyzing");
    setNotice("Analyzing source video...");
    window.setTimeout(() => {
      try {
        const nextMetadata = resolveClipStudioMetadata(sourceVideoUrl, sourceDurationMinutes);
        setMetadata(nextMetadata);
        setWorkflowStatus("analyzed");
        setNotice(`${nextMetadata.sourcePlatform} source metadata siap. Generate memakai AI provider yang dikonfigurasi di backend.`);
      } catch (error) {
        setMetadata(null);
        setWorkflowStatus("error");
        setNotice(error instanceof Error ? error.message : "Analyze source gagal.");
      }
    }, 220);
  };

  const handleGenerate = async () => {
    if (!canGenerate) {
      setWorkflowStatus("error");
      setNotice(sourceUrlError || durationError || countError || "Klik Analyze Source sebelum Generate Viral Clips.");
      return;
    }

    setWorkflowStatus("generating");
    setNotice("Generating viral clip recommendations...");
    try {
      const currentMetadata = metadata ?? resolveClipStudioMetadata(sourceVideoUrl, sourceDurationMinutes);
      const payload = {
        sourceVideoUrl,
        sourceDurationMinutes,
        clipCount,
        videoQuality,
        targetPlatform,
        promptMode: "clip_studio_structured_json",
        contentGoal: "Generate clip viral lengkap dengan timing, caption, hashtag, CTA, dan action target.",
        language: "id" as const
      };
      const result = await fetchApiData<ApiAiGenerateResult>("/api/ai/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          feature: "clip-studio",
          clipStudio: {
            payload,
            metadata: currentMetadata
          }
        })
      });
      const aiClips = parseClipStudioAiClips(result.output, payload, currentMetadata);
      setMetadata(currentMetadata);
      setClips(aiClips);
      setWorkflowStatus("success");
      setNotice(`${aiClips.length} rekomendasi clip viral dibuat oleh ${result.provider}/${result.model}.`);
    } catch (error) {
      setWorkflowStatus("error");
      setNotice(error instanceof Error ? error.message : "Generate viral clips gagal.");
    }
  };

  const handleEdit = (clip: ClipStudioClipResult) => {
    updateClipStatus(clip.id, "Ready for Editor");
    setNotice(`${clip.title} siap dikirim ke Clip Editor.`);
  };

  const handleSubtitle = (clip: ClipStudioClipResult) => {
    setNotice(`Subtitle siap dibuat untuk ${clip.title}. Buka Subtitle Studio untuk styling dan translate.`);
  };

  const handleSave = (clip: ClipStudioClipResult) => {
    updateClipStatus(clip.id, "Saved to Library");
    onSaveClipToLibrary(toGeneratedClip(clip, selectedSource?.title ?? "Clip Studio source"));
    setNotice(`${clip.title} disimpan ke Content Library.`);
  };

  const handleSchedule = (clip: ClipStudioClipResult) => {
    updateClipStatus(clip.id, "Ready for Schedule");
    setNotice(`${clip.title} siap dikirim ke Scheduler.`);
  };

  return (
    <section className={`clip-studio-new clip-studio-workflow status-${workflowStatus}`} data-testid="clip-studio-source-video-new">
      <div className="clip-studio-source-card">
        <div className="clip-studio-source-heading">
          <div className="clip-studio-icon"><Link2 size={22} /></div>
          <div>
            <h2>Source Video</h2>
            <span>Analyze one long source, then generate viral short clips.</span>
          </div>
          <StatusBadge label="REAL SOURCE" tone="green" />
        </div>

        <div className="clip-studio-source-types" aria-label="Supported source types">
          {[
            ["YouTube URL", "youtube.com / youtu.be"],
            ["TikTok URL", "tiktok.com"],
            ["Instagram/Reels URL", "instagram.com/reel"],
            ["Video Upload", uploadName || "available when upload API is enabled"]
          ].map(([label, detail]) => (
            <div className="clip-studio-source-type" key={label}>
              <strong>{label}</strong>
              <span>{detail}</span>
            </div>
          ))}
        </div>

        <label className="clip-studio-field clip-studio-url-field">
          <span>Video URL</span>
          <div className="clip-studio-url-input">
            <input value={sourceVideoUrl} onChange={(event) => { setSourceVideoUrl(event.target.value); setMetadata(null); setClips([]); setWorkflowStatus("empty"); }} placeholder="Paste YouTube, TikTok, Instagram/Reels, or video URL..." />
            <strong>{sourcePlatform}</strong>
          </div>
        </label>

        <label className="clip-studio-field">
          <span>Optional video upload</span>
          <input type="file" accept="video/*" onChange={(event) => setUploadName(event.target.files?.[0]?.name ?? "")} />
        </label>

        <label className="clip-studio-field">
          <span>Durasi metadata (menit)</span>
          <input
            data-testid="clip-studio-duration"
            type="number"
            min={1}
            max={180}
            value={sourceDurationMinutes}
            onChange={(event) => setSourceDurationMinutes(Number(event.target.value))}
          />
        </label>

        <div className={`clip-studio-duration-status ${durationError || sourceUrlError || workflowStatus === "error" ? "error" : ""}`}>
          {durationError || sourceUrlError || workflowStatus === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{durationStatus}</span>
        </div>

        {metadata && (
          <div className="clip-studio-analysis-summary" data-testid="clip-studio-analysis-summary">
            <div>
              <span>Detected platform</span>
              <strong>{metadata.sourcePlatform}</strong>
            </div>
            <div>
              <span>Source duration</span>
              <strong>{metadata.duration}</strong>
            </div>
            <div>
              <span>Analysis mode</span>
              <strong>AI provider required for transcript</strong>
            </div>
          </div>
        )}

        <div className="clip-studio-controls">
          <label className="clip-studio-control">
            <span><Film size={16} />Jumlah Clip</span>
            <select data-testid="clip-studio-count" value={clipCount} onChange={(event) => setClipCount(Number(event.target.value))}>
              {[1, 3, 5, 10].map((count) => (
                <option value={count} key={count}>{count} clip</option>
              ))}
            </select>
          </label>

          <div className="clip-studio-control quality">
            <span><Star size={16} />Kualitas Video</span>
            <div className="clip-studio-quality-options">
              {clipStudioQualityOptions.map((quality) => (
                <button
                  aria-pressed={videoQuality === quality.value}
                  className={videoQuality === quality.value ? "active" : ""}
                  data-testid={`clip-studio-quality-${quality.value}`}
                  key={quality.value}
                  type="button"
                  onClick={() => setVideoQuality(quality.value)}
                >
                  {quality.label}
                </button>
              ))}
            </div>
          </div>

          <label className="clip-studio-control">
            <span>Target Platform</span>
            <select data-testid="clip-studio-platform" value={targetPlatform} onChange={(event) => setTargetPlatform(event.target.value as ClipStudioTargetPlatform)}>
              {clipStudioTargetPlatforms.map((platform) => (
                <option value={platform} key={platform}>{platform}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="clip-studio-primary-actions">
          <button className="secondary-button clip-studio-analyze-button" data-testid="clip-studio-analyze" disabled={!canAnalyze} type="button" onClick={handleAnalyze}>
            {workflowStatus === "analyzing" ? <Loader2 size={18} /> : <CheckCircle2 size={18} />}
            Analyze Source
          </button>
          <button className={`clip-studio-generate-button ${workflowStatus === "generating" ? "generating" : ""}`} data-testid="clip-studio-generate" disabled={!canGenerate} type="button" onClick={handleGenerate}>
            {workflowStatus === "generating" ? <Loader2 size={18} /> : <Sparkles size={18} />}
            Generate Viral Clips
          </button>
        </div>
        <div className="clip-studio-notice" role="status">{notice}</div>
      </div>

      <section className="clip-studio-preview">
        <div className="clip-studio-preview-heading">
          <div>
            <h2>Viral Clip Recommendations</h2>
            <span>{clips.length ? `${clips.length} clip siap review` : "Analyze source, then generate 1, 3, 5, or 10 clips"}</span>
          </div>
          {clips.length > 0 && <StatusBadge label="AI results" tone="green" />}
        </div>
        {clips.length ? (
          <div className="clip-studio-preview-grid viral-results">
            {clips.map((clip, index) => (
              <article className="clip-studio-preview-card" data-testid="clip-studio-card" key={clip.id}>
                <div className="clip-studio-thumbnail">
                  <img src={clip.thumbnail} alt="" />
                  <span>Clip {String(index + 1).padStart(2, "0")}</span>
                  <strong>{clip.duration}</strong>
                </div>
                <div className="clip-studio-card-body">
                  <div className="row between gap">
                    <StatusBadge label={`Viral ${clip.viralScore}`} tone={clip.viralScore >= 90 ? "green" : "blue"} />
                    <StatusBadge label={clip.status} tone={clip.status === "Ready for Review" ? "amber" : "green"} />
                  </div>
                  <h3>{clip.title}</h3>
                  <dl className="clip-studio-result-meta">
                    <div><dt>Start</dt><dd>{clip.startTime}</dd></div>
                    <div><dt>End</dt><dd>{clip.endTime}</dd></div>
                    <div><dt>Duration</dt><dd>{clip.duration}</dd></div>
                    <div><dt>Niche</dt><dd>{clip.category}</dd></div>
                  </dl>
                  <p><strong>Hook:</strong> {clip.hook}</p>
                  <p><strong>Reason:</strong> {clip.reason}</p>
                  <p><strong>Caption:</strong> {clip.caption}</p>
                  <div className="tag-cloud compact-tags">
                    {clip.suggestedHashtags.map((hashtag) => <StatusBadge label={hashtag} tone="cyan" key={hashtag} />)}
                  </div>
                  <small><strong>CTA:</strong> {clip.cta}</small>
                  <div className="clip-studio-card-actions full-actions">
                    <button data-testid="clip-studio-action-edit" type="button" onClick={() => handleEdit(clip)}><Edit3 size={14} />Send to Clip Editor</button>
                    <button data-testid="clip-studio-action-subtitle" type="button" onClick={() => handleSubtitle(clip)}><Sparkles size={14} />Generate Subtitle</button>
                    <button data-testid="clip-studio-action-save" type="button" onClick={() => handleSave(clip)}><Save size={14} />Save to Content Library</button>
                    <button data-testid="clip-studio-action-schedule" type="button" onClick={() => handleSchedule(clip)}><CalendarClock size={14} />Schedule</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : workflowStatus === "error" ? (
          <div className="clip-studio-empty-preview error-state">Source belum bisa dianalisis. Periksa URL dan durasi, lalu coba Analyze Source lagi.</div>
        ) : metadata ? (
          <div className="clip-studio-empty-preview success-state">Source sudah dianalisis. Pilih jumlah clip lalu klik Generate Viral Clips.</div>
        ) : (
          <div className="clip-studio-empty-preview">Belum ada hasil. Masukkan URL video publik, klik Analyze Source, lalu generate rekomendasi clip viral.</div>
        )}
      </section>

      <div className="clip-studio-benefits">
        <span>Menerima YouTube, TikTok, Instagram/Reels, dan link video publik</span>
        <span>Generate 1, 3, 5, atau 10 clip dari satu source</span>
        <span>Setiap clip punya timing, score, caption, hashtag, dan CTA</span>
        <span>Hasil siap ke Editor, Subtitle, Library, dan Scheduler</span>
      </div>
    </section>
  );
}

function toGeneratedClip(clip: ClipStudioClipResult, sourceTitle: string): GeneratedClip {
  return {
    id: clip.id,
    title: clip.title,
    duration: clip.duration,
    hookScore: Math.max(70, clip.viralScore - 3),
    viralScore: clip.viralScore,
    status: "Ready",
    sourceTitle
  };
}

function parseClipStudioAiClips(
  output: string,
  payload: {
    sourceVideoUrl: string;
    clipCount: number;
    videoQuality: ClipStudioVideoQuality;
    targetPlatform: ClipStudioTargetPlatform;
  },
  metadata: ClipStudioVideoMetadata
): ClipStudioClipResult[] {
  const parsed = parseJsonObject(output);
  const record = parsed as { clips?: unknown; recommendations?: unknown };
  const rawClips = Array.isArray(parsed) ? parsed : Array.isArray(record.clips) ? record.clips : Array.isArray(record.recommendations) ? record.recommendations : undefined;

  if (!rawClips?.length) {
    throw new Error("AI provider returned unsupported Clip Studio JSON format: missing clips array.");
  }

  return rawClips.slice(0, payload.clipCount).map((rawClip, index) => {
    const clip = rawClip as Record<string, unknown>;
    const title = stringField(clip, "title");
    const duration = stringField(clip, "duration");
    const startTime = stringField(clip, "startTime", "start_time");
    const endTime = stringField(clip, "endTime", "end_time");
    const hook = stringField(clip, "hook");
    const angle = stringField(clip, "angle");
    const category = stringField(clip, "category");
    const caption = stringField(clip, "caption");
    const cta = stringField(clip, "cta");
    const viralScore = numberField(clip, "viralScore", "viral_score", "score");
    const hashtags = arrayField(clip, "suggestedHashtags", "suggested_hashtags", "hashtags");

    return {
      id: optionalStringField(clip, "id", "clipId", "clip_id") || `ai-clip-${Date.now()}-${index + 1}`,
      title,
      thumbnail: typeof clip.thumbnail === "string" ? clip.thumbnail : "",
      duration,
      startTime,
      endTime,
      hook,
      angle,
      category,
      viralScore,
      quality: payload.videoQuality,
      platform: payload.targetPlatform,
      status: "Ready for Review",
      sourceVideoUrl: metadata.videoUrl || payload.sourceVideoUrl,
      caption,
      suggestedHashtags: hashtags,
      cta,
      reason: stringField(clip, "reason", "rationale")
    };
  });
}

function parseJsonObject(output: string) {
  const trimmed = output.trim();
  const withoutFence = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  try {
    return JSON.parse(withoutFence) as unknown;
  } catch {
    throw new Error("AI provider returned non-JSON Clip Studio output.");
  }
}

function stringField(record: Record<string, unknown>, ...names: string[]) {
  const value = optionalStringField(record, ...names);
  if (value) {
    return value;
  }

  throw new Error(`AI provider returned unsupported Clip Studio JSON format: missing ${names[0]}.`);
}

function optionalStringField(record: Record<string, unknown>, ...names: string[]) {
  for (const name of names) {
    const value = record[name];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function numberField(record: Record<string, unknown>, ...names: string[]) {
  for (const name of names) {
    const value = record[name];
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.max(0, Math.min(100, Math.round(value)));
    }
    if (typeof value === "string" && Number.isFinite(Number(value))) {
      return Math.max(0, Math.min(100, Math.round(Number(value))));
    }
  }

  throw new Error(`AI provider returned unsupported Clip Studio JSON format: missing ${names[0]}.`);
}

function arrayField(record: Record<string, unknown>, ...names: string[]) {
  for (const name of names) {
    const value = record[name];
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }
  }

  throw new Error(`AI provider returned unsupported Clip Studio JSON format: missing ${names[0]}.`);
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
          <InfoPanel title={title} items={["Rule enabled", "AI suggestion available", "Fix button ready"]} key={title} />
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
            <select defaultValue={categories[0]?.slug ?? "All"}>
              {categories.map((item) => (
                <option value={item.slug} key={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <StatusBadge label="REAL_API" tone="green" />
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
  const aiProviderState = useApiResource<ApiAiProviderStatus>("/api/ai/provider/status", activeSub.key === "ai-providers");

  if (activeSub.key === "ai-providers") {
    return <AiProviderSettingsPanel state={aiProviderState} fallbackItems={aiProviderEnvStatus} />;
  }

  if (activeSub.key === "social-integrations") {
    return <EnvStatusPanel title="Social Integrations" description="OAuth secrets are not exposed to the frontend. Demo mode and real API flags drive these statuses." items={socialIntegrationEnvStatus} />;
  }

  if (activeSub.key === "api-management") {
    return (
      <div className="section-grid two">
        <EnvStatusPanel title="Feature Flags" description="Public environment flags for real API mode and auto-posting." items={featureFlagEnvStatus} />
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

function AiProviderSettingsPanel({ state, fallbackItems }: { state: ApiResourceState<ApiAiProviderStatus>; fallbackItems: EnvStatusItem[] }) {
  const data = state.data;

  return (
    <div className="section-grid two" data-testid="ai-provider-settings">
      <section className="section-card">
        <SectionTitle title="AI Provider Active" action={state.loading ? "Loading" : "OpenAI Compatible"} />
        <p className="muted env-description">Provider status comes from the backend. API keys are masked before reaching the browser.</p>
        {state.loading && <EmptyState title="Loading AI provider status..." description="Checking server-side provider configuration." />}
        {state.error && <EmptyState title="Unable to load AI provider status" description={state.error} />}
        {data && (
          <>
            <div className="ai-provider-summary">
              <span>Active provider</span>
              <strong>{formatAiProviderName(data.activeProvider)}</strong>
              <StatusBadge label={data.configured ? "Configured" : "Missing"} tone={data.configured ? "green" : "red"} />
            </div>
            <p className="muted">{data.message}</p>
            <div className="env-status-grid">
              {data.providers.map((provider) => (
                <article className="env-status-card ai-provider-card" key={`${provider.role}-${provider.provider}`}>
                  <div className="row between gap">
                    <strong>{provider.role === "primary" ? "Primary" : "Fallback"}: {formatAiProviderName(provider.provider)}</strong>
                    <StatusBadge label={provider.status} tone={provider.configured ? "green" : "red"} />
                  </div>
                  <div className="ai-provider-meta">
                    <span>Model</span>
                    <code>{provider.model ?? "missing"}</code>
                    <span>Base URL</span>
                    <code>{provider.baseUrl ?? "provider default"}</code>
                    <span>API key</span>
                    <code>{provider.maskedApiKey}</code>
                  </div>
                  {provider.missing.length > 0 && (
                    <div className="tag-cloud env-warning-list">
                      {provider.missing.map((item) => (
                        <StatusBadge label={`Missing: ${item}`} tone="amber" key={item} />
                      ))}
                    </div>
                  )}
                </article>
              ))}
              {!data.fallback && (
                <article className="env-status-card ai-provider-card">
                  <div className="row between gap">
                    <strong>Fallback Provider</strong>
                    <StatusBadge label="Not Configured" tone="amber" />
                  </div>
                  <p>Isi AI_FALLBACK_PROVIDER, AI_FALLBACK_API_KEY, dan AI_FALLBACK_MODEL jika ingin retry otomatis saat provider utama gagal.</p>
                </article>
              )}
            </div>
          </>
        )}
      </section>
      <EnvStatusPanel title="AI Provider ENV" description="Safe template for OpenAI, DeepSeek, Qwen, and fallback provider configuration." items={fallbackItems} />
    </div>
  );
}

function formatAiProviderName(provider: string) {
  const names: Record<string, string> = {
    openai: "OpenAI",
    deepseek: "DeepSeek",
    qwen: "Qwen"
  };

  return names[provider] ?? formatEnumLabel(provider);
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
        {item.sourceType && <StatusBadge label={item.sourceType} tone={item.sourceType === "REAL_API" ? "green" : "slate"} />}
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
  connectionMode: "OAuth Placeholder";
  platform: string;
  onCancel: () => void;
  onConnect: () => void;
  onHandleChange: (value: string) => void;
  onModeChange: (value: "OAuth Placeholder") => void;
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
            <select value={connectionMode} onChange={(event) => onModeChange(event.target.value as "OAuth Placeholder")}>
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
      <EmptyState title="Analytics metrics not connected" description="Real analytics provider has not returned KPI records." />
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
      <StatusBadge label="REAL_API" tone="green" />
      <div className="tag-cloud">
        {items.map((item, index) => (
          <StatusBadge label={item} tone={index % 3 === 0 ? "blue" : index % 3 === 1 ? "cyan" : "slate"} key={item} />
        ))}
      </div>
      {items.length === 0 && <EmptyState title="No data yet" description="Demo placeholder ready for backend integration." />}
    </section>
  );
}

function shouldShowConnectedAccountsPanel(activePage: PageId, activeSubKey: string) {
  if (activePage === "scheduler") {
    return true;
  }

  return activePage === "clip-studio" && activeSubKey === "export-center";
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
    const parsed = value ? (JSON.parse(value) as VideoOpportunity) : null;
    return parsed?.sourceType === "DEMO" ? null : parsed;
  } catch {
    return null;
  }
}

function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      if (!environmentStatus.demoDataEnabled && Array.isArray(initialValue) && initialValue.length === 0) {
        return initialValue;
      }

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

