import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Generation } from "../../../lib/server/providers/types.ts";
import { apiRequest, createUserToken, resetAuthAndCollection } from "./helpers.ts";

// Runs on the Auth and Firestore emulators. The provider adapter is replaced by a
// stub: it is tested on its own (tests/providers); here we test the route around it.
const generateCode = vi.fn<(...args: unknown[]) => Promise<Generation>>();
vi.mock("../../../lib/server/providers/generate.ts", () => ({ generateCode }));

const { POST: saveKey } = await import("../../../app/api/keys/route.ts");
const { POST: submit } = await import("../../../app/api/attempts/route.ts");
const { getAdminDb } = await import("../../../lib/server/firebase-admin.ts");

const userKey = "sk-ant-user-" + "u".repeat(40);
const generated: Generation = {
  ok: true,
  code: "function cartTotal(lines) { return 0; }",
  truncated: false,
  servedModel: "claude-opus-5-5",
  latencyMs: 1200,
  inputTokens: 300,
  outputTokens: 400,
};
let alice: { uid: string; idToken: string };

function submission(overrides: Record<string, unknown> = {}) {
  const body = { kataId: "retail-cart", provider: "anthropic", model: "claude-opus-5-5", spec: "Sum the cart.", ...overrides };
  return submit(apiRequest("/api/attempts", { method: "POST", token: alice.idToken, body }));
}

async function attemptsOf(uid: string) {
  return (await getAdminDb().collection("attempts").where("uid", "==", uid).get()).docs.map((doc) => doc.data());
}

beforeEach(async () => {
  vi.stubEnv("KEY_ENCRYPTION_KEY", randomBytes(32).toString("base64"));
  for (const collection of ["providerKeys", "usage", "attempts"]) await resetAuthAndCollection(collection);
  alice = await createUserToken("alice@example.com");
  generateCode.mockReset().mockResolvedValue(generated);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

async function saveAliceKey() {
  await saveKey(apiRequest("/api/keys", { method: "POST", token: alice.idToken, body: { provider: "anthropic", key: userKey } }));
}

describe("POST /api/attempts", () => {
  it("answers 401 without a valid token (S6)", async () => {
    const response = await submit(apiRequest("/api/attempts", { method: "POST", body: {} }));
    expect(response.status).toBe(401);
  });

  it.each([
    [{ kataId: "unknown-kata" }, "Unknown kata."],
    [{ provider: "openai" }, "Unknown provider."],
    [{ model: "claude-fable-5-1" }, "This model is not available."],
    [{ spec: "   " }, "Write a specification first."],
    [{ spec: "x".repeat(4001) }, "Your specification is longer than 4000 characters."],
  ])("refuses an invalid submission without calling the model (CA4.4): %j", async (overrides, message) => {
    await saveAliceKey();
    const response = await submission(overrides);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: message });
    expect(generateCode).not.toHaveBeenCalled();
  });

  it("refuses when no key is configured, without calling the model or saving anything (CA4.3)", async () => {
    const response = await submission();
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "missing-key" });
    expect(generateCode).not.toHaveBeenCalled();
    expect(await attemptsOf(alice.uid)).toEqual([]);
  });

  it("calls the model with the decrypted key, the spec and the signature only, then saves the attempt (CA4.1, H2)", async () => {
    await saveAliceKey();
    const response = await submission();
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).not.toContain(userKey);

    expect(generateCode).toHaveBeenCalledTimes(1);
    const [provider, key, request] = generateCode.mock.calls[0]!;
    expect([provider, key]).toEqual(["anthropic", userKey]);
    expect(request).toEqual({
      model: "claude-opus-5-5",
      spec: "Sum the cart.",
      functionName: "cartTotal",
      signature: "cartTotal(lines: { sku: string; unitPriceCents: number; quantity: number }[]): number",
    });

    const { attempt } = JSON.parse(text);
    expect(attempt).toMatchObject({ kataId: "retail-cart", status: "generated", code: generated.code, servedModel: "claude-opus-5-5", inputTokens: 300, outputTokens: 400, result: null });
    const [stored] = await attemptsOf(alice.uid);
    expect(stored).toMatchObject({ uid: alice.uid, kataId: "retail-cart", randoriId: null, spec: "Sum the cart.", status: "generated", latencyMs: 1200 });
  });

  it("saves a provider failure as an attempt in error, with its category (CA4.5, CA4.6)", async () => {
    await saveAliceKey();
    generateCode.mockResolvedValue({ ok: false, category: "key-refused", latencyMs: 200, httpStatus: 401, providerErrorType: "authentication_error" });
    const response = await submission();
    expect(response.status).toBe(200);
    expect((await response.json()).attempt).toMatchObject({ status: "error", errorCategory: "key-refused", code: null, result: null });
    expect(generateCode).toHaveBeenCalledTimes(1);
    expect((await attemptsOf(alice.uid))[0]).toMatchObject({ status: "error", errorCategory: "key-refused", httpStatus: 401 });
  });

  it("finishes an answer without code at 0 out of 12, with every test failed (CA4.7, CA4.13)", async () => {
    await saveAliceKey();
    generateCode.mockResolvedValue({ ...generated, code: null, truncated: true });
    const { attempt } = await (await submission()).json();
    expect(attempt).toMatchObject({ status: "done", code: null, truncated: true });
    expect(attempt.result.passed).toBe(0);
    expect(attempt.result.total).toBe(12);
    expect(attempt.result.tests.every((test: { status: string }) => test.status === "failed")).toBe(true);
  });

  it("refuses a sixth submission within a minute, without calling the model or saving it (CA4.11)", async () => {
    await saveAliceKey();
    for (let index = 0; index < 5; index += 1) expect((await submission()).status).toBe(200);
    const response = await submission();
    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({ code: "rate-limited", retryAfterSeconds: expect.any(Number) });
    expect(generateCode).toHaveBeenCalledTimes(5);
    expect(await attemptsOf(alice.uid)).toHaveLength(5);
  });

  it("re-encrypts a key saved with the previous master key, after using it (ADR 0004)", async () => {
    const oldMasterKey = randomBytes(32).toString("base64");
    vi.stubEnv("KEY_ENCRYPTION_KEY", oldMasterKey);
    await saveAliceKey();
    vi.stubEnv("KEY_ENCRYPTION_KEY", randomBytes(32).toString("base64"));
    vi.stubEnv("KEY_ENCRYPTION_KEY_VERSION", "2");
    vi.stubEnv("KEY_ENCRYPTION_KEY_PREVIOUS", oldMasterKey);
    expect((await submission()).status).toBe(200);
    expect(generateCode.mock.calls[0]![1]).toBe(userKey);
    const stored = await getAdminDb().doc(`providerKeys/${alice.uid}_anthropic`).get();
    expect(stored.get("keyVersion")).toBe(2);
  });

  it("never writes the key to the logs (S8)", async () => {
    const logged: string[] = [];
    for (const level of ["log", "info", "warn", "error", "debug"] as const) {
      vi.spyOn(console, level).mockImplementation((...args: unknown[]) => logged.push(args.map(String).join(" ")));
    }
    await saveAliceKey();
    await submission();
    generateCode.mockResolvedValue({ ok: false, category: "provider-unavailable", latencyMs: 10 });
    await submission();
    expect(logged.join("\n")).not.toContain(userKey);
  });
});
