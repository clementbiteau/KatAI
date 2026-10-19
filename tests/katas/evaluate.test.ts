import { describe, expect, it } from "vitest";
import { deepEqual, runKataTests } from "../../katas/evaluate.ts";
import type { KataTest } from "../../katas/types.ts";

describe("deepEqual", () => {
  it("compares nested arrays and objects regardless of key order", () => {
    expect(deepEqual([{ start: "09:00", end: "10:00" }], [{ end: "10:00", start: "09:00" }])).toBe(true);
  });

  it("detects different values, lengths and types", () => {
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
    expect(deepEqual("1", 1)).toBe(false);
    expect(deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
  });
});

describe("runKataTests", () => {
  const tests: KataTest[] = [
    { label: "doubles a number", args: [2], expected: 4 },
    { label: "rejects negatives", args: [-1], throws: "RangeError" },
  ];

  it("marks each test passed or failed", () => {
    const double = (value: number) => {
      if (value < 0) throw new RangeError("negative");
      return value * 2;
    };
    expect(runKataTests(double, tests)).toEqual([
      { label: "doubles a number", status: "passed" },
      { label: "rejects negatives", status: "passed" },
    ]);
  });

  it("fails a test when the function throws unexpectedly or throws the wrong error", () => {
    const broken = () => {
      throw new TypeError("boom");
    };
    expect(runKataTests(broken, tests)).toEqual([
      { label: "doubles a number", status: "failed" },
      { label: "rejects negatives", status: "failed" },
    ]);
  });

  it("gives each test its own copy of the arguments", () => {
    const sharedArgs = [[3, 1, 2]];
    const sortInPlace = (values: number[]) => values.sort();
    const sortTests: KataTest[] = [
      { label: "first run", args: sharedArgs, expected: [1, 2, 3] },
      { label: "second run", args: sharedArgs, expected: [1, 2, 3] },
    ];
    runKataTests(sortInPlace, sortTests);
    expect(sharedArgs).toEqual([[3, 1, 2]]);
  });
});
