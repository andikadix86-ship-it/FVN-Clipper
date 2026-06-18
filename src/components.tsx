import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  CheckSquare2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Eye,
  Filter,
  Menu,
  Moon,
  MoreVertical,
  Plus,
  Search,
  Sparkles,
  Sun,
  TrendingUp,
  Upload,
  Users,
  XCircle
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartData, navItems, recommendations } from "./data/ai-clipper-demo";
import type { Account, Activity, Campaign, ContentItem, GeneratedClip, ScheduleItem, Stat, StatusTone, VideoOpportunity } from "./types";

interface SidebarProps {
  activePage: string;
  activePath: string;
  collapsed: boolean;
  mobileOpen: boolean;
  onNavigate: (path: string) => void;
  onCollapse: () => void;
  onCloseMobile: () => void;
}

export function AppShell({ children, onAction }: { children: React.ReactNode; onAction: (label: string) => void }) {
  const handleButtonCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    const button = (event.target as HTMLElement).closest("button");
    if (!button || button.disabled) {
      return;
    }
    const label = button.getAttribute("aria-label") || button.textContent?.trim() || "Action";
    onAction(label);
  };

  return (
    <div className="app-shell" onClickCapture={handleButtonCapture}>
      {children}
    </div>
  );
}

export function AppSidebar({ activePage, activePath, collapsed, mobileOpen, onNavigate, onCollapse, onCloseMobile }: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() =>
    navItems.reduce<Record<string, boolean>>((state, item) => {
      state[item.id] = item.id === activePage;
      return state;
    }, {})
  );

  useEffect(() => {
    setExpandedMenus((current) => ({ ...current, [activePage]: true }));
  }, [activePage]);

  const toggleMenu = (menuKey: string) => {
    setExpandedMenus((current) => ({ ...current, [menuKey]: !current[menuKey] }));
  };

  const openParent = (path: string, menuKey: string) => {
    setExpandedMenus((current) => ({ ...current, [menuKey]: true }));
    onNavigate(path);
  };

  const renderNavItem = (item: (typeof navItems)[number]) => {
    const Icon = item.icon;
    const isActive = activePage === item.id;
    const isExpanded = Boolean(expandedMenus[item.id]);

    return (
      <div className="nav-block" key={item.id}>
        <div className={`nav-row ${isActive ? "active" : ""}`}>
          <button className={`nav-item ${isActive ? "active" : ""}`} type="button" onClick={() => openParent(item.path, item.id)}>
            <div className={`nav-icon nav-icon-${item.id}`} aria-hidden="true">
              <Icon size={18} />
            </div>
            {!collapsed && <span>{item.label}</span>}
          </button>
          {!collapsed && (
            <button
              className={`nav-toggle ${isExpanded ? "open" : ""}`}
              type="button"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Collapse submenu" : "Expand submenu"}
              onClick={() => toggleMenu(item.id)}
            >
              <ChevronDown size={16} />
            </button>
          )}
        </div>
        {!collapsed && isExpanded && (
          <div className="submenu">
            {item.submenu.map((sub) => (
              <button className={activePath === sub.path ? "active" : ""} type="button" onClick={() => onNavigate(sub.path)} key={sub.path}>
                {sub.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <button className="mobile-menu" type="button" onClick={onCloseMobile} aria-label="Toggle sidebar">
        <Menu size={20} />
      </button>
      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
          </div>
          {!collapsed && (
            <div>
              <strong>FVN</strong>
              <span>AI CLIPPER</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav" aria-label="Main menu">
          <p className="sidebar-group">AI Workflow</p>
          {navItems.filter((item) => item.id !== "settings").map(renderNavItem)}
          <p className="sidebar-group settings-group">Settings</p>
          {navItems.filter((item) => item.id === "settings").map(renderNavItem)}
        </nav>

        {!collapsed && (
          <div className="sidebar-plan">
            <strong>FVN Pro Plan</strong>
            <span>Your plan will expire in 23 days</span>
            <div className="plan-meter"><span /></div>
            <button className="primary-button compact" type="button">Upgrade Plan</button>
          </div>
        )}

        <button className="collapse-button" type="button" onClick={onCollapse}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </aside>
    </>
  );
}

export function AppHeader({
  title,
  path,
  onOpenMobile,
  onAction,
  onCreateSelect
}: {
  title: string;
  path: string;
  onOpenMobile: () => void;
  onAction: (label: string) => void;
  onCreateSelect: (action: "clip" | "campaign" | "schedule" | "account" | "scan") => void;
}) {
  const [open, setOpen] = useState(false);

  const select = (action: "clip" | "campaign" | "schedule" | "account" | "scan") => {
    setOpen(false);
    onCreateSelect(action);
  };

  return (
    <header className="app-header">
      <button className="header-menu" type="button" onClick={onOpenMobile} aria-label="Open sidebar">
        <Menu size={20} />
      </button>
      <div className="header-search">
        <Search size={18} />
        <input aria-label="Search" placeholder="Search anything..." />
        <kbd>⌘ K</kbd>
      </div>
      <div className="header-actions">
        <div className="create-menu">
          <button className="primary-button" type="button" onClick={() => setOpen((value) => !value)}>
            <Plus size={16} />
            <span>Create New</span>
          </button>
          {open && (
            <div className="create-dropdown">
              <button type="button" onClick={() => select("clip")}>New Clip</button>
              <button type="button" onClick={() => select("campaign")}>New Campaign</button>
              <button type="button" onClick={() => select("schedule")}>New Schedule</button>
              <button type="button" onClick={() => select("account")}>Add Account</button>
              <button type="button" onClick={() => select("scan")}>AI Scan</button>
            </div>
          )}
        </div>
        <IconButton label="Notifications" onClick={() => onAction("Notifications")}>
          <Bell size={18} />
        </IconButton>
        <IconButton label="Help" onClick={() => onAction("Help")}>
          <CircleHelp size={18} />
        </IconButton>
        <IconButton label="Theme toggle" onClick={() => onAction("Theme toggle")}>
          <Sun size={16} />
          <Moon size={16} />
        </IconButton>
        <button className="profile-button" type="button" aria-label="User profile" onClick={() => onAction("User profile")}>
          <span>AP</span>
          <div>
            <strong>Andika Pratama</strong>
            <small>Creator Plan</small>
          </div>
          <ChevronDown size={16} />
        </button>
      </div>
      <div className="mobile-title">
        <strong>{title}</strong>
        <span>{path}</span>
      </div>
    </header>
  );
}

export function PageHeader({ title, eyebrow, description, actions }: { title: string; eyebrow: string; description: string; actions?: React.ReactNode }) {
  return (
    <section className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </section>
  );
}

export function StatCard({ stat }: { stat: Stat }) {
  const Icon = stat.label === "Published" ? CheckSquare2 : stat.label === "Total Views" ? Eye : stat.label === "Engagement" ? TrendingUp : stat.label === "Connected Accounts" ? Users : ClapperboardIcon;
  return (
    <article className="stat-card">
      <div className={`stat-icon ${stat.tone}`}>
        <Icon size={19} />
      </div>
      <div>
        <span>{stat.label}</span>
        <strong>{stat.value}</strong>
        <small>{stat.delta}</small>
      </div>
    </article>
  );
}

export function StatusBadge({ label, tone = "slate" }: { label: string; tone?: StatusTone }) {
  return <span className={`status-badge ${tone}`}>{label}</span>;
}

export function ScoreBadge({ score, label }: { score: number; label?: string }) {
  const tone = score >= 90 ? "green" : score >= 80 ? "blue" : score >= 70 ? "amber" : "red";
  return (
    <span className={`score-badge ${tone}`}>
      {label ? `${label} ` : ""}
      {score}
    </span>
  );
}

export function FilterBar({ filters }: { filters: string[] }) {
  const [activeFilter, setActiveFilter] = useState(filters[0] ?? "Demo filters");

  return (
    <div className="filter-bar">
      <div className="filter-label">
        <Filter size={16} />
        <span>Demo filters</span>
      </div>
      {filters.map((filter) => (
        <button type="button" className={`filter-chip ${activeFilter === filter ? "active" : ""}`} onClick={() => setActiveFilter(filter)} key={filter}>
          {filter}
          <ChevronDown size={14} />
        </button>
      ))}
    </div>
  );
}

export function VideoOpportunityCard({ item, onClip, onSave }: { item: VideoOpportunity; onClip: (item: VideoOpportunity) => void; onSave?: (item: VideoOpportunity) => void | Promise<void> }) {
  return (
    <article className="opportunity-card">
      <div className="thumb">{item.thumbnail}</div>
      <div className="opportunity-body">
        <div className="row between gap">
          <SocialIcon platform={item.platform} />
          {item.sourceType && <StatusBadge label={item.sourceType} tone={item.sourceType === "DEMO" ? "blue" : "slate"} />}
          <ScoreBadge score={item.viralScore} label="Viral" />
        </div>
        <h3>{item.title}</h3>
        <p>{item.channel} - {item.views} views - {item.engagement} engagement</p>
        <p className="analysis">{item.analysis}</p>
        <div className="row wrap">
          <button className="primary-button compact" type="button" onClick={() => onClip(item)}>
            Clip This Video
          </button>
          <button className="secondary-button compact" type="button" onClick={() => onSave?.(item)}>{item.isSaved ? "Unsave Opportunity" : "Save Opportunity"}</button>
        </div>
      </div>
    </article>
  );
}

export function VideoOpportunityTable({
  items,
  onClip,
  onSave,
  onAnalyze
}: {
  items: VideoOpportunity[];
  onClip: (item: VideoOpportunity) => void;
  onSave: (item: VideoOpportunity) => void | Promise<void>;
  onAnalyze: (item: VideoOpportunity) => void;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Video</th>
            <th>Channel</th>
            <th>Platform</th>
            <th>Views</th>
            <th>Engagement</th>
            <th>Niche</th>
            <th>Status</th>
            <th>Scores</th>
            <th>AI Analysis</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id}>
              <td>{index + 1}</td>
              <td>
                <div className="video-cell">
                  <div className="mini-thumb">{item.thumbnail}</div>
                  <span>
                    {item.title}
                    <small>{item.channel}</small>
                  </span>
                </div>
              </td>
              <td>{item.channel}</td>
              <td><SocialIcon platform={item.platform} /></td>
              <td>{item.views}</td>
              <td>{item.engagement}</td>
              <td>{item.niche}</td>
              <td>
                <div className="score-stack">
                  <StatusBadge label={item.status} tone={getStatusTone(item.status)} />
                  {item.sourceType && <StatusBadge label={item.sourceType} tone={item.sourceType === "DEMO" ? "blue" : "slate"} />}
                </div>
              </td>
              <td>
                <div className="score-stack">
                  <ScoreBadge score={item.viralScore} label="Viral" />
                  <ScoreBadge score={item.clippingScore} label="Clip" />
                </div>
              </td>
              <td>{item.analysis}</td>
              <td>
                <div className="row wrap">
                  <button className="primary-button compact" type="button" onClick={() => onClip(item)}>
                    Clip This
                  </button>
                  <button className="secondary-button compact" type="button" onClick={() => onSave(item)}>{item.isSaved ? "Unsave" : "Save"}</button>
                  <button className="ghost-button compact" type="button" onClick={() => onAnalyze(item)}>Analyze</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const tone = campaign.status === "Active" ? "green" : campaign.status === "Warning" ? "amber" : campaign.status === "Completed" ? "blue" : "slate";
  return (
    <article className="campaign-card">
      <div className="row between gap">
        <SocialIcon platform={campaign.platform} />
        <StatusBadge label={campaign.status} tone={tone} />
      </div>
      <h3>{campaign.name}</h3>
      <p>{campaign.start} to {campaign.end}</p>
      <Progress label="Progress" value={campaign.progress} />
      <Progress label="Compliance" value={campaign.compliance} />
      <button className="secondary-button compact" type="button">Open Campaign</button>
    </article>
  );
}

export function ComplianceChecklist() {
  const baseRows = [
    ["Duration valid", "PASS", "green", "15-45 seconds window matched."],
    ["CTA valid", "PASS", "green", "CTA detected near closing frame."],
    ["Hashtag valid", "WARNING", "amber", "One hashtag may be blocked by campaign rules."],
    ["Product mention valid", "PASS", "green", "Product mention found in caption."],
    ["Platform policy valid", "PASS", "green", "No obvious policy issue in demo scan."],
    ["Campaign rule valid", "FAILED", "red", "Required provider phrase is missing."]
  ] as const;
  const [fixed, setFixed] = useState<string[]>([]);

  return (
    <div className="checklist">
      {baseRows.map(([label, status, tone, reason]) => {
        const isFixed = fixed.includes(label);
        const currentStatus = isFixed ? "PASS" : status;
        const currentTone = isFixed ? "green" : tone;
        return (
          <div className="check-row" key={label}>
            {currentStatus === "FAILED" ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>
              {label}
              {(currentStatus === "WARNING" || currentStatus === "FAILED") && <small>{reason}</small>}
            </span>
            <StatusBadge label={currentStatus} tone={currentTone} />
            {(currentStatus === "WARNING" || currentStatus === "FAILED") && <button className="secondary-button tiny" type="button" onClick={() => setFixed((items) => [...items, label])}>Fix</button>}
          </div>
        );
      })}
      <div className="ai-note">
        <strong>AI suggestion</strong>
        <p>Add one explicit product mention before the CTA and replace a blocked hashtag.</p>
      </div>
    </div>
  );
}

export function ContentCard({ item, onArchive, onSchedule }: { item: ContentItem; onArchive?: (item: ContentItem) => void; onSchedule?: (item: ContentItem) => void }) {
  const tone = item.status === "Published" ? "green" : item.status === "Scheduled" ? "blue" : item.status === "Ready" ? "cyan" : item.status === "Failed" ? "red" : item.status === "Archived" ? "slate" : "amber";
  return (
    <article className="content-card">
      <div className="content-preview">
        <SocialIcon platform={item.platform} />
      </div>
      <div>
        <StatusBadge label={item.status} tone={tone} />
        <StatusBadge label="Demo Data" tone="slate" />
        <h3>{item.title}</h3>
        <p>{item.category} - {item.platform}</p>
        <p className="muted">{item.campaign}</p>
        <strong>{item.metric}</strong>
        <div className="row wrap content-actions">
          <button className="secondary-button tiny" type="button">Preview</button>
          <button className="secondary-button tiny" type="button" onClick={() => onSchedule?.(item)}>Schedule</button>
          <button className="ghost-button tiny" type="button">Move to Campaign</button>
          <button className="ghost-button tiny" type="button" onClick={() => onArchive?.(item)}>Archive</button>
        </div>
      </div>
    </article>
  );
}

export function AccountCard({ account, onRefresh, onToggle }: { account: Account; onRefresh?: (account: Account) => void; onToggle?: (account: Account) => void }) {
  const tone = account.status === "Connected" ? "green" : "amber";
  return (
    <article className="account-card">
      <SocialIcon platform={account.platform} size="large" />
      <div>
        <h3>{account.name}</h3>
        <p>{account.platform}</p>
      </div>
      <StatusBadge label={account.status} tone={tone} />
      <StatusBadge label="Demo Data" tone="slate" />
      <span className="muted">{account.health} - Last sync: {account.lastSync}</span>
      <div className="row">
        <button className="secondary-button tiny" type="button" onClick={() => onRefresh?.(account)}>Refresh Status</button>
        {account.status === "Connected" ? (
          <button className="ghost-button tiny" type="button" onClick={() => onToggle?.(account)}>Disconnect</button>
        ) : (
          <button className="secondary-button tiny" type="button" onClick={() => onToggle?.(account)}>Connect</button>
        )}
      </div>
    </article>
  );
}

export function CalendarPreview({ schedules = [] }: { schedules?: ScheduleItem[] }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const slots = ["TikTok A", "YouTube A", "Instagram A", "TikTok B", "Facebook"];
  return (
    <div className="calendar-grid">
      {days.map((day, index) => (
        <div className="calendar-day" key={day}>
          <strong>{day}</strong>
          <span>{index + 18}</span>
          {[...slots.slice(0, (index % 3) + 2), ...schedules.filter((schedule) => schedule.day === day).map((schedule) => `${schedule.time} ${schedule.account}`)].map((slot) => (
            <button className="calendar-pill" type="button" key={`${day}-${slot}`}>
              <SocialIcon platform={slot} size="small" />
              {slot}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export const ScheduleCalendar = CalendarPreview;

export function ActivityFeed({ items }: { items: Activity[] }) {
  return (
    <div className="activity-feed">
      {items.map((item) => (
        <div className="activity-item" key={item.title}>
          <div className={`activity-dot ${item.tone}`} />
          <div>
            <strong>{item.title}</strong>
            <span>{item.meta}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsChart({ variant = "area" }: { variant?: "area" | "bar" }) {
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={260}>
        {variant === "area" ? (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip />
            <Area type="monotone" dataKey="views" stroke="#2563eb" fillOpacity={1} fill="url(#viewsGradient)" />
          </AreaChart>
        ) : (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip />
            <Bar dataKey="engagement" fill="#06b6d4" radius={[6, 6, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <Sparkles size={24} />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export function RightPanel({ accounts }: { accounts: Account[] }) {
  return (
    <aside className="right-panel">
      <div className="panel-card">
        <div className="row between">
          <h3>Connected Accounts</h3>
          <button className="ghost-button tiny" type="button">View All</button>
        </div>
        <div className="mini-list">
          {accounts.slice(0, 8).map((account) => (
            <div className="account-list-row" key={account.name}>
              <SocialIcon platform={account.platform} />
              <div>
                <strong>{account.name}</strong>
                <span>{account.status}</span>
              </div>
              <StatusBadge label={account.status === "Connected" ? "✓" : "!"} tone={account.status === "Connected" ? "green" : "amber"} />
              <MoreVertical size={15} />
            </div>
          ))}
        </div>
      </div>
      <div className="panel-card recommendation-panel">
        <div className="row between">
          <h3>AI Recommendation For You</h3>
          <button className="ghost-button tiny" type="button">See All</button>
        </div>
        {recommendations.map((item, index) => (
          <div className="recommendation-row" key={item.title}>
            <span className={`recommendation-icon rec-${index}`}><Sparkles size={18} /></span>
            <div>
              <small>{item.status}</small>
              <strong>{item.title.replace("AI Recommendation For You", "AI Tools")}</strong>
              <span>{item.description}</span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function SocialIcon({ platform, size = "normal" }: { platform: string; size?: "small" | "normal" | "large" }) {
  const key = getPlatformKey(platform);
  const label: Record<string, string> = {
    youtube: "▶",
    tiktok: "♪",
    instagram: "◎",
    facebook: "f",
    x: "X",
    linkedin: "in",
    default: "AI"
  };

  return (
    <span className={`social-icon social-${key} social-${size}`} aria-label={platform} title={platform}>
      {label[key] ?? label.default}
    </span>
  );
}

export function GeneratedClipList({
  clips,
  onSaveToCampaign,
  onSaveToLibrary
}: {
  clips: GeneratedClip[];
  onSaveToCampaign: (clip: GeneratedClip) => void;
  onSaveToLibrary: (clip: GeneratedClip) => void;
}) {
  return (
    <section className="section-card">
      <SectionHeading title="Generated Clips" action="Preview All" />
      {clips.length === 0 ? (
        <EmptyState title="No generated clips yet" description="Click Generate Clips to create demo clips from the selected source." />
      ) : (
        <div className="clip-list">
          {clips.map((clip, index) => (
            <div className="clip-row" key={clip.id}>
              <div className="mini-thumb">C{index + 1}</div>
              <div>
                <strong>{clip.title}</strong>
                <span>{clip.duration} duration - {clip.sourceTitle}</span>
              </div>
              <ScoreBadge score={clip.hookScore} label="Hook" />
              <ScoreBadge score={clip.viralScore} label="Viral" />
              <StatusBadge label={clip.status} tone={clip.status === "Ready" ? "green" : clip.status === "Draft" ? "amber" : "blue"} />
              <button className="secondary-button tiny" type="button">Edit</button>
              <button className="secondary-button tiny" type="button" onClick={() => onSaveToCampaign(clip)}>Save to Campaign</button>
              <button className="ghost-button tiny" type="button" onClick={() => onSaveToLibrary(clip)}>Save to Library</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function FormGrid({ items }: { items: string[] }) {
  return (
    <div className="form-grid">
      {items.map((item) => (
        <label key={item}>
          <span>{item}</span>
          <input placeholder="Demo Data" />
        </label>
      ))}
    </div>
  );
}

export function ToggleGrid({ items }: { items: string[] }) {
  return (
    <div className="toggle-grid">
      {items.map((item, index) => (
        <label className="toggle-row" key={item}>
          <span>{item}</span>
          <input type="checkbox" defaultChecked={index < 5} />
        </label>
      ))}
    </div>
  );
}

export function UploadPanel() {
  return (
    <div className="upload-panel">
      <Upload size={28} />
      <strong>Upload video or paste source URL</strong>
      <p>YouTube, TikTok, Instagram, Facebook, or cloud storage placeholder.</p>
      <div className="url-row">
        <input placeholder="Paste video URL..." />
        <button className="primary-button" type="button">Analyze Source</button>
      </div>
    </div>
  );
}

export function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button className="icon-button" type="button" aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  );
}

export function DemoDataBadge() {
  return <StatusBadge label="Demo Data" tone="blue" />;
}

export function NotConnectedBadge() {
  return <StatusBadge label="Not Connected" tone="amber" />;
}

export function ActionButton({ children, onClick, variant = "primary" }: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "ghost" }) {
  const className = variant === "primary" ? "primary-button" : variant === "secondary" ? "secondary-button" : "ghost-button";
  return <button className={className} type="button" onClick={onClick}>{children}</button>;
}

export function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`section-card ${className}`}>{children}</section>;
}

export function SectionHeading({ title, action }: { title: string; action?: string }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {action && <button className="ghost-button" type="button">{action}</button>}
    </div>
  );
}

function Progress({ label, value }: { label: string; value: number }) {
  return (
    <div className="progress-block">
      <div className="row between">
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="progress-track">
        <div style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function getStatusTone(status: string): StatusTone {
  if (status === "Ready" || status === "Published") return "green";
  if (status === "Saved" || status === "Scheduled") return "blue";
  if (status === "Draft" || status === "Paused") return "amber";
  if (status === "Failed") return "red";
  return "slate";
}

function getPlatformKey(platform: string) {
  const lower = platform.toLowerCase();
  if (lower.includes("youtube")) return "youtube";
  if (lower.includes("tiktok")) return "tiktok";
  if (lower.includes("instagram")) return "instagram";
  if (lower.includes("facebook")) return "facebook";
  if (lower.includes("linkedin")) return "linkedin";
  if (lower.includes("x") || lower.includes("twitter")) return "x";
  return "default";
}

function ClapperboardIcon({ size = 18 }: { size?: number }) {
  return <span style={{ fontSize: Math.max(14, size - 1), lineHeight: 1 }}>▣</span>;
}
