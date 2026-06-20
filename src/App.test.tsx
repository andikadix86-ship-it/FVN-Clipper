import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import {
  DEFAULT_CLIP_COUNT,
  DEFAULT_VIDEO_QUALITY,
  ClipStudioValidationError,
  generateClipStudioPlan,
  validateClipStudioGeneratePayload
} from "./clip-studio-service";
import { navItems, opportunities } from "./data/ai-clipper-demo";

const apiCategories = [
  { id: "cat-ai", name: "AI", slug: "ai", isActive: true, sourceType: "DEMO" },
  { id: "cat-business", name: "Business", slug: "business", isActive: true, sourceType: "DEMO" }
];

const apiCampaigns = [
  {
    id: "campaign-ai",
    name: "AI Tools Ramadan Launch",
    slug: "ai-tools-ramadan-launch",
    platform: "TIKTOK",
    status: "READY",
    startDate: "2026-06-18T00:00:00.000Z",
    endDate: "2026-07-02T00:00:00.000Z",
    sourceType: "DEMO",
    _count: { opportunities: 12, publishingSchedules: 4 }
  }
];

const apiOpportunities = opportunities.map((item, index) => ({
  id: item.id,
  title: item.title,
  slug: item.id,
  description: item.analysis,
  niche: item.niche,
  keyword: item.niche.toLowerCase(),
  platform: item.platform.toUpperCase(),
  status: item.status === "New" || item.status === "Analyzed" || item.status === "Saved" ? "READY" : item.status.toUpperCase(),
  performanceLevel: index < 10 ? "HIGH" : index < 16 ? "MEDIUM" : "LOW",
  opportunityScore: item.clippingScore,
  trendScore: item.viralScore,
  competitionScore: 40 + (index % 20),
  viralPotentialScore: item.viralScore,
  aiRecommendation: item.analysis,
  hookIdeas: ["Hook"],
  contentAngles: ["Angle"],
  thumbnailIdeas: null,
  sourceUrl: null,
  sourceType: "DEMO",
  isSaved: index === 0,
  savedAt: index === 0 ? "2026-06-18T00:00:00.000Z" : null,
  categoryId: "cat-ai",
  campaignId: "campaign-ai",
  category: apiCategories[0],
  campaign: apiCampaigns[0],
  createdAt: "2026-06-18T00:00:00.000Z"
}));

function mockApiResponse(url: string, init?: RequestInit) {
  if (init?.method === "PATCH") {
    return { data: { ...apiOpportunities[0], isSaved: !apiOpportunities[0].isSaved } };
  }

  if (url.includes("/api/ai-clip-intelligence/categories")) {
    return { data: apiCategories };
  }
  if (url.includes("/api/dashboard/campaigns")) {
    return { data: apiCampaigns };
  }
  if (url.includes("/api/dashboard/overview")) {
    return {
      data: {
        totals: { campaigns: 1, opportunities: apiOpportunities.length, savedOpportunities: 1, scheduledPosts: 1, publishedPosts: 1, failedPosts: 0 },
        topCategories: [{ ...apiCategories[0], opportunities: apiOpportunities.length }],
        latestRecommendations: []
      }
    };
  }
  if (url.includes("/api/dashboard/recommendations")) {
    return { data: [] };
  }
  if (url.includes("/api/dashboard/publishing-calendar")) {
    return { data: [] };
  }
  if (url.includes("/api/ai-clip-intelligence/competitors")) {
    return { data: [] };
  }
  if (url.includes("/api/ai-clip-intelligence/opportunities")) {
    const parsed = new URL(url, "http://localhost");
    let rows = [...apiOpportunities];
    if (parsed.searchParams.get("saved") === "true") {
      rows = rows.filter((item) => item.isSaved);
    }
    if (parsed.searchParams.get("sort") === "opportunityScore_desc") {
      rows.sort((a, b) => b.opportunityScore - a.opportunityScore);
    }
    const limit = Number(parsed.searchParams.get("limit"));
    return { data: Number.isFinite(limit) && limit > 0 ? rows.slice(0, limit) : rows };
  }

  return { data: [] };
}

