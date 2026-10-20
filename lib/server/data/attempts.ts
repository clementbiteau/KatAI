import "server-only";
import { FieldValue, type DocumentSnapshot, type Timestamp } from "firebase-admin/firestore";
import type { AttemptResult, AttemptStatus, AttemptView } from "../../attempts.ts";
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
  const data = snapshot.data() ?? {};
  return {
    id: snapshot.id,
    kataId: data.kataId,
    randoriId: data.randoriId,
    provider: data.provider,
    model: data.model,
    servedModel: data.servedModel,
    spec: data.spec,
    code: data.code,
    status: data.status,
    errorCategory: data.errorCategory,
    truncated: data.truncated,
    latencyMs: data.latencyMs,
    inputTokens: data.inputTokens,
    outputTokens: data.outputTokens,
    createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
    result: data.result,
  };
}

// Attempts are only ever written by the server (docs/adr/0003); the uid comes from the verified token.
export async function createAttempt(uid: string, attempt: NewAttempt): Promise<AttemptView> {
  const document = await getAdminDb()
    .collection("attempts")
    .add({ uid, ...attempt, createdAt: FieldValue.serverTimestamp() });
  return toAttemptView(await document.get());
}
