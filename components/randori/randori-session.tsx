"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { findKata } from "../../katas/catalog.ts";
import { watchRandori } from "../../lib/randoris/reader.ts";
import type { RandoriView } from "../../lib/randoris/view.ts";
import { AttemptForm } from "../kata/kata-workspace.tsx";
import { KataBrief } from "../kata/kata-brief.tsx";
import { describeRandori, formatClock, useRemainingMs } from "./randori-display.ts";
import { abandonRandoriRequest, fetchRandori } from "./randori-api.ts";

type Loaded = { status: "loading" } | { status: "missing" } | { status: "ready"; randori: RandoriView; offsetMs: number };

function RandoriPanel({ randori, offsetMs, onAbandoned }: { randori: RandoriView; offsetMs: number; onAbandoned: (randori: RandoriView) => void }) {
  const remaining = useRemainingMs(randori.deadline, offsetMs);
  const [error, setError] = useState<string | null>(null);
  const kata = findKata(randori.kataId);
  const summary = describeRandori(randori, remaining === 0);

  const handleAbandon = async () => {
    const answer = await abandonRandoriRequest(randori.id);
    if (answer.ok) onAbandoned(answer.randori);
    else setError(answer.error);
  };

  if (!kata) return <p>Randori not found.</p>;
  return (
    <article className="randori-session">
      <p className="randori-clock">
        Time left: <span data-testid="countdown">{formatClock(remaining)}</span>
      </p>
      {summary.over ? (
        <p role="status" className="randori-outcome">
          {summary.text} <Link href="/randori">Back to the randoris</Link>
        </p>
      ) : (
        <p>
          {summary.text}{" "}
          <button type="button" className="button-secondary" onClick={handleAbandon}>
            Abandon
          </button>
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      <h2>{kata.title}</h2>
      <KataBrief brief={kata.brief} />
      <pre className="attempt-code">
        <code>{kata.signature}</code>
      </pre>
      {randori.status === "running" && <AttemptForm kata={kata} randoriId={randori.id} closed={remaining === 0} />}
    </article>
  );
}

// A live randori: the server gives its time once to correct the browser clock, then the
// randori is followed live as attempts and results come in (US7, CA7.7).
export function RandoriSession({ id }: { id: string }) {
  const [loaded, setLoaded] = useState<Loaded>({ status: "loading" });

  useEffect(() => {
    let active = true;
    let stopWatching: (() => void) | null = null;
    void fetchRandori(id).then((answer) => {
      if (!active) return;
      if (!answer.ok) return setLoaded({ status: "missing" });
      setLoaded({ status: "ready", randori: answer.randori, offsetMs: Date.parse(answer.serverNow) - Date.now() });
      stopWatching = watchRandori(
        id,
        (randori) => setLoaded((current) => (current.status === "ready" ? { ...current, randori } : current)),
        () => undefined,
      );
    });
    return () => {
      active = false;
      stopWatching?.();
    };
  }, [id]);

  if (loaded.status === "loading") return <p role="status">Loading the randori…</p>;
  if (loaded.status === "missing") return <p className="empty-state">Randori not found.</p>;
  return (
    <RandoriPanel
      randori={loaded.randori}
      offsetMs={loaded.offsetMs}
      onAbandoned={(randori) => setLoaded((current) => (current.status === "ready" ? { ...current, randori } : current))}
    />
  );
}
