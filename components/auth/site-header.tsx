"use client";

import Link from "next/link";
import { signOutUser } from "../../lib/auth/service.ts";
import { useAuthState } from "./auth-context.tsx";

export function SiteHeader() {
  const state = useAuthState();

  // No navigation here: a public page stays as it is, and a protected page sends the
  // visitor to sign in through RequireAuth. One navigation only, so no race between two.
  const handleSignOut = () => {
    void signOutUser();
  };

  return (
    <header className="site-header">
      <Link href="/" className="site-brand">
        KatAI
      </Link>
      <nav aria-label="Account">
        <Link href="/katas">Katas</Link>
        {state.status === "signed-in" && (
          <>
            <span className="site-account">{state.user.email}</span>
            <Link href="/settings">Settings</Link>
            <button type="button" onClick={handleSignOut}>
              Sign out
            </button>
          </>
        )}
        {state.status === "signed-out" && (
          <>
            <Link href="/login">Sign in</Link>
            <Link href="/signup">Create account</Link>
          </>
        )}
      </nav>
    </header>
  );
}
