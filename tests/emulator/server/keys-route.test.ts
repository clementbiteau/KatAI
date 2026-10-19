import { beforeEach, describe, expect, it } from "vitest";
import { GET } from "../../../app/api/keys/route.ts";
import { getAdminDb } from "../../../lib/server/firebase-admin.ts";

// Runs on the Auth and Firestore emulators (npm run test:emulator).
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";

async function createUserToken(email: string): Promise<{ uid: string; idToken: string }> {
  const response = await fetch(
    `http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "correct-horse", returnSecureToken: true }),
    },
  );
  const body = (await response.json()) as { localId: string; idToken: string };
  return { uid: body.localId, idToken: body.idToken };
}

function keysRequest(authorization?: string): Request {
  return new Request("http://localhost/api/keys", { headers: authorization ? { authorization } : {} });
}

beforeEach(async () => {
  await fetch(`http://${authHost}/emulator/v1/projects/demo-katai/accounts`, { method: "DELETE" });
  const keys = await getAdminDb().collection("providerKeys").listDocuments();
  await Promise.all(keys.map((key) => key.delete()));
});

describe("GET /api/keys", () => {
  it.each([undefined, "Bearer not-a-token", "Basic abc", "Bearer"])(
    "answers 401 without a valid Firebase ID token (%s) (S6)",
    async (authorization) => {
      const response = await GET(keysRequest(authorization));
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "unauthorized" });
    },
  );

  it("returns only the configuration status of the caller's keys, never their content (CA2.2, S3)", async () => {
    const alice = await createUserToken("alice@example.com");
    const bob = await createUserToken("bob@example.com");
    const updatedAt = new Date("2026-10-19T10:00:00Z");
    await getAdminDb().doc(`providerKeys/${alice.uid}_anthropic`).set({
      uid: alice.uid,
      provider: "anthropic",
      ciphertext: "opaque-ciphertext",
      iv: "iv",
      authTag: "tag",
      keyVersion: 1,
      updatedAt,
    });
    await getAdminDb().doc(`providerKeys/${bob.uid}_openai`).set({ uid: bob.uid, provider: "openai", updatedAt });

    const response = await GET(keysRequest(`Bearer ${alice.idToken}`));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const text = await response.text();
    expect(text).not.toContain("opaque-ciphertext");
    expect(JSON.parse(text)).toEqual({
      keys: [
        { provider: "anthropic", configured: true, updatedAt: "2026-10-19T10:00:00.000Z" },
        { provider: "openai", configured: false, updatedAt: null },
      ],
    });
  });
});
