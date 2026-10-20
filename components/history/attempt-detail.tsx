"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { findKata } from "../../katas/catalog.ts";
import type { AttemptView } from "../../lib/attempts/view.ts";
import { readAttempt } from "../../lib/attempts/reader.ts";
import { describeErrorCategory } from "../kata/attempt-messages.ts";
import { SandboxResults } from "../sandbox-results.tsx";
import { formatAttemptDate, formatDuration, modelLabel } from "./attempt-format.ts";

type Loaded = { status: "loading" } | { status: "missing" } | { status: "ready"; attempt: AttemptView };

// Full detail of one of the user's attempts (CA5.3). The spec and the code are text only.
export function AttemptDetail({ id }: { id: string }) {
  const [loaded, setLoaded] = useState<Loaded>({ status: "loading" });

  useEffect(() => {
    let active = true;
    void readAttempt(id).then((attempt) => {
      if (active) setLoaded(attempt ? { status: "ready", attempt } : { status: "missing" });
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (loaded.status === "loading") return <p role="status">Loading the attempt…</p>;
  if (loaded.status === "missing") return <p>Attempt not found.</p>;
  const { attempt } = loaded;
  const kata = findKata(attempt.kataId);
  return (
    <article className="attempt-detail">
      <p>
        Kata: {kata ? <Link href={`/katas/${kata.id}`}>{kata.title}</Link> : attempt.kataId} · {formatAttemptDate(attempt.createdAt)}
      </p>
      <p className="attempt-meta">
        {modelLabel(attempt)} · {formatDuration(attempt.latencyMs)} · {attempt.inputTokens ?? 0} input tokens ·{" "}
        {attempt.outputTokens ?? 0} output tokens
      </p>
      <h2>Specification</h2>
      <pre className="attempt-code">
        <code>{attempt.spec}</code>
      </pre>
      <h2>Generated code</h2>
      {attempt.code ? (
        <pre className="attempt-code">
          <code>{attempt.code}</code>
        </pre>
      ) : (
        <p>No code.</p>
      )}
      {attempt.truncated && <p>The answer was cut off by the token limit.</p>}
      <h2>Result</h2>
      {attempt.status === "error" && <p role="alert">{describeErrorCategory(attempt.errorCategory ?? "")}</p>}
      {attempt.status === "generated" && <p>This attempt was never scored: the page was closed before its tests ran.</p>}
      {attempt.result && <SandboxResults report={{ status: "completed", outcomes: attempt.result.tests }} />}
    </article>
  );
}
