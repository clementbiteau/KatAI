import { describe, expect, it } from "vitest";
import { isInScope } from "../../../scripts/structure/files.ts";

describe("isInScope", () => {
  it("excludes the docs folder", () => {
    expect(isInScope("docs/adr/0001-stack-applicative.md")).toBe(false);
  });

  it("keeps application, test and tooling files", () => {
    expect(isInScope("app/page.tsx")).toBe(true);
    expect(isInScope("tests/app/home-page.test.tsx")).toBe(true);
    expect(isInScope(".github/workflows/ci.yml")).toBe(true);
  });
});
