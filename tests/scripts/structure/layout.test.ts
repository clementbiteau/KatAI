import { describe, expect, it } from "vitest";
import { checkFolderDepth, checkFolderSizes } from "../../../scripts/structure/layout.ts";

function filesIn(folder: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${folder}/file-${index}.ts`);
}

describe("checkFolderSizes", () => {
  it("accepts a folder with exactly 5 files", () => {
    expect(checkFolderSizes(filesIn("lib", 5))).toEqual([]);
  });

  it("reports a folder with 6 files", () => {
    expect(checkFolderSizes(filesIn("lib", 6))).toEqual([
      { rule: "files-per-folder", path: "lib", actual: 6, limit: 5 },
    ]);
  });

  it("does not count subfolders as files", () => {
    const paths = [...filesIn("lib", 5), ...filesIn("lib/a", 1), ...filesIn("lib/b", 1)];
    expect(checkFolderSizes(paths)).toEqual([]);
  });

  it("ignores allowlisted root configuration files", () => {
    const paths = ["package.json", "tsconfig.json", "next.config.ts", "README.md", "LICENSE", "CLAUDE.md"];
    expect(checkFolderSizes(paths)).toEqual([]);
  });

  it("counts root files that are not allowlisted", () => {
    const paths = ["package.json", ...Array.from({ length: 6 }, (_, index) => `stray-${index}.ts`)];
    expect(checkFolderSizes(paths)).toEqual([
      { rule: "files-per-folder", path: ".", actual: 6, limit: 5 },
    ]);
  });
});

describe("checkFolderDepth", () => {
  it("accepts a file three folders deep", () => {
    expect(checkFolderDepth(["a/b/c/file.ts"])).toEqual([]);
  });

  it("reports a file four folders deep", () => {
    expect(checkFolderDepth(["a/b/c/d/file.ts"])).toEqual([
      { rule: "folder-depth", path: "a/b/c/d/file.ts", actual: 4, limit: 3 },
    ]);
  });
});
