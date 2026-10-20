import type { Provider } from "../providers.ts";

// A randori as the API and the client see it (docs/adr/0007).

export type RandoriStatus = "running" | "succeeded" | "timeout" | "abandoned";

export type RandoriView = {
  id: string;
  kataId: string;
  provider: Provider;
  status: RandoriStatus;
  startedAt: string;
  deadline: string;
  bestPassed: number;
  total: number;
  attemptsCount: number;
  bestElapsedMs: number | null;
};

export function randoriViewFromData(id: string, data: Record<string, unknown>, startedAt: string, deadline: string): RandoriView {
  return {
    id,
    kataId: data.kataId as string,
    provider: data.provider as Provider,
    status: data.status as RandoriStatus,
    startedAt,
    deadline,
    bestPassed: (data.bestPassed as number) ?? 0,
    total: (data.total as number) ?? 0,
    attemptsCount: (data.attemptsCount as number) ?? 0,
    bestElapsedMs: (data.bestElapsedMs as number | null) ?? null,
  };
}

// A running randori past its deadline is over, even before the server records it:
// closing is lazy, done at the next action (ADR 0007).
export function effectiveRandoriStatus(randori: RandoriView, now: number): RandoriStatus {
  return randori.status === "running" && now >= Date.parse(randori.deadline) ? "timeout" : randori.status;
}
