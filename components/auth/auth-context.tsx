"use client";

import { onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getClientAuth, isFirebaseConfigured } from "../../lib/firebase/client.ts";

export type AuthState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "signed-out" }
  | { status: "signed-in"; user: { uid: string; email: string | null } };

const AuthContext = createContext<AuthState>({ status: "loading" });

// Tracks the Firebase session for the whole app. "unavailable" means Firebase is not configured.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() =>
    isFirebaseConfigured() ? { status: "loading" } : { status: "unavailable" },
  );

  useEffect(() => {
    const auth = getClientAuth();
    if (!auth) return;
    return onAuthStateChanged(auth, (user) =>
      setState(user ? { status: "signed-in", user: { uid: user.uid, email: user.email } } : { status: "signed-out" }),
    );
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuthState(): AuthState {
  return useContext(AuthContext);
}
