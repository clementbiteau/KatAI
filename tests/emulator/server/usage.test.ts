import { beforeEach, describe, expect, it } from "vitest";
import { reserveSubmission } from "../../../lib/server/data/usage.ts";
import { resetAuthAndCollection } from "./helpers.ts";

// Runs on the Firestore emulator (npm run test:emulator).
beforeEach(() => resetAuthAndCollection("usage"));

describe("reserveSubmission (CA4.11)", () => {
  it("allows 5 submissions within a minute, then refuses with the wait in seconds", async () => {
    const start = Date.parse("2026-10-20T10:00:00Z");
    for (let index = 0; index < 5; index += 1) {
      expect(await reserveSubmission("alice", start + index * 1000)).toEqual({ allowed: true });
    }
    expect(await reserveSubmission("alice", start + 10_000)).toEqual({ allowed: false, retryAfterSeconds: 50 });
  });

  it("frees a slot once the oldest submission is more than a minute old", async () => {
    const start = Date.parse("2026-10-20T10:00:00Z");
    for (let index = 0; index < 5; index += 1) await reserveSubmission("alice", start + index * 1000);
    expect(await reserveSubmission("alice", start + 60_001)).toEqual({ allowed: true });
  });

  it("counts each user separately", async () => {
    const start = Date.parse("2026-10-20T10:00:00Z");
    for (let index = 0; index < 5; index += 1) await reserveSubmission("alice", start);
    expect(await reserveSubmission("bob", start)).toEqual({ allowed: true });
  });

  // The emulator locks pessimistically: contending transactions can wait for seconds.
  // The assertion is about correctness (never more than 5), not speed.
  it("never lets parallel requests exceed the limit", { timeout: 30_000 }, async () => {
    const start = Date.parse("2026-10-20T10:00:00Z");
    const results = await Promise.all(Array.from({ length: 6 }, () => reserveSubmission("alice", start)));
    expect(results.filter((result) => result.allowed)).toHaveLength(5);
  });
});
