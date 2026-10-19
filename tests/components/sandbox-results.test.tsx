// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SandboxResults } from "../../components/sandbox-results.tsx";
import type { SandboxReport } from "../../sandbox/types.ts";

afterEach(() => cleanup());

describe("SandboxResults", () => {
  it("shows the score and each test with a text status, not only a color", () => {
    const report: SandboxReport = {
      status: "completed",
      outcomes: [
        { label: "An empty cart costs 0", status: "passed" },
        { label: "Every third unit is free", status: "failed" },
      ],
    };
    render(<SandboxResults report={report} />);
    expect(screen.getByTestId("score").textContent).toBe("1 / 2 tests passed");
    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Passed: An empty cart costs 0",
      "Failed: Every third unit is free",
    ]);
  });

  it("explains a load error with its message (CA4.8)", () => {
    const report: SandboxReport = {
      status: "load-error",
      loadError: "Unexpected token ';'",
      outcomes: [{ label: "An empty cart costs 0", status: "failed" }],
    };
    render(<SandboxResults report={report} />);
    expect(screen.getByRole("alert").textContent).toContain("Unexpected token ';'");
  });

  it("explains a timeout and marks the unfinished tests (CA4.9)", () => {
    const report: SandboxReport = {
      status: "timeout",
      outcomes: [
        { label: "First", status: "passed" },
        { label: "Second", status: "timeout" },
      ],
    };
    render(<SandboxResults report={report} />);
    expect(screen.getByRole("status").textContent).toContain("5 seconds");
    expect(within(screen.getAllByRole("listitem")[1]!).getByText(/Timed out/)).toBeTruthy();
  });
});
