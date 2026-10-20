import type { Metadata } from "next";
import Link from "next/link";
import { KATAS, LEVEL_LABELS, SECTOR_LABELS, STAGE_LABELS } from "../../katas/catalog.ts";

export const metadata: Metadata = { title: "Katas · KatAI" };

// Public catalog (CA3.1): visitors can browse before signing in (H6).
export default function KatasPage() {
  return (
    <main className="page">
      <h1>Katas</h1>
      <p>
        Each kata is a fictional client brief. Write a specification, let your model build it, and the client&apos;s
        hidden acceptance tests score the result.
      </p>
      <ul className="kata-list">
        {KATAS.map((kata) => (
          <li key={kata.id}>
            <h2>
              <Link href={`/katas/${kata.id}`}>{kata.title}</Link>
            </h2>
            <p className="kata-meta">
              {SECTOR_LABELS[kata.sector]} · {LEVEL_LABELS[kata.level]} · {STAGE_LABELS[kata.stage]}
            </p>
            <p>{kata.summary}</p>
            <p>
              <strong>What you practice:</strong> {kata.practice}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
