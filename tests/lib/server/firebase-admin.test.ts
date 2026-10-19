import { afterEach, describe, expect, it, vi } from "vitest";

const fakeServiceAccount = Buffer.from(
  JSON.stringify({ project_id: "real-project", client_email: "x@real-project.iam.gserviceaccount.com", private_key: "x" }),
).toString("base64");

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function loadAdmin() {
  return import("../../../lib/server/firebase-admin.ts");
}

// With emulator variables set, the Admin SDK trusts unsigned emulator tokens.
// These guards make sure that can never happen against a real project.
describe("getAdminApp safety guards", () => {
  it("refuses emulator settings alongside a real service account", async () => {
    vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", "127.0.0.1:9099");
    vi.stubEnv("FIREBASE_SERVICE_ACCOUNT", fakeServiceAccount);
    const { getAdminApp } = await loadAdmin();
    expect(() => getAdminApp()).toThrow("Firebase emulator settings are not allowed here.");
  });

  it("refuses emulator settings on a Vercel deployment", async () => {
    vi.stubEnv("FIRESTORE_EMULATOR_HOST", "127.0.0.1:8080");
    vi.stubEnv("FIREBASE_SERVICE_ACCOUNT", "");
    vi.stubEnv("VERCEL_ENV", "preview");
    const { getAdminApp } = await loadAdmin();
    expect(() => getAdminApp()).toThrow("Firebase emulator settings are not allowed here.");
  });

  it("explains a missing service account outside the emulators", async () => {
    vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", "");
    vi.stubEnv("FIRESTORE_EMULATOR_HOST", "");
    vi.stubEnv("FIREBASE_SERVICE_ACCOUNT", "");
    const { getAdminApp } = await loadAdmin();
    expect(() => getAdminApp()).toThrow("FIREBASE_SERVICE_ACCOUNT is not configured.");
  });
});
