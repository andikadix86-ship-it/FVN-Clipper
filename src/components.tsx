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
import { accounts, chartData, navItems } from "./data";
import type { Account, Activity, Campaign, ContentItem, NavItem, Stat, StatusTone, VideoOpportunity } from "./types";

interface SidebarProps {
  activePage: string;
  collapsed: boolean;
  mobileOpen: boolean;
  onNavigate: (id: NavItem["id"]) => void;
  onCollapse: () => void;
  onCloseMobile: () => void;
}

export function AppSidebar({ activePage, collapsed, mobileOpen, onNavigate, onCollapse, onCloseMobile }: SidebarProps) {
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
                <button className={`nav-item ${isActive ? "active" : ""}`} type="button" onClick={() => onNavigate(item.id)}>
                  <Icon size={18} />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && isActive && <ChevronDown size={16} />}
                </button>
                {!collapsed && isActive && (
                  <div className="submenu">
                    {item.submenu.map((sub) => (
                      <a href={`#${item.id}-${slugify(sub)}`} key={sub}>
                        {sub}
                      </a>
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

export function AppHeader({ title, path, onOpenMobile }: { title: string; path: string; onOpenMobile: () => void }) {
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
        <button className="primary-button" type="button">
          <Plus size={18} />
          <span>Create New</span>
        </button>
        <IconButton label="Notifications">
          <Bell size={18} />
        </IconButton>
        <IconButton label="Help">
          <CircleHelp size={18} />
        </IconButton>
        <IconButton label="Theme toggle">
          <Sun size={16} />
          <Moon size={16} />
        </IconButton>
        <button className="profile-button" type="button" aria-label="User profile">
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

export function VideoOpportunityTable({ items, onClip }: { items: VideoOpportunity[]; onClip: (item: VideoOpportunity) => void }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Video</th>
            <th>Channel</th>
            <th>Views</th>
            <th>Engagement</th>
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
              <td>{item.views}</td>
              <td>{item.engagement}</td>
              <td>
                <div className="score-stack">
                  <ScoreBadge score={item.viralScore} label="Viral" />
                  <ScoreBadge score={item.clippingScore} label="Clip" />
                </div>
              </td>
              <td>{item.analysis}</td>
              <td>
                <button className="primary-button compact" type="button" onClick={() => onClip(item)}>
                  Clip This
                </button>
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
    ["Duration valid", "PASS", "green"],
    ["CTA valid", "PASS", "green"],
    ["Hashtag valid", "WARNING", "amber"],
    ["Product mention valid", "PASS", "green"],
    ["Platform policy valid", "PASS", "green"],
    ["Campaign rule valid", "FAILED", "red"]
  ] as const;

  return (
    <div className="checklist">
      {rows.map(([label, status, tone]) => (
        <div className="check-row" key={label}>
          {status === "FAILED" ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{label}</span>
          <StatusBadge label={status} tone={tone} />
          {status === "FAILED" && <button className="secondary-button tiny" type="button">Fix</button>}
        </div>
      ))}
      <div className="ai-note">
        <strong>AI suggestion</strong>
        <p>Add one explicit product mention before the CTA and replace a blocked hashtag.</p>
      </div>
    </div>
  );
}

export function ContentCard({ item }: { item: ContentItem }) {
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
      </div>
    </article>
  );
}

export function AccountCard({ account }: { account: Account }) {
  const tone = account.status === "Connected" ? "green" : account.status === "Coming Soon" ? "slate" : "amber";
  return (
    <article className="account-card">
      <div className="account-icon">{account.platform.slice(0, 2).toUpperCase()}</div>
      <div>
        <h3>{account.name}</h3>
        <p>{account.platform}</p>
      </div>
      <StatusBadge label={account.status} tone={tone} />
      <span className="muted">{account.health}</span>
      <div className="row">
        <button className="secondary-button tiny" type="button">Refresh Status</button>
        {account.status === "Connected" ? <button className="ghost-button tiny" type="button">Disconnect</button> : <button className="secondary-button tiny" type="button">Add Account</button>}
      </div>
    </article>
  );
}

export function ScheduleCalendar() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const slots = ["TikTok A", "YouTube A", "Instagram A", "TikTok B", "Facebook"];
  return (
    <div className="calendar-grid">
      {days.map((day, index) => (
        <div className="calendar-day" key={day}>
          <strong>{day}</strong>
          <span>{index + 18}</span>
          {slots.slice(0, (index % 3) + 2).map((slot) => (
            <button className="calendar-pill" type="button" key={`${day}-${slot}`}>
              {slot}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

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

export function RightPanel() {
  return (
    <aside className="right-panel">
      <div className="panel-card gradient-panel">
        <StatusBadge label="Demo Data" tone="blue" />
        <h3>AI Recommendation For You</h3>
        <p>Prioritize AI & Technology clips today. Best posting window is 19:00 to 21:00 Asia/Jakarta.</p>
        <button className="white-button" type="button">Apply Recommendation</button>
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

export function IconButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button className="icon-button" type="button" aria-label={label} title={label}>
      {children}
    </button>
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

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
