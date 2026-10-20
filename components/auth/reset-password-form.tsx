"use client";

import { useState, type FormEvent } from "react";
import { requestPasswordReset } from "../../lib/auth/service.ts";

const NEUTRAL_CONFIRMATION = "If an account exists for this email, we have sent a link to reset your password.";

// Never reveals whether an account exists (CA1.8). The link opens Firebase's own reset page,
// which also handles expired or already used links (CA1.9). The email is read when the form
// is sent, so text typed before React takes over the page is never lost.
export function ResetPasswordForm() {
  const [message, setMessage] = useState<{ text: string; role: "status" | "alert" } | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    const result = await requestPasswordReset(String(new FormData(event.currentTarget).get("email") ?? ""));
    setMessage(result.ok ? { text: NEUTRAL_CONFIRMATION, role: "status" } : { text: result.message, role: "alert" });
    setPending(false);
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      {message && <p role={message.role}>{message.text}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
