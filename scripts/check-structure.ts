// Fails the build when a file, folder or path exceeds the structure limits
// (docs/adr/0009-controle-de-structure.md). Run with: npm run check:structure
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Violation } from "./structure/config.ts";
import { listProjectFiles } from "./structure/files.ts";
import { checkFunctionCounts } from "./structure/functions.ts";
import { checkFolderDepth, checkFolderSizes } from "./structure/layout.ts";

function formatViolation({ rule, path, actual, limit }: Violation): string {
  return `${rule} ${path}: ${actual} (max ${limit})`;
}

function main(root: string): number {
  const paths = listProjectFiles(root);
  const violations = [
    ...checkFolderSizes(paths),
    ...checkFolderDepth(paths),
    ...checkFunctionCounts(paths, (path) => readFileSync(join(root, path), "utf8")),
  ];
  if (violations.length === 0) {
    console.log(`Structure check passed: ${paths.length} files checked.`);
    return 0;
  }
  console.log(`Structure check failed: ${violations.length} violation(s).`);
  for (const violation of violations) console.log(formatViolation(violation));
  return 1;
}

process.exitCode = main(process.cwd());
