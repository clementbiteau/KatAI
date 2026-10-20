// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RandoriView } from "../../../lib/randoris/view.ts";

const fetchRandori = vi.fn();
const abandonRandoriRequest = vi.fn();
let pushSnapshot: (randori: RandoriView) => void = () => undefined;

vi.mock("../../../components/randori/randori-api.ts", () => ({ fetchRandori, abandonRandoriRequest }));
vi.mock("../../../lib/randoris/reader.ts", () => ({
  watchRandori: (_id: string, onChange: (randori: RandoriView) => void) => {
    pushSnapshot = onChange;
    return () => undefined;
  },
}));
vi.mock("../../../components/kata/kata-workspace.tsx", () => ({
  AttemptForm: ({ randoriId, closed }: { randoriId: string; closed: boolean }) => (
    <p data-testid="attempt-form">{`form for ${randoriId}${closed ? " (closed)" : ""}`}</p>
  ),
}));

const { RandoriSession } = await import("../../../components/randori/randori-session.tsx");

const now = Date.parse("2026-10-20T10:00:00.000Z");
const running: RandoriView = {
  id: "r1",
  kataId: "retail-cart",
  provider: "anthropic",
  status: "running",
  startedAt: "2026-10-20T09:58:00.000Z",
  deadline: "2026-10-20T10:08:00.000Z",
  bestPassed: 4,
  total: 12,
  attemptsCount: 1,
  bestElapsedMs: null,
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval", "setTimeout", "clearTimeout"] });
  vi.setSystemTime(now);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

async function renderSession(serverNow = "2026-10-20T10:00:00.000Z", randori = running) {
  fetchRandori.mockResolvedValue({ ok: true, randori, serverNow });
  render(<RandoriSession id="r1" />);
  await act(async () => undefined);
}

describe("RandoriSession (US7)", () => {
  it("shows the countdown on the server clock, the best score and the open form (CA7.2, CA7.7)", async () => {
    await renderSession("2026-10-20T10:01:00.000Z");
    expect(screen.getByTestId("countdown").textContent).toBe("7:00");
    expect(screen.getByText("Best score: 4 / 12 · 1 attempt")).toBeTruthy();
    expect(screen.getByTestId("attempt-form").textContent).toBe("form for r1");
  });

  it("closes submission when the time is up, before the server closes the randori (CA7.4)", async () => {
    await renderSession();
    await act(async () => {
      vi.advanceTimersByTime(8 * 60_000 + 1000);
    });
    expect(screen.getByTestId("countdown").textContent).toBe("0:00");
    expect(screen.getByText("Time is up. Best score: 4 / 12 after 1 attempt.")).toBeTruthy();
    expect(screen.getByTestId("attempt-form").textContent).toBe("form for r1 (closed)");
  });

  it("shows the success with the elapsed time and the number of attempts (CA7.3)", async () => {
    await renderSession();
    act(() => pushSnapshot({ ...running, status: "succeeded", bestPassed: 12, attemptsCount: 3, bestElapsedMs: 192_000 }));
    expect(screen.getByText("Solved in 3:12 with 3 attempts.")).toBeTruthy();
    expect(screen.queryByTestId("attempt-form")).toBeNull();
  });

  it("abandons on request and keeps the best score (CA7.8)", async () => {
    await renderSession();
    abandonRandoriRequest.mockResolvedValue({ ok: true, randori: { ...running, status: "abandoned" }, serverNow: "2026-10-20T10:00:05.000Z" });
    fireEvent.click(screen.getByRole("button", { name: "Abandon" }));
    await act(async () => undefined);
    expect(abandonRandoriRequest).toHaveBeenCalledWith("r1");
    act(() => pushSnapshot({ ...running, status: "abandoned" }));
    expect(screen.getByText("Randori abandoned. Best score: 4 / 12 after 1 attempt.")).toBeTruthy();
  });

  it("shows the same message for a missing or forbidden randori (CA6.5)", async () => {
    fetchRandori.mockResolvedValue({ ok: false, error: "Randori not found." });
    render(<RandoriSession id="someone-else" />);
    await act(async () => undefined);
    expect(screen.getByText("Randori not found.")).toBeTruthy();
  });
});
