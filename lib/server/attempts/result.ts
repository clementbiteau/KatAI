import "server-only";
import type { AttemptResult, AttemptView } from "../../attempts/view.ts";
import { findKata } from "../../../katas/catalog.ts";
import { getAdminDb } from "../firebase-admin.ts";
import { saveAttemptResult } from "../data/attempts.ts";
import { recordRandoriResult } from "../data/randori-progress.ts";

const STATUSES = new Set(["passed", "failed", "timeout"]);

export type ResultOutcome = { ok: true; attempt: AttemptView } | { ok: false; status: number; error: string };

// The outcomes must list the kata's tests in order, with a known status each. The score is
// computed here; it stays falsifiable by the client until the server sandbox (tranche 2).
function toAttemptResult(kataId: string, outcomes: unknown): AttemptResult | null {
  const kata = findKata(kataId);
  if (!kata || !Array.isArray(outcomes) || outcomes.length !== kata.tests.length) return null;
  const tests = outcomes.map((outcome, index) => {
    const { label, status } = (outcome ?? {}) as { label?: unknown; status?: unknown };
    const valid = label === kata.tests[index]?.label && typeof status === "string" && STATUSES.has(status);
    return valid ? { label: label as string, status: status as AttemptResult["tests"][number]["status"] } : null;
  });
  if (tests.some((test) => test === null)) return null;
  const checked = tests as AttemptResult["tests"];
  return { passed: checked.filter((test) => test.status === "passed").length, total: checked.length, tests: checked };
}

// Records the sandbox result of the caller's attempt, once (S5). Another user's attempt
// and an unknown one get the same answer, so existence is never revealed (CA6.5).
export async function recordAttemptResult(uid: string, body: unknown): Promise<ResultOutcome> {
  const notFound: ResultOutcome = { ok: false, status: 404, error: "Attempt not found." };
  const { attemptId, outcomes } = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  if (typeof attemptId !== "string" || attemptId.length === 0 || attemptId.includes("/")) return notFound;
  const snapshot = await getAdminDb().doc(`attempts/${attemptId}`).get();
  if (!snapshot.exists || snapshot.get("uid") !== uid) return notFound;
  const result = toAttemptResult(snapshot.get("kataId"), outcomes);
  if (!result) return { ok: false, status: 400, error: "Invalid result." };
  const saved = await saveAttemptResult(uid, attemptId, result);
  if ("attempt" in saved) {
    if (saved.attempt.randoriId) await recordRandoriResult(saved.attempt.randoriId, saved.attempt);
    return { ok: true, attempt: saved.attempt };
  }
  return saved.error === "not-found" ? notFound : { ok: false, status: 409, error: "This attempt already has a result." };
}
