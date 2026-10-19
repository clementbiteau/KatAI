// Structure limits and scope, as decided in docs/adr/0009-controle-de-structure.md.
// Adding an exception requires amending that ADR first.

export const LIMITS = {
  functionsPerFile: 5,
  filesPerFolder: 5,
  folderDepth: 3,
} as const;

// docs/ is excluded: the standard targets code, and ADRs are an append-only log.
export const EXCLUDED_PREFIXES = ["docs/"] as const;

// Root files imposed by tooling; they do not count toward the root folder limit.
export const ROOT_ALLOWLIST: ReadonlySet<string> = new Set([
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next.config.ts",
  "next-env.d.ts",
  "eslint.config.mjs",
  "vitest.config.ts",
  "playwright.config.ts",
  "firebase.json",
  ".firebaserc",
  "firestore.rules",
  "firestore.indexes.json",
  "README.md",
  "LICENSE",
  "CLAUDE.md",
  ".gitignore",
  ".env.example",
]);

export const CODE_FILE_PATTERN = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

export type Violation = {
  rule: "functions-per-file" | "files-per-folder" | "folder-depth";
  path: string;
  actual: number;
  limit: number;
};
