"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { watchKataRandoris } from "../../lib/randoris/reader.ts";
import { effectiveRandoriStatus, type RandoriStatus, type RandoriView } from "../../lib/randoris/view.ts";
import { formatAttemptDate } from "../history/attempt-format.ts";
import { formatClock } from "./randori-display.ts";

const STATUS_TEXT: Record<RandoriStatus, string> = { running: "In progress", succeeded: "Solved", timeout: "Time is up", abandoned: "Abandoned" };

// Statuses are made effective when the data arrives, not during rendering: a running
// randori past its deadline shows as over.
function useKataRandoris(uid: string, kataId: string): RandoriView[] | "error" | null {
  const [randoris, setRandoris] = useState<RandoriView[] | "error" | null>(null);
  useEffect(
    () =>
      watchKataRandoris(
        uid,
        kataId,
        (list) => setRandoris(list.map((randori) => ({ ...randori, status: effectiveRandoriStatus(randori, Date.now()) }))),
        () => setRandoris("error"),
      ),
    [uid, kataId],
  );
  return randoris;
}

// The user's past randoris on one kata, most recent first (CA7.11).
export function RandoriHistory({ uid, kataId }: { uid: string; kataId: string }) {
  const randoris = useKataRandoris(uid, kataId);
  if (randoris === null) return null;
  if (randoris === "error") return <p role="alert">Your randoris could not be loaded.</p>;
  if (randoris.length === 0) return <p className="empty-state">No randori yet on this kata.</p>;
  return (
    <div className="table-scroll">
      <table className="attempt-table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Status</th>
            <th scope="col">Best score</th>
            <th scope="col">Time</th>
            <th scope="col">Attempts</th>
            <th scope="col">
              <span className="visually-hidden">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {randoris.map((randori) => (
            <tr key={randori.id}>
              <td>{formatAttemptDate(randori.startedAt)}</td>
              <td>{STATUS_TEXT[randori.status]}</td>
              <td>
                {randori.bestPassed} / {randori.total}
              </td>
              <td>{randori.bestElapsedMs === null ? "—" : formatClock(randori.bestElapsedMs)}</td>
              <td>{randori.attemptsCount}</td>
              <td>
                <Link href={`/randori/${randori.id}`}>{randori.status === "running" ? "Resume" : "View"}</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
