import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "../../components/auth/reset-password-form.tsx";

export const metadata: Metadata = { title: "Reset your password · KatAI" };

export default function ResetPasswordPage() {
  return (
    <main className="page">
      <h1>Reset your password</h1>
      <p>Enter the email of your account. We will send you a link to choose a new password.</p>
      <ResetPasswordForm />
      <p>
        <Link href="/login">Back to sign in</Link>
      </p>
    </main>
  );
}
