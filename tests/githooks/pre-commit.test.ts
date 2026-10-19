import { randomBytes } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const hooksPath = resolve(import.meta.dirname, "../../.githooks");
const temporaryFolders: string[] = [];

function createRepositoryWithHook(): string {
  const folder = mkdtempSync(join(tmpdir(), "katai-hook-"));
  temporaryFolders.push(folder);
  execFileSync("git", ["init", "-q"], { cwd: folder });
  execFileSync("git", ["config", "core.hooksPath", hooksPath], { cwd: folder });
  return folder;
}

function commitFile(folder: string, name: string, content: string) {
  writeFileSync(join(folder, name), content);
  execFileSync("git", ["add", name], { cwd: folder });
  return spawnSync("git", ["-c", "user.name=test", "-c", "user.email=test@example.invalid", "commit", "-q", "-m", "test"], {
    cwd: folder,
    encoding: "utf8",
  });
}

afterEach(() => {
  for (const folder of temporaryFolders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

describe("pre-commit hook", () => {
  it("lets a clean, compliant commit through", () => {
    const result = commitFile(createRepositoryWithHook(), "clean.ts", "export const answer = 42;\n");
    expect(result.status).toBe(0);
  });

  it("blocks a commit that stages a token-shaped secret", () => {
    // Built at runtime so this test file never contains a secret-shaped literal.
    const fakeToken = "ghp_" + randomBytes(27).toString("base64url").replace(/[-_]/g, "a").slice(0, 36);
    const result = commitFile(createRepositoryWithHook(), "leak.ts", `export const token = "${fakeToken}";\n`);
    const output = result.stdout + result.stderr;
    expect(result.status).not.toBe(0);
    expect(output).toContain("leaks found");
    expect(output).not.toContain(fakeToken);
  });
});
