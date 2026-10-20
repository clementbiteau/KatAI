import type { Metadata } from "next";
import { RequireAuth } from "../../../components/auth/require-auth.tsx";
import { RandoriSession } from "../../../components/randori/randori-session.tsx";

export const metadata: Metadata = { title: "Randori in progress · KatAI" };

export default async function RandoriSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="page">
      <h1>Randori</h1>
      <RequireAuth>
        <RandoriSession id={id} />
      </RequireAuth>
    </main>
  );
}
