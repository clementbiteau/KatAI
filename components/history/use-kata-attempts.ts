"use client";

import { useEffect, useState } from "react";
import type { AttemptView } from "../../lib/attempts/view.ts";
import { watchKataAttempts } from "../../lib/attempts/reader.ts";

export type KataAttempts = { status: "loading" } | { status: "ready"; attempts: AttemptView[] } | { status: "error" };

// Live history of the user's attempts on a kata: a new attempt or a new score shows up
// without reloading the page.
export function useKataAttempts(uid: string, kataId: string): KataAttempts {
  const [state, setState] = useState<KataAttempts>({ status: "loading" });

  useEffect(
    () =>
      watchKataAttempts(
        uid,
        kataId,
        (attempts) => setState({ status: "ready", attempts }),
        () => setState({ status: "error" }),
      ),
    [uid, kataId],
  );

  return state;
}
