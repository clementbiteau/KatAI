"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOutUser } from "../../lib/auth/service.ts";
import { useAuthState } from "./auth-context.tsx";

export function SiteHeader() {
  const state = useAuthState();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOutUser();
    router.push("/");
  };

  return (
    <header className="site-header">
      <Link href="/" className="site-brand">
        KatAI
      </Link>
      <nav aria-label="Account">
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
