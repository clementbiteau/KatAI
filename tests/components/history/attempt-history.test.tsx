// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AttemptView } from "../../../lib/attempts.ts";
import type { KataAttempts } from "../../../components/history/use-kata-attempts.ts";

let kataAttempts: KataAttempts = { status: "loading" };
const push = vi.fn();
vi.mock("../../../components/history/use-kata-attempts.ts", () => ({ useKataAttempts: () => kataAttempts }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const { AttemptHistory } = await import("../../../components/history/attempt-history.tsx");

function attempt(overrides: Partial<AttemptView>): AttemptView {
  return {
    id: "a1",
    kataId: "retail-cart",
    randoriId: null,
    provider: "anthropic",
    model: "claude-opus-5-5",
    servedModel: "claude-opus-5-5",
    spec: "Sum the cart.",
    code: "function cartTotal() {}",
    status: "done",
    errorCategory: null,
    truncated: false,
    latencyMs: 4200,
    inputTokens: 392,
    outputTokens: 485,
    createdAt: "2026-10-20T09:30:00.000Z",
    result: { passed: 9, total: 12, tests: [] },
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AttemptHistory", () => {
  it("lists attempts with date, model, score, duration and status, in the order given (CA5.1)", () => {
    kataAttempts = {
      status: "ready",
      attempts: [
        attempt({ id: "newest", result: { passed: 12, total: 12, tests: [] } }),
        attempt({ id: "error", status: "error", code: null, result: null, errorCategory: "timeout", servedModel: null }),
        attempt({ id: "oldest" }),
      ],
    };
    render(<AttemptHistory uid="alice" kataId="retail-cart" />);
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows.map((row) => row.querySelector("td:nth-child(3)")?.textContent)).toEqual(["12 / 12", "Error", "9 / 12"]);
    expect(rows[0]!.textContent).toContain("Claude Opus 5.5");
    expect(rows[0]!.textContent).toContain("4.2 s");
    expect(rows[0]!.textContent).toContain("20 Oct 2026");
    expect(screen.getAllByRole("link", { name: "View" })[0]!.getAttribute("href")).toBe("/attempts/newest");
  });

  it("invites a first attempt when there is none (CA5.2)", () => {
    kataAttempts = { status: "ready", attempts: [] };
    render(<AttemptHistory uid="alice" kataId="retail-cart" />);
    expect(screen.getByText("No attempt yet. Write your first spec above.")).toBeTruthy();
  });

  it("enables comparison with exactly two selected attempts, older first in the link (CA6.1, CA6.2)", () => {
    kataAttempts = { status: "ready", attempts: [attempt({ id: "third" }), attempt({ id: "second" }), attempt({ id: "first" })] };
    render(<AttemptHistory uid="alice" kataId="retail-cart" />);
    const compare = screen.getByRole("button", { name: "Compare selected" });
    const boxes = screen.getAllByRole("checkbox");
    expect(compare.hasAttribute("disabled")).toBe(true);
    fireEvent.click(boxes[0]!);
    expect(compare.hasAttribute("disabled")).toBe(true);
    fireEvent.click(boxes[2]!);
    expect(compare.hasAttribute("disabled")).toBe(false);
    fireEvent.click(boxes[1]!);
    expect(compare.hasAttribute("disabled")).toBe(true);
    fireEvent.click(boxes[1]!);
    fireEvent.click(compare);
    expect(push).toHaveBeenCalledWith("/compare?a=first&b=third");
  });

  it("explains that two attempts are needed when there is only one (CA6.3)", () => {
    kataAttempts = { status: "ready", attempts: [attempt({ id: "only" })] };
    render(<AttemptHistory uid="alice" kataId="retail-cart" />);
    expect(screen.getByText("Make at least two attempts to compare them.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Compare selected" })).toBeNull();
  });

  it("says when the history cannot be loaded", () => {
    kataAttempts = { status: "error" };
    render(<AttemptHistory uid="alice" kataId="retail-cart" />);
    expect(screen.getByRole("alert").textContent).toContain("could not be loaded");
  });
});
