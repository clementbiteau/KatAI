import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// S7: the server only calls the closed list of provider addresses. Every outbound call
// goes through the provider SDKs with a fixed base URL; no server code calls fetch itself
// or contains another address.
const root = resolve(import.meta.dirname, "../..");
const ALLOWED_ADDRESSES = new Map([["lib/server/providers/anthropic.ts", ["https://api.anthropic.com"]]]);

function serverFiles(folder: string): string[] {
  return readdirSync(folder).flatMap((name) => {
    const path = join(folder, name);
    return statSync(path).isDirectory() ? serverFiles(path) : path.endsWith(".ts") ? [relative(root, path)] : [];
  });
}

const files = [...serverFiles(join(root, "lib/server")), ...serverFiles(join(root, "app/api"))];

describe("outbound calls from the server (S7)", () => {
  it("covers the server code", () => {
    expect(files).toContain("lib/server/providers/anthropic.ts");
    expect(files).toContain("app/api/attempts/route.ts");
  });

  it.each(files)("%s never calls fetch directly", (file) => {
    expect(readFileSync(join(root, file), "utf8")).not.toMatch(/\bfetch\s*\(/);
  });

  it.each(files)("%s contains no address outside the closed list", (file) => {
    const addresses = readFileSync(join(root, file), "utf8").match(/https?:\/\/[^\s"'`)]+/g) ?? [];
    expect(addresses.filter((address) => !(ALLOWED_ADDRESSES.get(file) ?? []).includes(address))).toEqual([]);
  });
});
