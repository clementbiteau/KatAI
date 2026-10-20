"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { Kata } from "../../katas/types.ts";
import { PROVIDER_MODELS } from "../../lib/providers.ts";
import { MAX_SPEC_LENGTH, validateSpec } from "../../lib/specs.ts";
import { useAuthState } from "../auth/auth-context.tsx";
import { AttemptOutcome } from "./attempt-outcome.tsx";
import { useAttempt } from "./use-attempt.ts";

const MODELS = PROVIDER_MODELS.anthropic;

// Spec editor and attempt flow. The brief stays on the page: the model never receives it (H2).
function AttemptForm({ kata }: { kata: Kata }) {
  const [spec, setSpec] = useState("");
  const [model, setModel] = useState(MODELS[0]?.id ?? "");
  const { state, submit } = useAttempt(kata);
  const busy = state.phase === "generating" || state.phase === "running";
  const tooLong = spec.length > MAX_SPEC_LENGTH;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!busy && !validateSpec(spec)) void submit(spec, model);
  };

  return (
    <>
      <form className="form spec-form" onSubmit={handleSubmit}>
        <label>
          Your specification
          <textarea value={spec} onChange={(event) => setSpec(event.target.value)} rows={14} spellCheck />
        </label>
        <p className={tooLong ? "spec-counter spec-counter-over" : "spec-counter"}>
          {spec.length} / {MAX_SPEC_LENGTH}
        </p>
        {tooLong && <p role="alert">{validateSpec(spec)}</p>}
        <label>
          Model
          <select value={model} onChange={(event) => setModel(event.target.value)}>
            {MODELS.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={busy || validateSpec(spec) !== null}>
          {busy ? "Generating…" : "Generate and test"}
        </button>
      </form>
      <AttemptOutcome state={state} />
    </>
  );
}

export function KataWorkspace({ kata }: { kata: Kata }) {
  const auth = useAuthState();
  if (auth.status === "loading") return <p role="status">Loading…</p>;
  if (auth.status === "unavailable") return <p role="status">Sign-in is not available right now. Please try again later.</p>;
  if (auth.status === "signed-out") {
    return (
      <p>
        <Link href={`/login?next=${encodeURIComponent(`/katas/${kata.id}`)}`}>Sign in to practice</Link> this kata with your
        own model.
      </p>
    );
  }
  return <AttemptForm kata={kata} />;
}
