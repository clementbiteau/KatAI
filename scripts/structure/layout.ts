import { LIMITS, ROOT_ALLOWLIST, type Violation } from "./config.ts";

function parentFolder(path: string): string {
  const lastSlash = path.lastIndexOf("/");
  return lastSlash === -1 ? "." : path.slice(0, lastSlash);
}

// Only files count toward a folder's limit; subfolders do not.
export function checkFolderSizes(paths: readonly string[]): Violation[] {
  const filesPerFolder = new Map<string, number>();
  for (const path of paths) {
    const folder = parentFolder(path);
    if (folder === "." && ROOT_ALLOWLIST.has(path)) continue;
    filesPerFolder.set(folder, (filesPerFolder.get(folder) ?? 0) + 1);
  }
  return [...filesPerFolder]
    .filter(([, count]) => count > LIMITS.filesPerFolder)
    .map(([folder, count]) => ({ rule: "files-per-folder", path: folder, actual: count, limit: LIMITS.filesPerFolder }));
}

// A file may sit at most LIMITS.folderDepth folders below the repository root.
export function checkFolderDepth(paths: readonly string[]): Violation[] {
  return paths
    .map((path) => ({ path, depth: path.split("/").length - 1 }))
    .filter(({ depth }) => depth > LIMITS.folderDepth)
    .map(({ path, depth }) => ({ rule: "folder-depth", path, actual: depth, limit: LIMITS.folderDepth }));
}
