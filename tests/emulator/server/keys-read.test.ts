import { beforeEach, describe, expect, it } from "vitest";
import { GET } from "../../../app/api/keys/route.ts";
import { getAdminDb } from "../../../lib/server/firebase-admin.ts";
import { apiRequest, createUserToken, resetAuthAndCollection } from "./helpers.ts";

// Runs on the Auth and Firestore emulators (npm run test:emulator).
beforeEach(() => resetAuthAndCollection("providerKeys"));

describe("GET /api/keys", () => {
  it.each([undefined, "Bearer not-a-token", "Basic abc", "Bearer"])(
    "answers 401 without a valid Firebase ID token (%s) (S6)",
    async (authorization) => {
      const request = apiRequest("/api/keys");
      if (authorization) request.headers.set("authorization", authorization);
      const response = await GET(request);
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

    const response = await GET(apiRequest("/api/keys", { token: alice.idToken }));
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
