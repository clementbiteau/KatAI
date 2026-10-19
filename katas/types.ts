export type KataLevel = "easy" | "medium" | "hard";

// Declarative test: plain data, so it can be sent to the sandbox worker with postMessage.
// A test either expects a return value or expects an error with the given name.
export type KataTest =
  | { label: string; args: unknown[]; expected: unknown }
  | { label: string; args: unknown[]; throws: "RangeError" | "TypeError" };

export type Kata = {
  id: string;
  title: string;
  level: KataLevel;
  summary: string;
  // Shown to the user only. The model never receives it (spec, hypothesis H2).
  statement: string;
  functionName: string;
  // Sent to the model with the user's spec.
  signature: string;
  tests: readonly KataTest[];
};

export type TestOutcome = { label: string; status: "passed" | "failed" };
