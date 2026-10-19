import type { KataTest, TestOutcome } from "./types.ts";

// Kept free of imports and module-level state so the sandbox can reuse it as is.

export function deepEqual(actual: unknown, expected: unknown): boolean {
  if (Object.is(actual, expected)) return true;
  if (typeof actual !== "object" || typeof expected !== "object" || actual === null || expected === null) {
    return false;
  }
  if (Array.isArray(actual) !== Array.isArray(expected)) return false;
  const actualKeys = Object.keys(actual);
  const expectedKeys = Object.keys(expected);
  if (actualKeys.length !== expectedKeys.length) return false;
  return expectedKeys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(actual, key) &&
      deepEqual((actual as Record<string, unknown>)[key], (expected as Record<string, unknown>)[key]),
  );
}

export function runKataTest(candidate: (...args: unknown[]) => unknown, test: KataTest): TestOutcome {
  try {
    const actual = candidate(...structuredClone(test.args));
    const passed = "expected" in test && deepEqual(actual, test.expected);
    return { label: test.label, status: passed ? "passed" : "failed" };
  } catch (error) {
    const passed = "throws" in test && error instanceof Error && error.name === test.throws;
    return { label: test.label, status: passed ? "passed" : "failed" };
  }
}

export function runKataTests(
  candidate: (...args: never[]) => unknown,
  tests: readonly KataTest[],
): TestOutcome[] {
  return tests.map((test) => runKataTest(candidate as (...args: unknown[]) => unknown, test));
}
