import "server-only";
import { FieldValue, type DocumentSnapshot, type Timestamp } from "firebase-admin/firestore";
import { attemptViewFromData, type AttemptResult, type AttemptStatus, type AttemptView } from "../../attempts/view.ts";
import type { Provider } from "../../providers.ts";
import { getAdminDb } from "../firebase-admin.ts";

export type NewAttempt = {
  kataId: string;
  randoriId: string | null;
  provider: Provider;
  model: string;
  servedModel: string | null;
  spec: string;
  code: string | null;
  status: AttemptStatus;
  errorCategory: string | null;
  httpStatus: number | null;
  truncated: boolean;
  latencyMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  result: AttemptResult | null;
};

function toAttemptView(snapshot: DocumentSnapshot): AttemptView {
  const createdAt = (snapshot.get("createdAt") as Timestamp).toDate().toISOString();
  return attemptViewFromData(snapshot.id, snapshot.data() ?? {}, createdAt);
}

// Attempts are only ever written by the server (docs/adr/0003); the uid comes from the verified token.
export async function createAttempt(uid: string, attempt: NewAttempt): Promise<AttemptView> {
  const document = await getAdminDb()
    .collection("attempts")
    .add({ uid, ...attempt, createdAt: FieldValue.serverTimestamp() });
  return toAttemptView(await document.get());
}

// Records the sandbox result exactly once (S5), in a transaction so two concurrent
// reports cannot both succeed. Another user's attempt counts as not found.
export async function saveAttemptResult(
  uid: string,
  attemptId: string,
  result: AttemptResult,
): Promise<{ attempt: AttemptView } | { error: "not-found" | "already-finished" }> {
  const document = getAdminDb().doc(`attempts/${attemptId}`);
  const outcome = await getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(document);
    if (!snapshot.exists || snapshot.get("uid") !== uid) return "not-found" as const;
    if (snapshot.get("status") !== "generated" || snapshot.get("result") !== null) return "already-finished" as const;
    transaction.update(document, { status: "done", result });
    return "saved" as const;
  });
  return outcome === "saved" ? { attempt: toAttemptView(await document.get()) } : { error: outcome };
}
