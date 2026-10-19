import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function loadConfig() {
  const configModule = await import("../../next.config.ts");
  return configModule.default;
}

// The end-to-end harness page (*.e2e.tsx) must never exist in a regular build.
describe("next.config", () => {
  it("excludes end-to-end pages from regular builds", async () => {
    vi.stubEnv("KATAI_E2E", "");
    const config = await loadConfig();
    expect(config.pageExtensions).toEqual(["tsx", "ts"]);
    expect(config.distDir).toBe(".next");
  });

  it("includes end-to-end pages, in a separate output folder, only when KATAI_E2E=1", async () => {
    vi.stubEnv("KATAI_E2E", "1");
    const config = await loadConfig();
    expect(config.pageExtensions).toEqual(["tsx", "ts", "e2e.tsx"]);
    expect(config.distDir).toBe(".next-e2e");
  });
});
