import type { KataTest, TestOutcome } from "./types.ts";

type Candidate = (...args: unknown[]) => unknown;

export type Evaluator = {
  deepEqual: (actual: unknown, expected: unknown) => boolean;
  runKataTest: (candidate: Candidate, test: KataTest) => TestOutcome;
};

// Self-contained on purpose: the sandbox serializes this function with
// Function.prototype.toString() and runs it inside a worker (docs/adr/0006).
// Keep every helper inside it, reference nothing from outside, and avoid
// syntax a compiler could rewrite with an imported helper (spread, classes, async).
export function createEvaluator(): Evaluator {
  function deepEqual(actual: unknown, expected: unknown): boolean {
    if (Object.is(actual, expected)) return true;
    if (typeof actual !== "object" || typeof expected !== "object" || actual === null || expected === null) {
      return false;
    }
    if (Array.isArray(actual) !== Array.isArray(expected)) return false;
    const actualRecord = actual as Record<string, unknown>;
    const expectedRecord = expected as Record<string, unknown>;
    const expectedKeys = Object.keys(expectedRecord);
    if (Object.keys(actualRecord).length !== expectedKeys.length) return false;
    return expectedKeys.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(actualRecord, key) && deepEqual(actualRecord[key], expectedRecord[key]),
    );
  }

  function runKataTest(candidate: Candidate, test: KataTest): TestOutcome {
    try {
      // apply() instead of spread: a spread call could be compiled into an imported
      // helper, which would break this function once serialized into the worker.
      // eslint-disable-next-line prefer-spread
      const actual = candidate.apply(null, structuredClone(test.args));
      const passed = "expected" in test && deepEqual(actual, test.expected);
      return { label: test.label, status: passed ? "passed" : "failed" };
    } catch (error) {
      const passed = "throws" in test && error instanceof Error && error.name === test.throws;
      return { label: test.label, status: passed ? "passed" : "failed" };
    }
  }

  return { deepEqual: deepEqual, runKataTest: runKataTest };
}

export function runKataTests(candidate: (...args: never[]) => unknown, tests: readonly KataTest[]): TestOutcome[] {
  const evaluator = createEvaluator();
  return tests.map((test) => evaluator.runKataTest(candidate as Candidate, test));
}
