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
      <div className="site-header-inner">
        <Link href="/" className="site-brand">
          KatAI
        </Link>
        <nav aria-label="Main" className="site-nav">
          <Link href="/katas">Katas</Link>
          <Link href="/randori">Randori</Link>
        </nav>
        <nav aria-label="Account" className="site-nav site-account">
          {state.status === "signed-in" && (
            <>
              <span className="site-email">{state.user.email}</span>
              <Link href="/settings">Settings</Link>
              <button type="button" className="button-quiet" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          )}
          {state.status === "signed-out" && (
            <>
              <Link href="/login">Sign in</Link>
              <Link href="/signup" className="button button-small">
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
