"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AttemptView } from "../../lib/attempts/view.ts";
import { describeAttemptScore, formatAttemptDate, formatDuration, modelLabel } from "./attempt-format.ts";
import { useKataAttempts } from "./use-kata-attempts.ts";

const STATUS_TEXT: Record<AttemptView["status"], string> = { done: "Scored", error: "Call failed", generated: "Not scored" };

// The user's attempts on one kata, most recent first (US5). Exactly two selected
// attempts can be compared, the older one first (US6).
export function AttemptHistory({ uid, kataId }: { uid: string; kataId: string }) {
  const history = useKataAttempts(uid, kataId);
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));

  if (history.status === "loading") return <p role="status">Loading your attempts…</p>;
  if (history.status === "error") return <p role="alert">Your attempts could not be loaded. Please reload the page.</p>;
  if (history.attempts.length === 0) return <p>No attempt yet. Write your first spec above.</p>;
  const olderFirst = history.attempts.map((attempt) => attempt.id).filter((id) => selected.includes(id)).reverse();
  return (
    <>
      <table className="attempt-table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Model</th>
            <th scope="col">Score</th>
            <th scope="col">Duration</th>
            <th scope="col">Status</th>
            <th scope="col">
              <span className="visually-hidden">Details and selection</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {history.attempts.map((attempt) => (
            <tr key={attempt.id}>
              <td>{formatAttemptDate(attempt.createdAt)}</td>
              <td>{modelLabel(attempt)}</td>
              <td>{describeAttemptScore(attempt)}</td>
              <td>{formatDuration(attempt.latencyMs)}</td>
              <td>{STATUS_TEXT[attempt.status]}</td>
              <td className="attempt-actions">
                <Link href={`/attempts/${attempt.id}`}>View</Link>
                <input
                  type="checkbox"
                  aria-label={`Select the attempt of ${formatAttemptDate(attempt.createdAt)} for comparison`}
                  checked={selected.includes(attempt.id)}
                  onChange={() => toggle(attempt.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {history.attempts.length < 2 ? (
        <p>Make at least two attempts to compare them.</p>
      ) : (
        <button
          type="button"
          disabled={olderFirst.length !== 2}
          onClick={() => router.push(`/compare?a=${olderFirst[0]}&b=${olderFirst[1]}`)}
        >
          Compare selected
        </button>
      )}
    </>
  );
}
