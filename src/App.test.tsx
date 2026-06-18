import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("FVN AI Clipper app", () => {
  it("renders the primary navigation and dashboard", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /AI Clip Intelligence/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Campaign Clipper/i })).toBeInTheDocument();
    expect(screen.getByText(/Welcome back, Andika/i)).toBeInTheDocument();
  });
});
