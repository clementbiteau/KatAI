import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const script = resolve(import.meta.dirname, "../../scripts/smoke-provider.ts");

// An empty KATAI_SMOKE_KEY counts as missing, so a key set in the parent shell never leaks in.
function runSmoke(args: string[], smokeKey = "") {
  return spawnSync(process.execPath, ["--conditions=react-server", script, ...args], {
    encoding: "utf8",
    env: { ...process.env, KATAI_SMOKE_KEY: smokeKey },
  });
}

// Only the guards are tested here: the real call needs the owner's key and stays manual.
describe("smoke-provider script", () => {
  it("refuses to run without KATAI_SMOKE_KEY", () => {
    const result = runSmoke(["anthropic"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Set KATAI_SMOKE_KEY first");
  });

  it("refuses a value that is not shaped like an API key, before any call", () => {
    const result = runSmoke(["anthropic"], "twelve-chars");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("is not a usable key (12 characters)");
    expect(result.stdout + result.stderr).not.toContain("twelve-chars");
  });

  it("refuses an unknown provider without printing the key", () => {
    const result = runSmoke(["mistral"], "sk-secret-value-never-printed-" + "x".repeat(20));
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Unknown provider: mistral");
    expect(result.stdout + result.stderr).not.toContain("sk-secret-value-never-printed");
  });
});
