export type KataLevel = "easy" | "medium" | "hard";

export type KataSector = "retail" | "luxury" | "banking";

// The development-cycle step a kata trains. Tranche 1 only has specification
// katas; guardrail, review and framing katas come later (docs/intent.md).
export type KataStage = "specification";

// Declarative test: plain data, so it can be sent to the sandbox worker with postMessage.
// A test either expects a return value or expects an error with the given name.
export type KataTest =
  | { label: string; args: unknown[]; expected: unknown }
  | { label: string; args: unknown[]; throws: "RangeError" | "TypeError" };

export type Kata = {
  id: string;
  title: string;
  level: KataLevel;
  sector: KataSector;
  stage: KataStage;
  // One line telling the user which skill the kata trains.
  practice: string;
  summary: string;
  // A fictional client brief, shown to the user only. The model never receives it (spec, H2).
  brief: string;
  functionName: string;
  // Sent to the model with the user's spec.
  signature: string;
  tests: readonly KataTest[];
};

export type TestOutcome = { label: string; status: "passed" | "failed" };
