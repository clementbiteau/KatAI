"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuthState } from "./auth-context.tsx";

// Client-side guard for pages that need a session (CA1.7). It is a convenience for the
// user only: data stays protected by the Firestore rules and the server routes.
export function RequireAuth({ children }: { children: ReactNode }) {
  const state = useAuthState();
  const router = useRouter();

  // The full path, query included, so that /compare?a=…&b=… survives the sign-in.
  useEffect(() => {
    if (state.status !== "signed-out") return;
    const next = `${window.location.pathname}${window.location.search}`;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [state.status, router]);

  if (state.status === "signed-in") return <>{children}</>;
  if (state.status === "unavailable") {
    return <p role="status">Sign-in is not available right now. Please try again later.</p>;
  }
  return <p role="status">Loading…</p>;
}
