import type { Metadata } from "next";
import { RequireAuth } from "../../components/auth/require-auth.tsx";
import { AttemptComparison } from "../../components/compare/attempt-comparison.tsx";

export const metadata: Metadata = { title: "Compare attempts · KatAI" };

type SearchParams = Promise<{ a?: string | string[]; b?: string | string[] }>;

function single(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

// Comparison of two attempts, picked from a kata's history (US6). A flat route with
// query parameters keeps the app folder within three levels.
export default async function ComparePage({ searchParams }: { searchParams: SearchParams }) {
  const { a, b } = await searchParams;
  return (
    <main className="page page-wide">
      <h1>Compare attempts</h1>
      <RequireAuth>
        <AttemptComparison firstId={single(a)} secondId={single(b)} />
      </RequireAuth>
    </main>
  );
}
