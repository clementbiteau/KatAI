import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, POST } from "../../../app/api/keys/route.ts";
import { getAdminDb } from "../../../lib/server/firebase-admin.ts";
import { decryptProviderKey, type EncryptedKey } from "../../../lib/server/key-encryption.ts";
import { apiRequest, createUserToken, resetAuthAndCollection } from "./helpers.ts";

// Runs on the Auth and Firestore emulators (npm run test:emulator).
const anthropicKey = "sk-ant-test-" + "a".repeat(40);
const replacementKey = "sk-ant-test-" + "b".repeat(40);
let alice: { uid: string; idToken: string };

async function storedKey(uid: string, provider: string) {
  return getAdminDb().doc(`providerKeys/${uid}_${provider}`).get();
}

beforeEach(async () => {
  vi.stubEnv("KEY_ENCRYPTION_KEY", randomBytes(32).toString("base64"));
  await resetAuthAndCollection("providerKeys");
  alice = await createUserToken("alice@example.com");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/keys", () => {
  it("encrypts and stores the key, then answers with its status only (CA2.1)", async () => {
    const response = await POST(apiRequest("/api/keys", { method: "POST", token: alice.idToken, body: { provider: "anthropic", key: anthropicKey } }));
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).not.toContain(anthropicKey);
    expect(JSON.parse(text)).toMatchObject({ provider: "anthropic", configured: true });

    const document = await storedKey(alice.uid, "anthropic");
    expect(JSON.stringify(document.data())).not.toContain(anthropicKey);
    expect(decryptProviderKey(document.data() as EncryptedKey, `${alice.uid}:anthropic`)).toBe(anthropicKey);
  });

  it("replaces an existing key for the same provider (CA2.3)", async () => {
    const save = (key: string) => POST(apiRequest("/api/keys", { method: "POST", token: alice.idToken, body: { provider: "anthropic", key } }));
    await save(anthropicKey);
    await save(replacementKey);
    const document = await storedKey(alice.uid, "anthropic");
    expect(decryptProviderKey(document.data() as EncryptedKey, `${alice.uid}:anthropic`)).toBe(replacementKey);
  });

  it.each([
    [{ provider: "anthropic", key: "too-short" }, "This does not look like an API key: it should be 20 to 300 characters long."],
    [{ provider: "anthropic", key: "sk-ant with spaces inside the key" }, "An API key cannot contain spaces."],
    [{ provider: "mistral", key: anthropicKey }, "Unknown provider."],
    ["not an object", "Invalid request."],
  ])("refuses an invalid request and stores nothing (CA2.5): %j", async (body, message) => {
    const response = await POST(apiRequest("/api/keys", { method: "POST", token: alice.idToken, body }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: message });
    expect((await getAdminDb().collection("providerKeys").get()).size).toBe(0);
  });

  it("refuses a request without a valid token and stores nothing (CA2.6)", async () => {
    const response = await POST(apiRequest("/api/keys", { method: "POST", token: "forged", body: { provider: "anthropic", key: anthropicKey } }));
    expect(response.status).toBe(401);
    expect((await getAdminDb().collection("providerKeys").get()).size).toBe(0);
  });

  it("never writes the key to the logs, even when the server is misconfigured (CA2.7, S8)", async () => {
    const logged: string[] = [];
    for (const level of ["log", "info", "warn", "error", "debug"] as const) {
      vi.spyOn(console, level).mockImplementation((...args: unknown[]) => logged.push(args.map(String).join(" ")));
    }
    await POST(apiRequest("/api/keys", { method: "POST", token: alice.idToken, body: { provider: "anthropic", key: anthropicKey } }));
    vi.stubEnv("KEY_ENCRYPTION_KEY", "");
    const misconfigured = await POST(apiRequest("/api/keys", { method: "POST", token: alice.idToken, body: { provider: "anthropic", key: replacementKey } }));
    expect(misconfigured.status).toBe(503);
    expect(logged.join("\n")).not.toContain(anthropicKey);
    expect(logged.join("\n")).not.toContain(replacementKey);
  });
});

describe("DELETE /api/keys", () => {
  it("deletes the caller's encrypted key and leaves other users' keys untouched (CA2.4)", async () => {
    const bob = await createUserToken("bob@example.com");
    for (const user of [alice, bob]) {
      await POST(apiRequest("/api/keys", { method: "POST", token: user.idToken, body: { provider: "anthropic", key: anthropicKey } }));
    }
    const response = await DELETE(apiRequest("/api/keys?provider=anthropic", { method: "DELETE", token: alice.idToken }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ provider: "anthropic", configured: false, updatedAt: null });
    expect((await storedKey(alice.uid, "anthropic")).exists).toBe(false);
    expect((await storedKey(bob.uid, "anthropic")).exists).toBe(true);
  });

  it("refuses an unknown provider and requests without a valid token", async () => {
    expect((await DELETE(apiRequest("/api/keys?provider=openai", { method: "DELETE", token: alice.idToken }))).status).toBe(400);
    expect((await DELETE(apiRequest("/api/keys?provider=anthropic", { method: "DELETE" }))).status).toBe(401);
  });
});
