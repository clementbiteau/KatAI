import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getClientAuth } from "../firebase/client.ts";
import { describeAuthError, type AuthFlow } from "./errors.ts";

export type AuthResult = { ok: true } | { ok: false; message: string };

const UNAVAILABLE: AuthResult = { ok: false, message: "Sign-in is not available right now. Please try again later." };

function failure(error: unknown, flow: AuthFlow): AuthResult {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  return { ok: false, message: describeAuthError(code, flow) };
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  const auth = getClientAuth();
  if (!auth) return UNAVAILABLE;
  try {
    await createUserWithEmailAndPassword(auth, email.trim(), password);
    return { ok: true };
  } catch (error) {
    return failure(error, "sign-up");
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const auth = getClientAuth();
  if (!auth) return UNAVAILABLE;
  try {
    await signInWithEmailAndPassword(auth, email.trim(), password);
    return { ok: true };
  } catch (error) {
    return failure(error, "sign-in");
  }
}

// Answers the same way whether or not the account exists (CA1.8).
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const auth = getClientAuth();
  if (!auth) return UNAVAILABLE;
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { ok: true };
  } catch (error) {
    const unknownAccount = typeof error === "object" && error !== null && "code" in error && error.code === "auth/user-not-found";
    return unknownAccount ? { ok: true } : failure(error, "reset");
  }
}

export async function signOutUser(): Promise<void> {
  const auth = getClientAuth();
  if (auth) await signOut(auth);
}
