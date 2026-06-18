import {
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  Filter,
  Menu,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sun,
  Upload,
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
  return (
    <>
      <button className="mobile-menu" type="button" onClick={onCloseMobile} aria-label="Toggle sidebar">
        <Menu size={20} />
      </button>
      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">FV</div>
          {!collapsed && (
            <div>
              <strong>FVN AI Clipper</strong>
              <span>Intelligence Platform</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav" aria-label="Main menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <div className="nav-block" key={item.id}>
                <button className={`nav-item ${isActive ? "active" : ""}`} type="button" onClick={() => onNavigate(item.path)}>
                  <Icon size={18} />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && isActive && <ChevronDown size={16} />}
                </button>
                {!collapsed && isActive && (
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
          })}
        </nav>

        <button className="collapse-button" type="button" onClick={onCollapse}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </aside>
    </>
  );
}

export function AppHeader({ title, path, onOpenMobile, onAction }: { title: string; path: string; onOpenMobile: () => void; onAction: (label: string) => void }) {
  return (
    <header className="app-header">
      <button className="header-menu" type="button" onClick={onOpenMobile} aria-label="Open sidebar">
        <Menu size={20} />
      </button>
      <div className="header-search">
        <Search size={18} />
        <input aria-label="Search" placeholder="Search clips, campaigns, accounts..." />
      </div>
      <div className="header-actions">
        <button className="primary-button" type="button" onClick={() => onAction("Create New")}>
          <Plus size={18} />
          <span>Create New</span>
        </button>
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
          <span>FA</span>
          <div>
            <strong>FVN Admin</strong>
            <small>{path}</small>
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
  return (
    <article className="stat-card">
      <div className={`stat-dot ${stat.tone}`} />
      <StatusBadge label="Demo Data" tone="blue" />
      <span>{stat.label}</span>
      <strong>{stat.value}</strong>
      <small>{stat.delta}</small>
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
  return (
    <div className="filter-bar">
      <div className="filter-label">
        <Filter size={16} />
        <span>Demo filters</span>
      </div>
      {filters.map((filter) => (
        <button type="button" className="filter-chip" key={filter}>
          {filter}
          <ChevronDown size={14} />
        </button>
      ))}
    </div>
  );
}

export function VideoOpportunityCard({ item, onClip }: { item: VideoOpportunity; onClip: (item: VideoOpportunity) => void }) {
  return (
    <article className="opportunity-card">
      <div className="thumb">{item.thumbnail}</div>
      <div className="opportunity-body">
        <div className="row between gap">
          <StatusBadge label={item.platform} tone="cyan" />
          <ScoreBadge score={item.viralScore} label="Viral" />
        </div>
        <h3>{item.title}</h3>
        <p>{item.channel} - {item.views} views - {item.engagement} engagement</p>
        <p className="analysis">{item.analysis}</p>
        <div className="row wrap">
          <button className="primary-button compact" type="button" onClick={() => onClip(item)}>
            Clip This Video
          </button>
          <button className="secondary-button compact" type="button">Save Opportunity</button>
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
  onSave: (item: VideoOpportunity) => void;
  onAnalyze: (item: VideoOpportunity) => void;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
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
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="video-cell">
                  <div className="mini-thumb">{item.thumbnail}</div>
                  <span>{item.title}</span>
                </div>
              </td>
              <td>{item.channel}</td>
              <td>{item.platform}</td>
              <td>{item.views}</td>
              <td>{item.engagement}</td>
              <td>{item.niche}</td>
              <td><StatusBadge label={item.status} tone={item.status === "Ready" ? "green" : item.status === "Saved" ? "blue" : "slate"} /></td>
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
                  <button className="secondary-button compact" type="button" onClick={() => onSave(item)}>Save</button>
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
        <StatusBadge label={campaign.status} tone={tone} />
        <span className="muted">{campaign.platform}</span>
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
  const rows = [
    ["Duration valid", "PASS", "green", "15-45 seconds window matched."],
    ["CTA valid", "PASS", "green", "CTA detected near closing frame."],
    ["Hashtag valid", "WARNING", "amber", "One hashtag may be blocked by campaign rules."],
    ["Product mention valid", "PASS", "green", "Product mention found in caption."],
    ["Platform policy valid", "PASS", "green", "No obvious policy issue in demo scan."],
    ["Campaign rule valid", "FAILED", "red", "Required provider phrase is missing."]
  ] as const;

  return (
    <div className="checklist">
      {rows.map(([label, status, tone, reason]) => (
        <div className="check-row" key={label}>
          {status === "FAILED" ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>
            {label}
            {(status === "WARNING" || status === "FAILED") && <small>{reason}</small>}
          </span>
          <StatusBadge label={status} tone={tone} />
          {(status === "WARNING" || status === "FAILED") && <button className="secondary-button tiny" type="button">Fix</button>}
        </div>
      ))}
      <div className="ai-note">
        <strong>AI suggestion</strong>
        <p>Add one explicit product mention before the CTA and replace a blocked hashtag.</p>
      </div>
    </div>
  );
}

export function ContentCard({ item, onSchedule }: { item: ContentItem; onSchedule?: (item: ContentItem) => void }) {
  const tone = item.status === "Published" ? "green" : item.status === "Scheduled" ? "blue" : item.status === "Ready" ? "cyan" : item.status === "Archived" ? "slate" : "amber";
  return (
    <article className="content-card">
      <div className="content-preview">{item.category.slice(0, 2).toUpperCase()}</div>
      <div>
        <StatusBadge label={item.status} tone={tone} />
        <h3>{item.title}</h3>
        <p>{item.category} - {item.platform}</p>
        <p className="muted">{item.campaign}</p>
        <strong>{item.metric}</strong>
        <div className="row wrap content-actions">
          <button className="secondary-button tiny" type="button">Preview</button>
          <button className="secondary-button tiny" type="button" onClick={() => onSchedule?.(item)}>Schedule</button>
          <button className="ghost-button tiny" type="button">Move to Campaign</button>
          <button className="ghost-button tiny" type="button">Archive</button>
        </div>
      </div>
    </article>
  );
}

export function AccountCard({ account, onToggle }: { account: Account; onToggle?: (account: Account) => void }) {
  const tone = account.status === "Connected" ? "green" : "amber";
  return (
    <article className="account-card">
      <div className="account-icon">{account.platform.slice(0, 2).toUpperCase()}</div>
      <div>
        <h3>{account.name}</h3>
        <p>{account.platform}</p>
      </div>
      <StatusBadge label={account.status} tone={tone} />
      <span className="muted">{account.health} - Last sync: {account.lastSync}</span>
      <div className="row">
        <button className="secondary-button tiny" type="button">Refresh Status</button>
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
      <div className="panel-card gradient-panel">
        <DemoDataBadge />
        <h3>{recommendations[0].title}</h3>
        <p>{recommendations[0].description}</p>
        <button className="white-button" type="button">{recommendations[0].action}</button>
      </div>
      <div className="panel-card">
        <div className="row between">
          <h3>Connected Accounts</h3>
          <ExternalLink size={16} />
        </div>
        <div className="mini-list">
          {accounts.slice(0, 5).map((account) => (
            <div className="mini-list-row" key={account.name}>
              <span>{account.name}</span>
              <StatusBadge label={account.status} tone={account.status === "Connected" ? "green" : "amber"} />
            </div>
          ))}
        </div>
      </div>
    </aside>
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
