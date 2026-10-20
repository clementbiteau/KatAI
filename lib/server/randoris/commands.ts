import "server-only";
import { findKata, randoriMinutes } from "../../../katas/catalog.ts";
import type { Kata } from "../../../katas/types.ts";
import { isProvider, type Provider } from "../../providers.ts";
import { effectiveRandoriStatus, type RandoriView } from "../../randoris/view.ts";
import { readProviderKey } from "../data/provider-keys.ts";
import { abandonRandoriRecord, readRandoriRecord, startRandoriRecord } from "../data/randoris.ts";

export type RandoriOutcome =
  | { ok: true; randori: RandoriView; serverNow: string }
  | { ok: false; status: number; error: string; code?: string; randoriId?: string };

// Every answer carries the server time, so the client can correct its own clock (CA7.7).
function withClock(randori: RandoriView, now: number): RandoriOutcome {
  return { ok: true, randori: { ...randori, status: effectiveRandoriStatus(randori, now) }, serverNow: new Date(now).toISOString() };
}

export function parseRandoriStart(body: unknown): { kata: Kata; provider: Provider } | { error: string } {
  const { kataId, provider } = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const kata = typeof kataId === "string" ? findKata(kataId) : undefined;
  if (!kata) return { error: "Unknown kata." };
  return isProvider(provider) ? { kata, provider } : { error: "Unknown provider." };
}

// Starts a randori on the server clock (CA7.1), if a key exists (CA7.10) and no
// other randori is running (CA7.9).
export async function startRandori(uid: string, { kata, provider }: { kata: Kata; provider: Provider }, now: number): Promise<RandoriOutcome> {
  if (!(await readProviderKey(uid, provider))) {
    return { ok: false, status: 409, code: "missing-key", error: "Add your Anthropic API key in Settings first." };
  }
  const durationMs = randoriMinutes(kata.level) * 60_000;
  const started = await startRandoriRecord(uid, { kataId: kata.id, provider, total: kata.tests.length, durationMs }, now);
  if ("runningId" in started) {
    return { ok: false, status: 409, code: "randori-in-progress", randoriId: started.runningId, error: "Another randori is still running." };
  }
  return withClock(started.randori, now);
}

export async function abandonRandori(uid: string, body: unknown, now: number): Promise<RandoriOutcome> {
  const { randoriId } = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const abandoned = await abandonRandoriRecord(uid, typeof randoriId === "string" ? randoriId : "", now);
  if (abandoned === "not-found") return { ok: false, status: 404, error: "Randori not found." };
  if (abandoned === "not-running") return { ok: false, status: 409, error: "This randori is already over." };
  return withClock(abandoned, now);
}

// Another user's randori and a missing one get the same answer.
export async function readRandoriWithClock(uid: string, randoriId: string, now: number): Promise<RandoriOutcome> {
  const randori = await readRandoriRecord(uid, randoriId);
  return randori ? withClock(randori, now) : { ok: false, status: 404, error: "Randori not found." };
}
