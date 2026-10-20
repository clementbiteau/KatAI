import { beforeEach, describe, expect, it } from "vitest";
import { PATCH } from "../../../app/api/attempts/route.ts";
import { findKata } from "../../../katas/catalog.ts";
import { createAttempt, type NewAttempt } from "../../../lib/server/data/attempts.ts";
import { getAdminDb } from "../../../lib/server/firebase-admin.ts";
import { apiRequest, createUserToken, resetAuthAndCollection } from "../server/helpers.ts";

// Runs on the Auth and Firestore emulators (npm run test:emulator).
const kata = findKata("retail-cart")!;
const generatedAttempt: NewAttempt = {
  kataId: kata.id,
  randoriId: null,
  provider: "anthropic",
  model: "claude-opus-5-5",
  servedModel: "claude-opus-5-5",
  spec: "Sum the cart.",
  code: "function cartTotal() { return 0; }",
  status: "generated",
  errorCategory: null,
  httpStatus: null,
  truncated: false,
  latencyMs: 1000,
  inputTokens: 100,
  outputTokens: 200,
  result: null,
};
let alice: { uid: string; idToken: string };

function outcomes(passedCount: number) {
  return kata.tests.map((test, index) => ({ label: test.label, status: index < passedCount ? "passed" : "failed" }));
}

function reportResult(token: string | undefined, body: unknown) {
  return PATCH(apiRequest("/api/attempts", { method: "PATCH", token, body }));
}

beforeEach(async () => {
  await resetAuthAndCollection("attempts");
  alice = await createUserToken("alice@example.com");
});

describe("PATCH /api/attempts (sandbox result)", () => {
  it("records the score once and finishes the attempt (CA4.1)", async () => {
    const attempt = await createAttempt(alice.uid, generatedAttempt);
    const response = await reportResult(alice.idToken, { attemptId: attempt.id, outcomes: outcomes(9) });
    expect(response.status).toBe(200);
    expect((await response.json()).attempt).toMatchObject({ status: "done", result: { passed: 9, total: 12 } });
    const stored = await getAdminDb().doc(`attempts/${attempt.id}`).get();
    expect(stored.get("result.passed")).toBe(9);
    expect(stored.get("status")).toBe("done");
  });

  it("refuses a second result for the same attempt (S5)", async () => {
    const attempt = await createAttempt(alice.uid, generatedAttempt);
    await reportResult(alice.idToken, { attemptId: attempt.id, outcomes: outcomes(9) });
    const second = await reportResult(alice.idToken, { attemptId: attempt.id, outcomes: outcomes(12) });
    expect(second.status).toBe(409);
    expect((await getAdminDb().doc(`attempts/${attempt.id}`).get()).get("result.passed")).toBe(9);
  });

  it("refuses a result for an attempt in error", async () => {
    const attempt = await createAttempt(alice.uid, { ...generatedAttempt, status: "error", code: null, errorCategory: "timeout" });
    expect((await reportResult(alice.idToken, { attemptId: attempt.id, outcomes: outcomes(12) })).status).toBe(409);
  });

  it("answers 404 for another user's attempt or an unknown one, the same way (CA6.5)", async () => {
    const bob = await createUserToken("bob@example.com");
    const bobAttempt = await createAttempt(bob.uid, generatedAttempt);
    const forOthers = await reportResult(alice.idToken, { attemptId: bobAttempt.id, outcomes: outcomes(12) });
    const unknown = await reportResult(alice.idToken, { attemptId: "does-not-exist", outcomes: outcomes(12) });
    expect([forOthers.status, unknown.status]).toEqual([404, 404]);
    expect(await forOthers.json()).toEqual(await unknown.json());
    expect((await getAdminDb().doc(`attempts/${bobAttempt.id}`).get()).get("result")).toBeNull();
  });

  it.each([
    ["missing outcomes", undefined],
    ["too few outcomes", outcomes(12).slice(1)],
    ["unexpected label", [{ label: "Forged", status: "passed" }, ...outcomes(12).slice(1)]],
    ["unknown status", outcomes(12).map((outcome) => ({ ...outcome, status: "won" }))],
  ])("refuses a malformed result: %s", async (_name, malformedOutcomes) => {
    const attempt = await createAttempt(alice.uid, generatedAttempt);
    expect((await reportResult(alice.idToken, { attemptId: attempt.id, outcomes: malformedOutcomes })).status).toBe(400);
  });

  it("answers 401 without a valid token (S6)", async () => {
    expect((await reportResult(undefined, {})).status).toBe(401);
  });
});
