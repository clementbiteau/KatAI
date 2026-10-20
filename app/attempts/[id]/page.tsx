import type { Metadata } from "next";
import { RequireAuth } from "../../../components/auth/require-auth.tsx";
import { AttemptDetail } from "../../../components/history/attempt-detail.tsx";

export const metadata: Metadata = { title: "Attempt · KatAI" };

// Detail of one attempt (CA5.3). Only its owner can read it: the Firestore rules refuse
// anyone else, and that case shows the same "not found" message as a missing attempt.
export default async function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="page">
      <h1>Attempt</h1>
      <RequireAuth>
        <AttemptDetail id={id} />
      </RequireAuth>
    </main>
  );
}
