import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CredentialsForm } from "../../components/auth/credentials-form.tsx";

export const metadata: Metadata = { title: "Create an account · KatAI" };

export default function SignupPage() {
  return (
    <main className="page">
      <h1>Create an account</h1>
      <Suspense>
        <CredentialsForm mode="sign-up" />
      </Suspense>
      <p>
        Already registered? <Link href="/login">Sign in</Link>
      </p>
    </main>
  );
}
