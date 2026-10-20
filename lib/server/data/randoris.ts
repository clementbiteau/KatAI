import "server-only";
import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import type { Provider } from "../../providers.ts";
import { randoriViewFromData, type RandoriView } from "../../randoris/view.ts";
import { getAdminDb } from "../firebase-admin.ts";

// Randori records (docs/adr/0007). Only the server writes them (S9); times come from
// the server clock, injected as `now` so that tests can control it.

export function toRandoriView(snapshot: DocumentSnapshot): RandoriView {
  const iso = (field: string) => (snapshot.get(field) as Timestamp).toDate().toISOString();
  return randoriViewFromData(snapshot.id, snapshot.data() ?? {}, iso("startedAt"), iso("deadline"));
}

// Starts a randori unless one is still running (HR6). Running randoris past their
// deadline are closed as timeout first: closing is lazy, done at the next action.
export async function startRandoriRecord(
  uid: string,
  start: { kataId: string; provider: Provider; total: number; durationMs: number },
  now: number,
): Promise<{ randori: RandoriView } | { runningId: string }> {
  const db = getAdminDb();
  const created = db.collection("randoris").doc();
  const runningId = await db.runTransaction(async (transaction) => {
    const running = await transaction.get(db.collection("randoris").where("uid", "==", uid).where("status", "==", "running"));
    const active = running.docs.find((document) => (document.get("deadline") as Timestamp).toMillis() > now);
    if (active) return active.id;
    for (const expired of running.docs) transaction.update(expired.ref, { status: "timeout" });
    transaction.create(created, {
      uid,
      kataId: start.kataId,
      provider: start.provider,
      status: "running",
      startedAt: Timestamp.fromMillis(now),
      deadline: Timestamp.fromMillis(now + start.durationMs),
      bestPassed: 0,
      total: start.total,
      attemptsCount: 0,
      bestElapsedMs: null,
    });
    return null;
  });
  return runningId ? { runningId } : { randori: toRandoriView(await created.get()) };
}

// The caller's randori, or null when it is missing or someone else's.
export async function readRandoriRecord(uid: string, randoriId: string): Promise<RandoriView | null> {
  if (!randoriId || randoriId.includes("/")) return null;
  const snapshot = await getAdminDb().doc(`randoris/${randoriId}`).get();
  return snapshot.exists && snapshot.get("uid") === uid ? toRandoriView(snapshot) : null;
}

// Abandons a running randori; its best score is kept (CA7.8).
export async function abandonRandoriRecord(uid: string, randoriId: string, now: number): Promise<RandoriView | "not-found" | "not-running"> {
  const randori = await readRandoriRecord(uid, randoriId);
  if (!randori) return "not-found";
  if (randori.status !== "running" || now >= Date.parse(randori.deadline)) return "not-running";
  const document = getAdminDb().doc(`randoris/${randoriId}`);
  await document.update({ status: "abandoned" });
  return toRandoriView(await document.get());
}
