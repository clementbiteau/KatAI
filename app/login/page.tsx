import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CredentialsForm } from "../../components/auth/credentials-form.tsx";

export const metadata: Metadata = { title: "Sign in · KatAI" };

export default function LoginPage() {
  return (
    <main className="page">
      <h1>Sign in</h1>
      <Suspense>
        <CredentialsForm mode="sign-in" />
      </Suspense>
      <p>
        <Link href="/reset-password">Forgot your password?</Link>
      </p>
      <p>
        New to KatAI? <Link href="/signup">Create an account</Link>
      </p>
    </main>
  );
}
