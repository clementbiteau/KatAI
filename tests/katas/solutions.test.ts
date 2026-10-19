import { describe, expect, it } from "vitest";
import { findKata } from "../../katas/catalog.ts";
import { runKataTests } from "../../katas/evaluate.ts";
import * as bankingTransferGuard from "./solutions/banking-transfer-guard.ts";
import * as luxuryEngraving from "./solutions/luxury-engraving.ts";
import * as retailCart from "./solutions/retail-cart.ts";

// Each kata must be solvable (reference passes everything) and discriminating
// (a plausible but naive solution fails at least two tests).
const solutionsByKata = [
  { id: "retail-cart", ...retailCart },
  { id: "luxury-engraving", ...luxuryEngraving },
  { id: "banking-transfer-guard", ...bankingTransferGuard },
];

describe.each(solutionsByKata)("$id", ({ id, reference, naive }) => {
  const kata = findKata(id);
  if (!kata) throw new Error(`Unknown kata ${id}`);

  it("is fully solved by the reference solution", () => {
    const failed = runKataTests(reference, kata.tests).filter((outcome) => outcome.status !== "passed");
    expect(failed).toEqual([]);
  });

  it("catches a naive solution on at least two tests", () => {
    const failed = runKataTests(naive, kata.tests).filter((outcome) => outcome.status === "failed");
    expect(failed.length).toBeGreaterThanOrEqual(2);
  });
});
