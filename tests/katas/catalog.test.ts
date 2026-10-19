import { describe, expect, it } from "vitest";
import { findKata, KATAS, randoriMinutes } from "../../katas/catalog.ts";

describe("kata catalog", () => {
  it("contains the three starter katas, one per level", () => {
    expect(KATAS.map((kata) => [kata.id, kata.level])).toEqual([
      ["cart-total", "easy"],
      ["slugify", "medium"],
      ["free-slots", "hard"],
    ]);
  });

  it.each(KATAS)("$id is complete and consistent", (kata) => {
    expect(kata.title.length).toBeGreaterThan(0);
    expect(kata.summary.length).toBeGreaterThan(0);
    expect(kata.statement.length).toBeGreaterThan(0);
    expect(kata.functionName).toMatch(/^[a-z][A-Za-z0-9]*$/);
    expect(kata.signature.startsWith(`${kata.functionName}(`)).toBe(true);
    expect(kata.tests.length).toBeGreaterThanOrEqual(8);
    expect(kata.tests.length).toBeLessThanOrEqual(12);
    expect(new Set(kata.tests.map((test) => test.label)).size).toBe(kata.tests.length);
  });

  it("only uses structured-clone-safe test data", () => {
    for (const kata of KATAS) {
      expect(structuredClone(kata.tests)).toEqual(kata.tests);
    }
  });

  it("finds a kata by id and returns undefined for an unknown id", () => {
    expect(findKata("slugify")?.title).toBe("Slugify");
    expect(findKata("does-not-exist")).toBeUndefined();
  });

  it("maps levels to randori durations of 10, 15 and 20 minutes", () => {
    expect([randoriMinutes("easy"), randoriMinutes("medium"), randoriMinutes("hard")]).toEqual([10, 15, 20]);
  });
});
