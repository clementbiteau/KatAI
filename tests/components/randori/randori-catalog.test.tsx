// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthState } from "../../../components/auth/auth-context.tsx";
import type { RandoriView } from "../../../lib/randoris/view.ts";

let authState: AuthState = { status: "signed-out" };
let kataRandoris: RandoriView[] = [];
const push = vi.fn();
const startRandoriRequest = vi.fn();

vi.mock("../../../components/auth/auth-context.tsx", () => ({ useAuthState: () => authState }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("../../../components/randori/randori-api.ts", () => ({ startRandoriRequest }));
vi.mock("../../../lib/randoris/reader.ts", () => ({
  watchKataRandoris: (_uid: string, kataId: string, onChange: (randoris: RandoriView[]) => void) => {
    onChange(kataRandoris.filter((randori) => randori.kataId === kataId));
    return vi.fn();
  },
}));

const { RandoriCatalog } = await import("../../../components/randori/randori-catalog.tsx");
const signedIn: AuthState = { status: "signed-in", user: { uid: "alice", email: "ada@example.com" } };

function randori(overrides: Partial<RandoriView>): RandoriView {
  return {
    id: "r1",
    kataId: "retail-cart",
    provider: "anthropic",
    status: "succeeded",
    startedAt: "2026-10-20T09:00:00.000Z",
    deadline: "2026-10-20T09:10:00.000Z",
    bestPassed: 12,
    total: 12,
    attemptsCount: 3,
    bestElapsedMs: 192_000,
    ...overrides,
  };
}

function cardOf(title: string) {
  return screen.getByRole("heading", { name: title }).closest("li")!;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  kataRandoris = [];
});

describe("RandoriCatalog", () => {
  it("shows each kata with its time limit, and asks visitors to sign in", () => {
    authState = { status: "signed-out" };
    render(<RandoriCatalog />);
    expect(within(cardOf("Autumn campaign cart")).getByText("Easy · 10 minutes")).toBeTruthy();
    expect(within(cardOf("Transfer guard")).getByText("Hard · 20 minutes")).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Sign in to start a randori" })[0]!.getAttribute("href")).toBe("/login?next=%2Frandori");
  });

  it("starts a randori and opens it (CA7.1)", async () => {
    authState = signedIn;
    startRandoriRequest.mockResolvedValue({ ok: true, randori: randori({ id: "new", status: "running" }), serverNow: "2026-10-20T10:00:00.000Z" });
    render(<RandoriCatalog />);
    fireEvent.click(within(cardOf("Autumn campaign cart")).getByRole("button", { name: "Start randori" }));
    await act(async () => undefined);
    expect(startRandoriRequest).toHaveBeenCalledWith("retail-cart");
    expect(push).toHaveBeenCalledWith("/randori/new");
  });

  it("points to the running randori instead of starting another (CA7.9)", async () => {
    authState = signedIn;
    startRandoriRequest.mockResolvedValue({ ok: false, error: "Another randori is still running.", code: "randori-in-progress", randoriId: "running-one" });
    render(<RandoriCatalog />);
    fireEvent.click(within(cardOf("Engraving request")).getByRole("button", { name: "Start randori" }));
    await act(async () => undefined);
    expect(screen.getByRole("link", { name: "Resume your running randori" }).getAttribute("href")).toBe("/randori/running-one");
    expect(push).not.toHaveBeenCalled();
  });

  it("sends to Settings when no key is saved, without starting the clock (CA7.10)", async () => {
    authState = signedIn;
    startRandoriRequest.mockResolvedValue({ ok: false, error: "Add your Anthropic API key in Settings first.", code: "missing-key" });
    render(<RandoriCatalog />);
    fireEvent.click(within(cardOf("Autumn campaign cart")).getByRole("button", { name: "Start randori" }));
    await act(async () => undefined);
    expect(screen.getByRole("link", { name: "Open Settings" }).getAttribute("href")).toBe("/settings");
  });

  it("lists past randoris per kata, most recent first, with status, best score, time and attempts (CA7.11)", () => {
    authState = signedIn;
    kataRandoris = [
      randori({ id: "late", startedAt: "2026-10-20T11:00:00.000Z", status: "timeout", bestPassed: 9, bestElapsedMs: null, attemptsCount: 4 }),
      randori({ id: "early" }),
    ];
    render(<RandoriCatalog />);
    const rows = within(cardOf("Autumn campaign cart")).getAllByRole("row").slice(1);
    expect(rows.map((row) => Array.from(row.querySelectorAll("td")).slice(1, 5).map((cell) => cell.textContent))).toEqual([
      ["Time is up", "9 / 12", "—", "4"],
      ["Solved", "12 / 12", "3:12", "3"],
    ]);
  });
});
