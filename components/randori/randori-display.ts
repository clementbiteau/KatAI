"use client";

import { useEffect, useState } from "react";
import type { RandoriView } from "../../lib/randoris/view.ts";

// How a randori is shown: the time left and, once over, its outcome.

// Time left before the deadline, on the server clock: the browser clock is corrected by
// the offset measured against the server's time (CA7.7). Never below zero.
export function remainingMs(deadline: string, offsetMs: number, browserNow: number): number {
  return Math.max(0, Date.parse(deadline) - (browserNow + offsetMs));
}

export function formatClock(milliseconds: number): string {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

// Re-renders every half second while the countdown runs.
export function useRemainingMs(deadline: string, offsetMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  const remaining = remainingMs(deadline, offsetMs, now);
  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [remaining]);
  return remaining;
}

// While running: the best score so far. Once over: how it ended (CA7.3, CA7.4, CA7.8).
export function describeRandori(randori: RandoriView, timeIsUp: boolean): { over: boolean; text: string } {
  const best = `${randori.bestPassed} / ${randori.total}`;
  const attempts = `${randori.attemptsCount} attempt${randori.attemptsCount === 1 ? "" : "s"}`;
  if (randori.status === "succeeded") return { over: true, text: `Solved in ${formatClock(randori.bestElapsedMs ?? 0)} with ${attempts}.` };
  if (randori.status === "abandoned") return { over: true, text: `Randori abandoned. Best score: ${best} after ${attempts}.` };
  if (randori.status === "timeout" || timeIsUp) return { over: true, text: `Time is up. Best score: ${best} after ${attempts}.` };
  return { over: false, text: `Best score: ${best} · ${attempts}` };
}
