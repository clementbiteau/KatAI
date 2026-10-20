import type { Metadata } from "next";
import { RandoriCatalog } from "../../components/randori/randori-catalog.tsx";

export const metadata: Metadata = { title: "Randori · KatAI" };

// The Randori section: the same katas against the clock (US7).
export default function RandoriPage() {
  return (
    <main className="page">
      <h1>Randori</h1>
      <p>
        Solve a kata against the clock. The countdown is kept by the server, so it keeps running if you close the page.
        A randori ends at the first perfect score, when the time is up, or when you abandon it.
      </p>
      <RandoriCatalog />
    </main>
  );
}
