import { describe, expect, it } from "vitest";
import { findKata } from "../../katas/catalog.ts";
import { runKataTests } from "../../katas/evaluate.ts";
import * as cartTotal from "./solutions/cart-total.ts";
import * as freeSlots from "./solutions/free-slots.ts";
import * as slugify from "./solutions/slugify.ts";

// Each kata must be solvable (reference passes everything) and discriminating
// (a plausible but naive solution fails at least two tests).
const solutionsByKata = [
  { id: "cart-total", ...cartTotal },
  { id: "slugify", ...slugify },
  { id: "free-slots", ...freeSlots },
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
