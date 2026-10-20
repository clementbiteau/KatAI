// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AttemptView } from "../../../lib/attempts.ts";

const readAttempt = vi.fn<(id: string) => Promise<AttemptView | null>>();
vi.mock("../../../lib/attempt-reader.ts", () => ({ readAttempt }));

const { AttemptComparison } = await import("../../../components/compare/attempt-comparison.tsx");

function attempt(id: string, overrides: Partial<AttemptView> = {}): AttemptView {
  return {
    id,
    kataId: "retail-cart",
    randoriId: null,
    provider: "anthropic",
    model: "claude-opus-5-5",
    servedModel: "claude-opus-5-5",
    spec: `Spec of ${id}`,
    code: `function cartTotal() { return "${id}"; }`,
    status: "done",
    errorCategory: null,
    truncated: false,
    latencyMs: 4200,
    inputTokens: 392,
    outputTokens: 485,
    createdAt: "2026-10-20T09:30:00.000Z",
    result: { passed: 1, total: 12, tests: [{ label: "An empty cart costs 0", status: "passed" }] },
    ...overrides,
  };
}

function stubAttempts(attempts: Record<string, AttemptView | null>) {
  readAttempt.mockImplementation(async (id) => attempts[id] ?? null);
}

function cellsOf(rowName: string) {
  const row = screen.getByRole("rowheader", { name: rowName }).closest("tr")!;
  return within(row).getAllByRole("cell").map((cell) => cell.textContent);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AttemptComparison (US6)", () => {
  it("puts the older attempt on the left and aligns every field (CA6.1)", async () => {
    stubAttempts({
      newer: attempt("newer", { createdAt: "2026-10-20T10:00:00.000Z", result: { passed: 12, total: 12, tests: [] }, model: "claude-haiku-5-5", servedModel: "claude-haiku-5-5" }),
      older: attempt("older", { createdAt: "2026-10-20T09:00:00.000Z" }),
    });
    render(<AttemptComparison firstId="newer" secondId="older" />);
    expect(await screen.findByRole("table")).toBeTruthy();
    expect(cellsOf("Score")).toEqual(["1 / 12", "12 / 12"]);
    expect(cellsOf("Model")).toEqual(["Claude Opus 5.5", "Claude Haiku 5.5"]);
    expect(cellsOf("Specification")).toEqual(["Spec of older", "Spec of newer"]);
    expect(cellsOf("Input tokens")).toEqual(["392", "392"]);
    expect(cellsOf("An empty cart costs 0")).toEqual(["Passed", "—"]);
  });

  it("shows an attempt in error with its category, and a dash for missing fields (CA6.4)", async () => {
    stubAttempts({
      ok: attempt("ok", { createdAt: "2026-10-20T09:00:00.000Z" }),
      failed: attempt("failed", { createdAt: "2026-10-20T10:00:00.000Z", status: "error", code: null, result: null, errorCategory: "timeout", servedModel: null, inputTokens: null, outputTokens: null }),
    });
    render(<AttemptComparison firstId="ok" secondId="failed" />);
    await screen.findByRole("table");
    expect(cellsOf("Status")).toEqual(["Scored", "Error: The model did not answer within 60 seconds. Try again."]);
    expect(cellsOf("Generated code")[1]).toBe("—");
    expect(cellsOf("Score")[1]).toBe("—");
    expect(cellsOf("Input tokens")[1]).toBe("—");
  });

  it("says the same thing for another user's attempt and a missing one (CA6.5)", async () => {
    stubAttempts({ mine: attempt("mine") });
    render(<AttemptComparison firstId="mine" secondId="not-mine" />);
    expect(await screen.findByText("Attempt not found.")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("refuses attempts on different katas (CA6.6)", async () => {
    stubAttempts({ cart: attempt("cart"), engraving: attempt("engraving", { kataId: "luxury-engraving" }) });
    render(<AttemptComparison firstId="cart" secondId="engraving" />);
    expect(await screen.findByText("Both attempts must be on the same kata.")).toBeTruthy();
  });

  it("refuses comparing an attempt with itself", async () => {
    stubAttempts({ same: attempt("same") });
    render(<AttemptComparison firstId="same" secondId="same" />);
    expect(await screen.findByText("Choose two different attempts.")).toBeTruthy();
  });
});
