import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { EXCLUDED_PREFIXES } from "./config.ts";

export function isInScope(path: string): boolean {
  return !EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

// Tracked files plus new files not ignored by .gitignore, so the check also
// works before `git add`. Deleted files still in the index are skipped.
export function listProjectFiles(root: string): string[] {
  const output = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
    cwd: root,
    encoding: "utf8",
  });
  const paths = new Set(output.split("\0").filter((path) => path.length > 0));
  return [...paths].filter((path) => existsSync(join(root, path)) && isInScope(path)).sort();
}
