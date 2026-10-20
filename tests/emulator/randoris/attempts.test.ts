import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Generation } from "../../../lib/server/providers/types.ts";
import { MINUTE, resetRandoriData, userWithKey } from "./helpers.ts";

// Runs on the emulators, with the provider adapter stubbed as in the attempt tests.
const generateCode = vi.fn<(...args: unknown[]) => Promise<Generation>>();
vi.mock("../../../lib/server/providers/generate.ts", () => ({ generateCode }));

const { findKata } = await import("../../../katas/catalog.ts");
const { submitAttempt } = await import("../../../lib/server/attempts/submit.ts");
const { recordAttemptResult } = await import("../../../lib/server/attempts/result.ts");
const { readRandoriWithClock, startRandori } = await import("../../../lib/server/randoris/commands.ts");
const { getAdminDb } = await import("../../../lib/server/firebase-admin.ts");

const kata = findKata("retail-cart")!;
const generated: Generation = { ok: true, code: "function cartTotal() { return 0; }", truncated: false, servedModel: "claude-opus-5-5", latencyMs: 900, inputTokens: 10, outputTokens: 20 };

function outcomes(passedCount: number) {
  return kata.tests.map((test, index) => ({ label: test.label, status: index < passedCount ? "passed" : "failed" }));
}

async function randoriFor(uid: string) {
  const now = Date.now();
  const started = await startRandori(uid, { kata, provider: "anthropic" }, now);
  if (!started.ok) throw new Error("randori did not start");
  return { id: started.randori.id, now };
}

function submission(randoriId: string) {
  return { kata, provider: "anthropic" as const, model: "claude-opus-5-5", spec: "Sum the cart.", randoriId };
}

beforeEach(async () => {
  await resetRandoriData();
  generateCode.mockReset().mockResolvedValue(generated);
});

describe("attempts inside a randori", () => {
  it("links an attempt submitted before the deadline and counts it (CA7.2)", async () => {
    const alice = await userWithKey("alice@example.com");
    const randori = await randoriFor(alice.uid);
    const outcome = await submitAttempt(alice.uid, submission(randori.id), randori.now + MINUTE);
    expect(outcome).toMatchObject({ ok: true, attempt: { randoriId: randori.id } });
    expect(await readRandoriWithClock(alice.uid, randori.id, randori.now + MINUTE)).toMatchObject({ randori: { attemptsCount: 1 } });
  });

  it("refuses a submission arriving after the deadline, without calling the model (CA7.5)", async () => {
    const alice = await userWithKey("alice@example.com");
    const randori = await randoriFor(alice.uid);
    const outcome = await submitAttempt(alice.uid, submission(randori.id), randori.now + 10 * MINUTE);
    expect(outcome).toMatchObject({ ok: false, status: 409, code: "randori-over" });
    expect(generateCode).not.toHaveBeenCalled();
    expect((await getAdminDb().collection("attempts").get()).size).toBe(0);
  });

  it("refuses another user's randori and a randori on another kata", async () => {
    const alice = await userWithKey("alice@example.com");
    const bob = await userWithKey("bob@example.com");
    const bobRandori = await randoriFor(bob.uid);
    expect(await submitAttempt(alice.uid, submission(bobRandori.id), bobRandori.now)).toMatchObject({ ok: false, status: 404 });
    const engraving = findKata("luxury-engraving")!;
    const aliceRandori = await randoriFor(alice.uid);
    expect(await submitAttempt(alice.uid, { ...submission(aliceRandori.id), kata: engraving }, aliceRandori.now)).toMatchObject({ ok: false, status: 400 });
    expect(generateCode).not.toHaveBeenCalled();
  });

  it("keeps the best score, and succeeds at the first perfect score with the elapsed time (CA7.3)", async () => {
    const alice = await userWithKey("alice@example.com");
    const randori = await randoriFor(alice.uid);
    for (const passed of [7, 4]) {
      const submitted = await submitAttempt(alice.uid, submission(randori.id), Date.now());
      await recordAttemptResult(alice.uid, { attemptId: submitted.ok ? submitted.attempt.id : "", outcomes: outcomes(passed) });
    }
    expect(await readRandoriWithClock(alice.uid, randori.id, Date.now())).toMatchObject({ randori: { status: "running", bestPassed: 7, attemptsCount: 2 } });

    const perfect = await submitAttempt(alice.uid, submission(randori.id), Date.now());
    await recordAttemptResult(alice.uid, { attemptId: perfect.ok ? perfect.attempt.id : "", outcomes: outcomes(12) });
    const { randori: finished } = (await readRandoriWithClock(alice.uid, randori.id, Date.now())) as { randori: { status: string; bestPassed: number; bestElapsedMs: number } };
    expect(finished).toMatchObject({ status: "succeeded", bestPassed: 12 });
    expect(finished.bestElapsedMs).toBeGreaterThanOrEqual(0);
    expect(finished.bestElapsedMs).toBeLessThan(MINUTE);
  });

  it("counts a result arriving after the deadline for an attempt submitted before it (CA7.6)", async () => {
    const alice = await userWithKey("alice@example.com");
    const randori = await randoriFor(alice.uid);
    const submitted = await submitAttempt(alice.uid, submission(randori.id), Date.now());
    await getAdminDb().doc(`randoris/${randori.id}`).update({ deadline: new Date(Date.now() + 50) });
    await new Promise((resolve) => setTimeout(resolve, 100));
    await recordAttemptResult(alice.uid, { attemptId: submitted.ok ? submitted.attempt.id : "", outcomes: outcomes(12) });
    expect(await readRandoriWithClock(alice.uid, randori.id, Date.now())).toMatchObject({ randori: { status: "succeeded", bestPassed: 12 } });
  });
});
