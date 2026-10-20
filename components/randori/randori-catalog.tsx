"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { KATAS, LEVEL_LABELS, randoriMinutes } from "../../katas/catalog.ts";
import { useAuthState } from "../auth/auth-context.tsx";
import { startRandoriRequest } from "./randori-api.ts";
import { RandoriHistory } from "./randori-history.tsx";

type StartProblem = { kataId: string; error: string; code?: string; randoriId?: string };

// The katas available as randoris, each with its time limit and the user's past randoris.
export function RandoriCatalog() {
  const auth = useAuthState();
  const router = useRouter();
  const [problem, setProblem] = useState<StartProblem | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  const handleStart = async (kataId: string) => {
    setStarting(kataId);
    setProblem(null);
    const answer = await startRandoriRequest(kataId);
    if (answer.ok) return router.push(`/randori/${answer.randori.id}`);
    setProblem({ kataId, error: answer.error, code: answer.code, randoriId: answer.randoriId });
    setStarting(null);
  };

  return (
    <ul className="kata-list">
      {KATAS.map((kata) => (
        <li key={kata.id}>
          <h2>{kata.title}</h2>
          <p className="kata-meta">
            {LEVEL_LABELS[kata.level]} · {randoriMinutes(kata.level)} minutes
          </p>
          <p>{kata.summary}</p>
          {auth.status === "signed-in" ? (
            <>
              <button type="button" disabled={starting !== null} onClick={() => handleStart(kata.id)}>
                {starting === kata.id ? "Starting…" : "Start randori"}
              </button>
              {problem?.kataId === kata.id && (
                <p role="alert">
                  {problem.error}{" "}
                  {problem.code === "randori-in-progress" && <Link href={`/randori/${problem.randoriId}`}>Resume your running randori</Link>}
                  {problem.code === "missing-key" && <Link href="/settings">Open Settings</Link>}
                </p>
              )}
              <RandoriHistory uid={auth.user.uid} kataId={kata.id} />
            </>
          ) : (
            <p>
              <Link href={`/login?next=${encodeURIComponent("/randori")}`}>Sign in to start a randori</Link>
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
