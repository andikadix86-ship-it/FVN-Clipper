import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { navItems, opportunities } from "./data/ai-clipper-demo";

describe("FVN AI Clipper app", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, "", "/dashboard");
  });

  it("renders the primary navigation and dashboard", () => {
    const { container } = render(<App />);

    expect(screen.getByRole("button", { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /AI Clip Intelligence/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Campaign Clipper/i })).toBeInTheDocument();
    expect(screen.getByText(/Welcome back, Andika/i)).toBeInTheDocument();

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

  it("runs the demo clip workflow into library and scheduler", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "AI Clip Intelligence" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Top 20 Opportunities" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Clip This" })[0]);

    expect(screen.getByText("AI tools for small business growth in 2026")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/clip-studio/source-video");

    fireEvent.click(screen.getByRole("button", { name: "Generate Demo Clips" }));
    expect(screen.getByText("Hook A")).toBeInTheDocument();

    const saveLibraryButtons = screen.getAllByRole("button", { name: "Save to Library" });
    fireEvent.click(saveLibraryButtons[1]);

    fireEvent.click(screen.getByRole("button", { name: "Content Library" }));
    expect(screen.getByText("Hook A")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Schedule" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Scheduler" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Content Queue" })[0]);
    expect(screen.getByText(/Hook A - Scheduled|AI CRM in 30 seconds - Scheduled/)).toBeInTheDocument();
  });

  it("keeps dashboard opportunities compact and opens all top 20 opportunities", () => {
    const { container } = render(<App />);

    expect(container.querySelectorAll(".table-wrap tbody tr")).toHaveLength(5);

    fireEvent.click(screen.getByRole("button", { name: "AI Clip Intelligence" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Top 20 Opportunities" })[0]);

    expect(container.querySelectorAll(".table-wrap tbody tr")).toHaveLength(opportunities.length);
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
