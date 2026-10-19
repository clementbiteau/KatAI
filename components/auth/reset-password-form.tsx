"use client";

import { useState, type FormEvent } from "react";
import { requestPasswordReset } from "../../lib/auth/service.ts";

const NEUTRAL_CONFIRMATION = "If an account exists for this email, we have sent a link to reset your password.";

// Never reveals whether an account exists (CA1.8). The link opens Firebase's own reset page,
// which also handles expired or already used links (CA1.9).
export function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ text: string; role: "status" | "alert" } | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    const result = await requestPasswordReset(email);
    setMessage(result.ok ? { text: NEUTRAL_CONFIRMATION, role: "status" } : { text: result.message, role: "alert" });
    setPending(false);
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <label>
        Email
        <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      {message && <p role={message.role}>{message.text}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
