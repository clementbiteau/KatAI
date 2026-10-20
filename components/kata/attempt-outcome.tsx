import Link from "next/link";
import { SandboxResults } from "../sandbox-results.tsx";
import type { AttemptState } from "./use-attempt.ts";

// What happened to the last attempt. Generated code is shown as text only (ADR 0006).
export function AttemptOutcome({ state }: { state: AttemptState }) {
  if (state.phase === "idle") return null;
  if (state.phase === "generating") return <p role="status">Your model is writing the code…</p>;
  if (state.phase === "failed") {
    return (
      <div role="alert" className="attempt-failure">
        <p>{state.message}</p>
        {state.action === "settings" && <Link href="/settings">Open Settings</Link>}
        {state.action === "sign-in" && <Link href="/login">Sign in again</Link>}
      </div>
    );
  }
  const { attempt } = state;
  return (
    <section className="attempt-outcome" aria-label="Attempt result">
      {attempt.code ? (
        <pre className="attempt-code">
          <code>{attempt.code}</code>
        </pre>
      ) : (
        <p role="status">No code was found in the model&apos;s answer, so every test fails.</p>
      )}
      {attempt.truncated && <p role="status">The answer was cut off by the token limit.</p>}
      <p className="attempt-meta">
        Answered by {attempt.servedModel} in {(attempt.latencyMs / 1000).toFixed(1)} s · {attempt.inputTokens ?? 0} input
        tokens · {attempt.outputTokens ?? 0} output tokens
      </p>
      {state.phase === "running" ? <p role="status">Running the hidden acceptance tests…</p> : <SandboxResults report={state.report} />}
      {state.phase === "done" && state.saveError && <p role="alert">{state.saveError}</p>}
    </section>
  );
}
