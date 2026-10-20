import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KataBrief } from "../../../components/kata/kata-brief.tsx";
import { KataWorkspace } from "../../../components/kata/kata-workspace.tsx";
import { findKata, KATAS, LEVEL_LABELS, SECTOR_LABELS, STAGE_LABELS } from "../../../katas/catalog.ts";

type Params = { params: Promise<{ id: string }> };

// Only the catalog's katas exist: any other id answers 404 (CA3.3).
export const dynamicParams = false;

export function generateStaticParams() {
  return KATAS.map((kata) => ({ id: kata.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const kata = findKata((await params).id);
  return { title: kata ? `${kata.title} · KatAI` : "Kata not found · KatAI" };
}

// The brief and the expected function are public. Test labels only appear with the
// results of an attempt (H5); before that, only their number is shown.
export default async function KataPage({ params }: Params) {
  const kata = findKata((await params).id);
  if (!kata) notFound();
  return (
    <main className="page kata-page">
      <p>
        <Link href="/katas">All katas</Link>
      </p>
      <h1>{kata.title}</h1>
      <p className="kata-meta">
        {SECTOR_LABELS[kata.sector]} · {LEVEL_LABELS[kata.level]} · {STAGE_LABELS[kata.stage]}
      </p>
      <p>
        <strong>What you practice:</strong> {kata.practice}
      </p>
      <section aria-label="Client brief">
        <h2>Client brief</h2>
        <KataBrief brief={kata.brief} />
      </section>
      <section aria-label="Expected function">
        <h2>Expected function</h2>
        <pre className="attempt-code">
          <code>{kata.signature}</code>
        </pre>
        <p>{kata.tests.length} hidden acceptance tests will score the generated code.</p>
      </section>
      <section aria-label="Your attempt">
        <h2>Your spec</h2>
        <p>
          Your model only receives your specification and the expected function, never the brief. Make sure your spec
          says everything the client needs.
        </p>
        <KataWorkspace kata={kata} />
      </section>
    </main>
  );
}
