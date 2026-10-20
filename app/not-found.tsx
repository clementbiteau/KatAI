import Link from "next/link";

// Shown for unknown pages, including unknown kata ids (CA3.3).
export default function NotFound() {
  return (
    <main className="page">
      <h1>Not found</h1>
      <p>This page or kata does not exist.</p>
      <p>
        <Link href="/katas">Browse the katas</Link>
      </p>
    </main>
  );
}
