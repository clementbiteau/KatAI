"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signIn, signUp } from "../../lib/auth/service.ts";
import { safeRedirectPath, validateCredentials } from "../../lib/auth/validation.ts";

const COPY = {
  "sign-in": { submit: "Sign in", pending: "Signing in…", autoComplete: "current-password" },
  "sign-up": { submit: "Create account", pending: "Creating account…", autoComplete: "new-password" },
} as const;

// Email and password form shared by the sign-in and sign-up pages. On success it goes
// to the internal page the user was heading to, or to the home page.
export function CredentialsForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invalid = mode === "sign-up" ? validateCredentials(email, password) : null;
    if (invalid) {
      setError(invalid);
      return;
    }
    setPending(true);
    setError(null);
    const result = await (mode === "sign-in" ? signIn : signUp)(email, password);
    if (result.ok) {
      router.push(safeRedirectPath(searchParams.get("next")));
      return;
    }
    setError(result.message);
    setPending(false);
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <label>
        Email
        <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      <label>
        Password
        <input
          type="password"
          autoComplete={COPY[mode].autoComplete}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? COPY[mode].pending : COPY[mode].submit}
      </button>
    </form>
  );
}
