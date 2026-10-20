"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { findKata } from "../../katas/catalog.ts";
import type { AttemptView } from "../../lib/attempts/view.ts";
import { readAttempt } from "../../lib/attempts/reader.ts";
import { buildComparisonRows, comparisonProblem, orderByDate } from "./comparison-rows.ts";

type Loaded = { status: "loading" } | { status: "problem"; message: string } | { status: "ready"; pair: [AttemptView, AttemptView] };

// Two of the user's attempts on the same kata, side by side (US6).
export function AttemptComparison({ firstId, secondId }: { firstId: string; secondId: string }) {
  const [loaded, setLoaded] = useState<Loaded>({ status: "loading" });

  useEffect(() => {
    let active = true;
    const ids = [firstId, secondId];
    void Promise.all(ids.map((id) => (id ? readAttempt(id) : Promise.resolve(null)))).then((attempts) => {
      if (!active) return;
      const problem = comparisonProblem(firstId, secondId, attempts);
      setLoaded(problem ? { status: "problem", message: problem } : { status: "ready", pair: orderByDate(attempts[0]!, attempts[1]!) });
    });
    return () => {
      active = false;
    };
  }, [firstId, secondId]);

  if (loaded.status === "loading") return <p role="status">Loading the attempts…</p>;
  if (loaded.status === "problem") return <p className="empty-state">{loaded.message}</p>;
  const [left, right] = loaded.pair;
  const kata = findKata(left.kataId);
  return (
    <>
      <p>Kata: {kata ? <Link href={`/katas/${kata.id}`}>{kata.title}</Link> : left.kataId}</p>
      <div className="table-scroll">
        <table className="comparison-table">
          <thead>
            <tr>
              <th scope="col">
                <span className="visually-hidden">Field</span>
              </th>
              <th scope="col">Older attempt</th>
              <th scope="col">Newer attempt</th>
            </tr>
          </thead>
          <tbody>
            {buildComparisonRows(left, right).map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {row.values.map((value, index) => (
                  <td key={index}>{row.preformatted && value !== "—" ? <pre className="attempt-code">{value}</pre> : value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
