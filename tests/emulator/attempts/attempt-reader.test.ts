import { beforeEach, describe, expect, it } from "vitest";
import type { AttemptView } from "../../../lib/attempts/view.ts";
import { readAttempt, watchKataAttempts } from "../../../lib/attempts/reader.ts";
import { signOutUser, signUp } from "../../../lib/auth/service.ts";
import { getClientAuth } from "../../../lib/firebase/client.ts";
import { createAttempt, type NewAttempt } from "../../../lib/server/data/attempts.ts";
import { resetAuthAndCollection } from "../server/helpers.ts";

// Runs on the emulators with the browser SDK, so the real Firestore rules apply.
const base: NewAttempt = {
  kataId: "retail-cart",
  randoriId: null,
  provider: "anthropic",
  model: "claude-opus-5-5",
  servedModel: "claude-opus-5-5",
  spec: "Sum the cart.",
  code: "function cartTotal() { return 0; }",
  status: "done",
  errorCategory: null,
  httpStatus: null,
  truncated: false,
  latencyMs: 1000,
  inputTokens: 100,
  outputTokens: 200,
  result: { passed: 4, total: 12, tests: [] },
};

async function signInAs(email: string): Promise<string> {
  await signOutUser();
  await signUp(email, "correct-horse");
  return getClientAuth()!.currentUser!.uid;
}

function firstSnapshot(uid: string, kataId: string): Promise<AttemptView[]> {
  return new Promise((resolve, reject) => {
    const stop = watchKataAttempts(uid, kataId, (attempts) => {
      stop();
      resolve(attempts);
    }, reject);
  });
}

beforeEach(() => resetAuthAndCollection("attempts"));

describe("attempt reader (client SDK under the Firestore rules)", () => {
  it("lists the user's attempts on one kata, most recent first (CA5.1)", async () => {
    const bobUid = await signInAs("bob@example.com");
    await createAttempt(bobUid, base);
    const aliceUid = await signInAs("alice@example.com");
    const first = await createAttempt(aliceUid, { ...base, spec: "First spec" });
    const second = await createAttempt(aliceUid, { ...base, spec: "Second spec" });
    await createAttempt(aliceUid, { ...base, kataId: "luxury-engraving" });

    const attempts = await firstSnapshot(aliceUid, "retail-cart");
    expect(attempts.map((attempt) => attempt.id)).toEqual([second.id, first.id]);
    expect(attempts[0]).toMatchObject({ spec: "Second spec", result: { passed: 4, total: 12 } });
  });

  it("reads the user's own attempt in full (CA5.3)", async () => {
    const aliceUid = await signInAs("alice@example.com");
    const attempt = await createAttempt(aliceUid, base);
    expect(await readAttempt(attempt.id)).toMatchObject({ id: attempt.id, spec: "Sum the cart.", code: base.code });
  });

  it("returns nothing for another user's attempt or an unknown one, the same way (S2, CA6.5)", async () => {
    const bobUid = await signInAs("bob@example.com");
    const bobAttempt = await createAttempt(bobUid, base);
    await signInAs("alice@example.com");
    expect(await readAttempt(bobAttempt.id)).toBeNull();
    expect(await readAttempt("does-not-exist")).toBeNull();
  });
});
