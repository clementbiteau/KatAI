import { beforeEach, describe, expect, it } from "vitest";
import { GET, PATCH, POST } from "../../../app/api/randoris/route.ts";
import { abandonRandori, readRandoriWithClock, startRandori } from "../../../lib/server/randoris/commands.ts";
import { findKata } from "../../../katas/catalog.ts";
import { apiRequest } from "../server/helpers.ts";
import { MINUTE, resetRandoriData, userWithKey } from "./helpers.ts";

// Runs on the Auth and Firestore emulators. The clock is injected (ADR 0007).
const luxury = findKata("luxury-engraving")!;
const start = Date.parse("2026-10-20T10:00:00Z");

beforeEach(() => resetRandoriData());

describe("randori lifecycle", () => {
  it("starts a running randori whose deadline follows the kata level (CA7.1)", async () => {
    const alice = await userWithKey("alice@example.com");
    const outcome = await startRandori(alice.uid, { kata: luxury, provider: "anthropic" }, start);
    expect(outcome).toMatchObject({
      ok: true,
      serverNow: "2026-10-20T10:00:00.000Z",
      randori: { kataId: luxury.id, status: "running", deadline: "2026-10-20T10:15:00.000Z", bestPassed: 0, total: 12, attemptsCount: 0 },
    });
  });

  it("refuses to start without a key, and starts nothing (CA7.10)", async () => {
    const alice = await userWithKey("alice@example.com", false);
    expect(await startRandori(alice.uid, { kata: luxury, provider: "anthropic" }, start)).toMatchObject({ ok: false, status: 409, code: "missing-key" });
    expect(await startRandori(alice.uid, { kata: luxury, provider: "anthropic" }, start)).toMatchObject({ code: "missing-key" });
  });

  it("refuses a second randori while one is running, pointing to it (CA7.9, HR6)", async () => {
    const alice = await userWithKey("alice@example.com");
    const first = await startRandori(alice.uid, { kata: luxury, provider: "anthropic" }, start);
    const second = await startRandori(alice.uid, { kata: luxury, provider: "anthropic" }, start + MINUTE);
    expect(second).toMatchObject({ ok: false, status: 409, code: "randori-in-progress", randoriId: first.ok ? first.randori.id : "" });
  });

  it("closes an expired randori as timeout when a new one starts", async () => {
    const alice = await userWithKey("alice@example.com");
    const first = await startRandori(alice.uid, { kata: luxury, provider: "anthropic" }, start);
    const second = await startRandori(alice.uid, { kata: luxury, provider: "anthropic" }, start + 16 * MINUTE);
    expect(second).toMatchObject({ ok: true, randori: { status: "running" } });
    const closed = await readRandoriWithClock(alice.uid, first.ok ? first.randori.id : "", start + 16 * MINUTE);
    expect(closed).toMatchObject({ ok: true, randori: { status: "timeout" } });
  });

  it("abandons a running randori, keeping its best score (CA7.8)", async () => {
    const alice = await userWithKey("alice@example.com");
    const started = await startRandori(alice.uid, { kata: luxury, provider: "anthropic" }, start);
    const id = started.ok ? started.randori.id : "";
    expect(await abandonRandori(alice.uid, { randoriId: id }, start + MINUTE)).toMatchObject({ ok: true, randori: { status: "abandoned" } });
    expect(await abandonRandori(alice.uid, { randoriId: id }, start + 2 * MINUTE)).toMatchObject({ ok: false, status: 409 });
  });

  it("reads a randori with the server time, as running or as over once past its deadline (CA7.7)", async () => {
    const alice = await userWithKey("alice@example.com");
    const started = await startRandori(alice.uid, { kata: luxury, provider: "anthropic" }, start);
    const id = started.ok ? started.randori.id : "";
    expect(await readRandoriWithClock(alice.uid, id, start + 5 * MINUTE)).toMatchObject({
      ok: true,
      serverNow: "2026-10-20T10:05:00.000Z",
      randori: { status: "running" },
    });
    expect(await readRandoriWithClock(alice.uid, id, start + 15 * MINUTE)).toMatchObject({ ok: true, randori: { status: "timeout" } });
  });

  it("hides another user's randori, like a missing one (CA6.5, S9)", async () => {
    const alice = await userWithKey("alice@example.com");
    const bob = await userWithKey("bob@example.com");
    const started = await startRandori(alice.uid, { kata: luxury, provider: "anthropic" }, start);
    const id = started.ok ? started.randori.id : "";
    expect(await readRandoriWithClock(bob.uid, id, start)).toMatchObject({ ok: false, status: 404 });
    expect(await abandonRandori(bob.uid, { randoriId: id }, start)).toMatchObject({ ok: false, status: 404 });
  });
});

describe("/api/randoris routes", () => {
  it("require a valid token (S6)", async () => {
    for (const handler of [GET, POST, PATCH]) expect((await handler(apiRequest("/api/randoris?id=x", { method: "POST", body: {} }))).status).toBe(401);
  });

  it("start a randori and refuse an unknown kata", async () => {
    const alice = await userWithKey("alice@example.com");
    const started = await POST(apiRequest("/api/randoris", { method: "POST", token: alice.idToken, body: { kataId: luxury.id, provider: "anthropic" } }));
    expect(started.status).toBe(200);
    expect((await started.json()).randori).toMatchObject({ status: "running", kataId: luxury.id });
    const unknown = await POST(apiRequest("/api/randoris", { method: "POST", token: alice.idToken, body: { kataId: "nope", provider: "anthropic" } }));
    expect(unknown.status).toBe(400);
  });
});
