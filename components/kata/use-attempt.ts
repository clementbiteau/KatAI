"use client";

import { useCallback, useState } from "react";
import type { AttemptView } from "../../lib/attempts/view.ts";
import { authorizedFetch } from "../../lib/api-client.ts";
import type { Kata } from "../../katas/types.ts";
import { runInSandbox } from "../../sandbox/run-in-sandbox.ts";
import type { SandboxReport } from "../../sandbox/types.ts";
import { describeErrorCategory } from "./attempt-messages.ts";

export type AttemptState =
  | { phase: "idle" }
  | { phase: "generating" }
  | { phase: "running"; attempt: AttemptView }
  | { phase: "done"; attempt: AttemptView; report: SandboxReport; saveError: string | null }
  | { phase: "failed"; message: string; action?: "settings" | "sign-in" };

const SESSION_EXPIRED: AttemptState = {
  phase: "failed",
  message: "Your session has expired. Sign in again: your specification is kept.",
  action: "sign-in",
};

// Turns the attempt saved by the server into what the page shows when no sandbox run is needed.
function reportFromAttempt(attempt: AttemptView): SandboxReport {
  return { status: "completed", outcomes: attempt.result?.tests ?? [] };
}

// Sends the sandbox score to the server; the page still shows it if saving fails.
async function saveResult(attempt: AttemptView, report: SandboxReport): Promise<{ attempt: AttemptView; saveError: string | null }> {
  const response = await authorizedFetch("/api/attempts", {
    method: "PATCH",
    body: { attemptId: attempt.id, outcomes: report.outcomes },
  }).catch(() => null);
  if (!response?.ok) return { attempt, saveError: "Your score could not be saved." };
  return { attempt: ((await response.json()) as { attempt: AttemptView }).attempt, saveError: null };
}

// One attempt: the server calls the model, the browser sandbox runs the code against the
// kata's tests, then the score is saved once (US4).
export function useAttempt(kata: Kata) {
  const [state, setState] = useState<AttemptState>({ phase: "idle" });

  const submit = useCallback(
    async (spec: string, model: string) => {
      setState({ phase: "generating" });
      const response = await authorizedFetch("/api/attempts", {
        method: "POST",
        body: { kataId: kata.id, provider: "anthropic", model, spec },
      }).catch(() => null);
      if (!response || response.status === 401) return setState(SESSION_EXPIRED);
      const body = (await response.json()) as { attempt?: AttemptView; error?: string; code?: string };
      if (!response.ok || !body.attempt) {
        const settings = body.code === "missing-key" || body.code === "unreadable-key";
        return setState({ phase: "failed", message: body.error ?? "Something went wrong.", action: settings ? "settings" : undefined });
      }
      const attempt = body.attempt;
      if (attempt.status === "error") {
        const settings = attempt.errorCategory === "key-refused";
        return setState({ phase: "failed", message: describeErrorCategory(attempt.errorCategory ?? ""), action: settings ? "settings" : undefined });
      }
      if (attempt.status === "done" || !attempt.code) {
        return setState({ phase: "done", attempt, report: reportFromAttempt(attempt), saveError: null });
      }
      setState({ phase: "running", attempt });
      const report = await runInSandbox({ code: attempt.code, functionName: kata.functionName, tests: kata.tests });
      const saved = await saveResult(attempt, report);
      setState({ phase: "done", attempt: saved.attempt, report, saveError: saved.saveError });
    },
    [kata],
  );

  return { state, submit };
}
