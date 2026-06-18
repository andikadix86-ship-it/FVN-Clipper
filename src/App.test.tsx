import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";

describe("FVN AI Clipper app", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, "", "/dashboard");
  });

  it("renders the primary navigation and dashboard", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /AI Clip Intelligence/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Campaign Clipper/i })).toBeInTheDocument();
    expect(screen.getByText(/Welcome back, Andika/i)).toBeInTheDocument();
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
});
