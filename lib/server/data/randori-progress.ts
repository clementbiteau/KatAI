import "server-only";
import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import type { AttemptView } from "../../attempts/view.ts";
import { getAdminDb } from "../firebase-admin.ts";
import { readRandoriRecord } from "./randoris.ts";

export type RandoriRefusal = { status: number; code: string; error: string };

// A submission may join a randori only if the randori is the caller's, on the same kata,
// still running, and the request arrives before the deadline (CA7.5).
export async function checkRandoriOpen(uid: string, randoriId: string, kataId: string, now: number): Promise<RandoriRefusal | null> {
  const randori = await readRandoriRecord(uid, randoriId);
  if (!randori) return { status: 404, code: "randori-not-found", error: "Randori not found." };
  if (randori.kataId !== kataId) return { status: 400, code: "randori-kata-mismatch", error: "This randori is on another kata." };
  if (randori.status !== "running" || now >= Date.parse(randori.deadline)) {
    return { status: 409, code: "randori-over", error: "This randori is over." };
  }
  return null;
}

export async function countRandoriAttempt(randoriId: string): Promise<void> {
  await getAdminDb().doc(`randoris/${randoriId}`).update({ attemptsCount: FieldValue.increment(1) });
}

// Updates the best score with the result of an attempt submitted before the deadline,
// even if the result arrives after it (CA7.6). The first perfect score ends the randori
// as a success, timed from its start to that attempt's submission (CA7.3).
export async function recordRandoriResult(randoriId: string, attempt: AttemptView): Promise<void> {
  const document = getAdminDb().doc(`randoris/${randoriId}`);
  await getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(document);
    const result = attempt.result;
    if (!snapshot.exists || !result) return;
    const submittedAt = Date.parse(attempt.createdAt);
    if (submittedAt >= (snapshot.get("deadline") as Timestamp).toMillis()) return;
    const update: Record<string, unknown> = { bestPassed: Math.max(snapshot.get("bestPassed") as number, result.passed) };
    const stillOpen = ["running", "timeout"].includes(snapshot.get("status") as string);
    if (stillOpen && result.passed === result.total) {
      update.status = "succeeded";
      update.bestElapsedMs = submittedAt - (snapshot.get("startedAt") as Timestamp).toMillis();
    }
    transaction.update(document, update);
  });
}
