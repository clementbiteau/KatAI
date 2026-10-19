import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const repositoryRoot = resolve(import.meta.dirname, "../..");
const cliPath = join(repositoryRoot, "scripts/check-structure.ts");
const temporaryFolders: string[] = [];

function createRepository(files: Record<string, string>): string {
  const folder = mkdtempSync(join(tmpdir(), "katai-structure-"));
  temporaryFolders.push(folder);
  execFileSync("git", ["init", "-q"], { cwd: folder });
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(folder, path)), { recursive: true });
    writeFileSync(join(folder, path), content);
  }
  return folder;
}

function runCli(cwd: string) {
  return spawnSync(process.execPath, [cliPath], { cwd, encoding: "utf8" });
}

afterEach(() => {
  for (const folder of temporaryFolders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

describe("check-structure CLI", () => {
  it("fails with one line per violation", () => {
    const sixFunctions = Array.from({ length: 6 }, (_, index) => `function f${index}() {}`).join("\n");
    const folder = createRepository({ "lib/too-many.ts": sixFunctions, "a/b/c/d/deep.ts": "" });
    const result = runCli(folder);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("functions-per-file lib/too-many.ts: 6 (max 5)");
    expect(result.stdout).toContain("folder-depth a/b/c/d/deep.ts: 4 (max 3)");
  });

  it("passes on a compliant repository", () => {
    const folder = createRepository({ "lib/ok.ts": "export const value = 1;" });
    expect(runCli(folder).status).toBe(0);
  });

  it("passes on the KatAI repository itself", () => {
    const result = runCli(repositoryRoot);
    expect(result.stdout + result.stderr).toContain("Structure check passed");
    expect(result.status).toBe(0);
  });
});
