import "server-only";
import { getAdminDb } from "../firebase-admin.ts";

const WINDOW_MS = 60_000;
const MAX_SUBMISSIONS_PER_WINDOW = 5;

export type Reservation = { allowed: true } | { allowed: false; retryAfterSeconds: number };

// Sliding window of 5 submissions per minute and per user (CA4.11). A Firestore
// transaction keeps the count exact even when requests arrive in parallel.
export async function reserveSubmission(uid: string, now: number = Date.now()): Promise<Reservation> {
  const document = getAdminDb().doc(`usage/${uid}`);
  // More attempts than the default 5: parallel submissions from one user contend on one document.
  return getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(document);
    const recent = ((snapshot.get("recentSubmissions") as number[] | undefined) ?? []).filter(
      (submittedAt) => submittedAt > now - WINDOW_MS,
    );
    if (recent.length >= MAX_SUBMISSIONS_PER_WINDOW) {
      const oldest = Math.min(...recent);
      return { allowed: false, retryAfterSeconds: Math.ceil((oldest + WINDOW_MS - now) / 1000) };
    }
    transaction.set(document, { recentSubmissions: [...recent, now] });
    return { allowed: true };
  }, { maxAttempts: 10 });
}
