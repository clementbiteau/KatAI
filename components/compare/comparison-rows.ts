import { findKata } from "../../katas/catalog.ts";
import type { AttemptView } from "../../lib/attempts.ts";
import { describeErrorCategory } from "../kata/attempt-messages.ts";
import { describeAttemptScore, formatAttemptDate, formatDuration, modelLabel } from "../history/attempt-format.ts";

export type ComparisonRow = { label: string; values: [string, string]; preformatted?: boolean };

const DASH = "—";
const TEST_STATUS = { passed: "Passed", failed: "Failed", timeout: "Timed out" } as const;

// Why two attempts cannot be compared, or null when they can (CA6.5, CA6.6).
export function comparisonProblem(firstId: string, secondId: string, attempts: (AttemptView | null)[]): string | null {
  if (!firstId || !secondId) return "Choose two attempts from a kata's history.";
  if (firstId === secondId) return "Choose two different attempts.";
  const [first, second] = attempts;
  if (!first || !second) return "Attempt not found.";
  if (first.kataId !== second.kataId) return "Both attempts must be on the same kata.";
  return null;
}

// The older attempt goes on the left (CA6.1).
export function orderByDate(first: AttemptView, second: AttemptView): [AttemptView, AttemptView] {
  return first.createdAt <= second.createdAt ? [first, second] : [second, first];
}

function describeStatus(attempt: AttemptView): string {
  if (attempt.status === "error") return `Error: ${describeErrorCategory(attempt.errorCategory ?? "")}`;
  return attempt.status === "done" ? "Scored" : "Not scored";
}

// Every compared field, plus one row per kata test. A missing value shows a dash (CA6.4).
export function buildComparisonRows(left: AttemptView, right: AttemptView): ComparisonRow[] {
  const both = (read: (attempt: AttemptView) => string | null | undefined): [string, string] => [read(left) ?? DASH, read(right) ?? DASH];
  const testLabels = findKata(left.kataId)?.tests.map((test) => test.label) ?? [];
  return [
    { label: "Date", values: both((attempt) => formatAttemptDate(attempt.createdAt)) },
    { label: "Model", values: both(modelLabel) },
    { label: "Status", values: both(describeStatus) },
    { label: "Score", values: both((attempt) => (attempt.result ? describeAttemptScore(attempt) : null)) },
    { label: "Duration", values: both((attempt) => formatDuration(attempt.latencyMs)) },
    { label: "Input tokens", values: both((attempt) => attempt.inputTokens?.toString()) },
    { label: "Output tokens", values: both((attempt) => attempt.outputTokens?.toString()) },
    { label: "Specification", values: both((attempt) => attempt.spec), preformatted: true },
    { label: "Generated code", values: both((attempt) => attempt.code), preformatted: true },
    ...testLabels.map((label) => ({
      label,
      values: both((attempt) => {
        const outcome = attempt.result?.tests.find((test) => test.label === label);
        return outcome ? TEST_STATUS[outcome.status] : null;
      }),
    })),
  ];
}