describe("FVN AI Clipper app", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, "", "/dashboard");
    vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      return Promise.resolve(new Response(JSON.stringify(mockApiResponse(url, init)), { status: 200, headers: { "content-type": "application/json" } }));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the primary navigation and dashboard", async () => {
    const { container } = render(<App />);

    expect(screen.getByRole("button", { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /AI Clip Intelligence/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Campaign Clipper/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Dashboard Overview")).toBeInTheDocument());

    const sidebarMenu = Array.from(container.querySelectorAll(".nav-item span")).map((node) => node.textContent);
    expect(sidebarMenu).toEqual(navItems.map((item) => item.label));
    expect(sidebarMenu).toEqual([
      "Dashboard",
      "AI Clip Intelligence",
      "Clip Studio",
      "Campaign Clipper",
      "Content Library",
      "Scheduler",
      "Analytics",
      "Settings"
    ]);
    expect(sidebarMenu).not.toContain("Projects");
    expect(sidebarMenu).not.toContain("Social Accounts");
    expect(sidebarMenu).not.toContain("Create Clip");
    expect(sidebarMenu).not.toContain("Campaign Validation");
  });

  it("runs the database clip workflow into library and scheduler", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "AI Clip Intelligence" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Top 20 Opportunities" })[0]);
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Clip This Video" }).length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByRole("button", { name: "Clip This Video" })[0]);

    expect(window.location.pathname).toBe("/clip-studio/source-video");
    expect(screen.getByTestId("clip-studio-source-video-new")).toBeInTheDocument();
    expect(screen.getByText("Mendukung durasi hingga 3 jam")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Generate Clips" }));
    await waitFor(() => expect(screen.getAllByTestId("clip-studio-card")).toHaveLength(3));

    const firstClipTitle = screen.getAllByTestId("clip-studio-card")[0].querySelector("h3")?.textContent ?? "";
    fireEvent.click(screen.getAllByTestId("clip-studio-action-save")[0]);
    expect(screen.getByText("Saved to Library")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Content Library" }));
    expect(screen.getByText(firstClipTitle)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Schedule" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Scheduler" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Content Queue" })[0]);
    expect(screen.getByText(new RegExp(`${firstClipTitle} - Scheduled|AI CRM in 30 seconds - Scheduled`))).toBeInTheDocument();
  });

  it("uses the new Clip Studio Source Video UI on the active route", async () => {
    window.history.pushState({}, "", "/clip-studio/source-video");
    render(<App />);

    expect(screen.getByTestId("clip-studio-source-video-new")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Paste video URL...")).toBeInTheDocument();
    expect(screen.getByText("Mendukung durasi hingga 3 jam")).toBeInTheDocument();
    expect(screen.getByTestId("clip-studio-count")).toHaveValue(String(DEFAULT_CLIP_COUNT));
    expect(screen.getByTestId("clip-studio-quality-1080p")).toHaveAttribute("aria-pressed", "true");

    for (const label of ["720p HD", "1080p Full HD", "1440p / 2K", "2160p / 4K"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }

    fireEvent.change(screen.getByTestId("clip-studio-duration"), { target: { value: "180" } });
    expect(screen.getByRole("button", { name: "Generate Clips" })).toBeEnabled();

    fireEvent.change(screen.getByTestId("clip-studio-duration"), { target: { value: "181" } });
    expect(screen.getByText("Durasi video maksimal 3 jam.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate Clips" })).toBeDisabled();

    fireEvent.change(screen.getByTestId("clip-studio-duration"), { target: { value: "120" } });
    fireEvent.change(screen.getByTestId("clip-studio-count"), { target: { value: "15" } });
    fireEvent.click(screen.getByRole("button", { name: "720p HD" }));
    fireEvent.click(screen.getByRole("button", { name: "Generate Clips" }));

    await waitFor(() => expect(screen.getAllByTestId("clip-studio-card")).toHaveLength(15));
    expect(screen.getAllByText("720p")).toHaveLength(15);

    fireEvent.click(screen.getAllByTestId("clip-studio-action-edit")[0]);
    expect(screen.getByText("Ready for Editor")).toBeInTheDocument();
    fireEvent.click(screen.getAllByTestId("clip-studio-action-save")[0]);
    expect(screen.getByText("Saved to Library")).toBeInTheDocument();
    fireEvent.click(screen.getAllByTestId("clip-studio-action-schedule")[0]);
    expect(screen.getByText("Ready for Schedule")).toBeInTheDocument();
  });

  it("builds a real-ready Clip Studio generate payload and variable result count", () => {
    const payload = validateClipStudioGeneratePayload({
      sourceVideoUrl: "https://www.youtube.com/watch?v=demo",
      sourceDurationMinutes: 180,
      clipCount: 10,
      videoQuality: "2160p",
      targetPlatform: "Reels"
    });
    expect(payload).toMatchObject({
      sourceVideoUrl: "https://www.youtube.com/watch?v=demo",
      sourceDurationMinutes: 180,
      clipCount: 10,
      videoQuality: "2160p",
      targetPlatform: "Reels",
      promptMode: "clip_studio_structured_json",
      language: "id"
    });

    const defaultPayload = validateClipStudioGeneratePayload({ sourceVideoUrl: "https://example.com/video" });
    expect(defaultPayload.clipCount).toBe(DEFAULT_CLIP_COUNT);
    expect(defaultPayload.videoQuality).toBe(DEFAULT_VIDEO_QUALITY);

    expect(generateClipStudioPlan({ ...payload, clipCount: 1 }).clips).toHaveLength(1);
    expect(generateClipStudioPlan({ ...payload, clipCount: 15 }).clips).toHaveLength(15);
    expect(() => generateClipStudioPlan({ ...payload, sourceDurationMinutes: 181 })).toThrow(ClipStudioValidationError);

    const plan = generateClipStudioPlan(payload);
    expect(plan.prompt).toMatch(/Output wajib JSON terstruktur/i);
    for (const field of ["id", "title", "thumbnail", "duration", "hook", "angle", "viralScore", "quality", "platform", "status", "sourceVideoUrl"]) {
      expect(plan.clips[0]).toHaveProperty(field);
    }
  });

  it("loads dashboard overview and opens database top 20 opportunities", async () => {
    const { container } = render(<App />);

    await waitFor(() => expect(screen.getByText("Total Projects")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "AI Clip Intelligence" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Top 20 Opportunities" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "List" }));

    await waitFor(() => expect(container.querySelectorAll(".table-wrap tbody tr")).toHaveLength(opportunities.length));
    expect(opportunities).toHaveLength(20);
  });

  it("opens critical submenus and shows scheduler multi account status", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Campaign Clipper" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Compliance Center" })[0]);
    expect(window.location.pathname).toBe("/campaign-clipper/compliance");
    expect(screen.getByText("Campaign rule valid")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Scheduler" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Connected Accounts" })[0]);
    expect(window.location.pathname).toBe("/scheduler/connected-accounts");
    expect(screen.getAllByText("TikTok A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TikTok B").length).toBeGreaterThan(0);
    expect(screen.getAllByText("YouTube A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("YouTube B").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Instagram A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Not Connected").length).toBeGreaterThan(0);
  });

  it("shows safe environment status in Settings integrations", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    fireEvent.click(screen.getAllByRole("button", { name: "AI Providers" })[0]);
    expect(window.location.pathname).toBe("/settings/ai-providers");
    expect(screen.getByText("Gemini")).toBeInTheDocument();
    expect(screen.getAllByText("Demo Mode").length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("button", { name: "Social Integrations" })[0]);
    expect(window.location.pathname).toBe("/settings/social-integrations");
    expect(screen.getByText("YouTube OAuth")).toBeInTheDocument();
    expect(screen.getByText("TikTok OAuth")).toBeInTheDocument();
    expect(screen.getAllByText("Demo Mode").length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("button", { name: "API Management" })[0]);
    expect(screen.getByText("Feature Flags")).toBeInTheDocument();
    expect(screen.getAllByText("Not Connected").length).toBeGreaterThan(0);
  });
});
