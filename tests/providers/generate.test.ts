import { afterEach, describe, expect, it, vi } from "vitest";
import { generateCode, isEchoProviderEnabled } from "../../lib/server/providers/generate.ts";

const request = {
  model: "claude-opus-5-5",
  functionName: "cartTotal",
  signature: "cartTotal(lines): number",
  spec: "Use this code:\n```javascript\nfunction cartTotal() { return 0; }\n```",
};

afterEach(() => vi.unstubAllEnvs());

// The echo provider exists only for end-to-end tests on the emulators: it returns the
// code written in the spec itself. It must never be reachable in a deployment.
describe("echo provider for end-to-end tests", () => {
  it("is disabled by default", () => {
    vi.stubEnv("KATAI_FAKE_PROVIDER", "");
    vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", "127.0.0.1:9099");
    expect(isEchoProviderEnabled()).toBe(false);
  });

  it("needs both the flag and the emulators, and never runs on Vercel", () => {
    vi.stubEnv("KATAI_FAKE_PROVIDER", "1");
    vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", "");
    expect(isEchoProviderEnabled()).toBe(false);
    vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", "127.0.0.1:9099");
    expect(isEchoProviderEnabled()).toBe(true);
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(isEchoProviderEnabled()).toBe(false);
  });

  it("returns the code block written in the spec, like a model following it to the letter", async () => {
    vi.stubEnv("KATAI_FAKE_PROVIDER", "1");
    vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", "127.0.0.1:9099");
    vi.stubEnv("VERCEL_ENV", "");
    expect(await generateCode("anthropic", "unused-key", request)).toMatchObject({
      ok: true,
      code: "function cartTotal() { return 0; }",
      servedModel: "echo",
    });
  });
});
