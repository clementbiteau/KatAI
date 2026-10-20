import type { AttemptView } from "../../lib/attempts.ts";
import { PROVIDER_MODELS } from "../../lib/providers.ts";

// Shared wording for attempts in the history, the detail page and the comparison.

export function formatAttemptDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatDuration(milliseconds: number): string {
  return `${(milliseconds / 1000).toFixed(1)} s`;
}

// The model that answered, by its display name when it is one of ours.
export function modelLabel(attempt: AttemptView): string {
  const id = attempt.servedModel ?? attempt.model;
  return PROVIDER_MODELS[attempt.provider].find((model) => model.id === id)?.label ?? id;
}

export function describeAttemptScore(attempt: AttemptView): string {
  if (attempt.status === "error") return "Error";
  if (attempt.result) return `${attempt.result.passed} / ${attempt.result.total}`;
  return "Not scored";
}
