import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home">
      <h1>KatAI</h1>
      <p>Practice writing specs that an AI model turns into working code.</p>
      <p>
        <Link href="/katas">Browse the katas</Link>
      </p>
    </main>
  );
}
