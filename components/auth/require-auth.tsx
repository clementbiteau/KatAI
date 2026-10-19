"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuthState } from "./auth-context.tsx";

// Client-side guard for pages that need a session (CA1.7). It is a convenience for the
// user only: data stays protected by the Firestore rules and the server routes.
export function RequireAuth({ children }: { children: ReactNode }) {
  const state = useAuthState();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (state.status === "signed-out") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [state.status, router, pathname]);

  if (state.status === "signed-in") return <>{children}</>;
  if (state.status === "unavailable") {
    return <p role="status">Sign-in is not available right now. Please try again later.</p>;
  }
  return <p role="status">Loading…</p>;
}
