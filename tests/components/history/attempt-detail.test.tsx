// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AttemptView } from "../../../lib/attempts.ts";

const readAttempt = vi.fn<(id: string) => Promise<AttemptView | null>>();
vi.mock("../../../lib/attempt-reader.ts", () => ({ readAttempt }));

const { AttemptDetail } = await import("../../../components/history/attempt-detail.tsx");

const doneAttempt: AttemptView = {
  id: "a1",
  kataId: "retail-cart",
  randoriId: null,
  provider: "anthropic",
  model: "claude-opus-5-5",
  servedModel: "claude-opus-5-5",
  spec: "Sum the cart in cents. <b>bold?</b>",
  code: "function cartTotal() { return 0; }",
  status: "done",
  errorCategory: null,
  truncated: false,
  latencyMs: 4200,
  inputTokens: 392,
  outputTokens: 485,
  createdAt: "2026-10-20T09:30:00.000Z",
  result: {
    passed: 1,
    total: 2,
    tests: [
      { label: "An empty cart costs 0", status: "passed" },
      { label: "Every third unit is free", status: "failed" },
    ],
  },
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AttemptDetail (CA5.3)", () => {
  it("shows the spec and code as text, the score and each test, and the metrics", async () => {
    readAttempt.mockResolvedValue(doneAttempt);
    const { container } = render(<AttemptDetail id="a1" />);
    expect(await screen.findByText("Sum the cart in cents. <b>bold?</b>")).toBeTruthy();
    expect(container.querySelector("b")).toBeNull();
    expect(screen.getByText("function cartTotal() { return 0; }")).toBeTruthy();
    expect(screen.getByTestId("score").textContent).toBe("1 / 2 tests passed");
    expect(screen.getByText("Failed: Every third unit is free")).toBeTruthy();
    expect(screen.getByText(/392 input tokens/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Autumn campaign cart" }).getAttribute("href")).toBe("/katas/retail-cart");
  });

  it("explains a failed model call with its category", async () => {
    readAttempt.mockResolvedValue({ ...doneAttempt, status: "error", code: null, result: null, errorCategory: "key-refused" });
    render(<AttemptDetail id="a1" />);
    expect(await screen.findByText("Anthropic refused your API key. Check it in Settings.")).toBeTruthy();
  });

  it("shows the same not-found message for a missing or forbidden attempt (CA6.5)", async () => {
    readAttempt.mockResolvedValue(null);
    render(<AttemptDetail id="someone-else" />);
    expect(await screen.findByText("Attempt not found.")).toBeTruthy();
  });
});
