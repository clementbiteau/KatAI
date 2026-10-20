import { expect, test } from "@playwright/test";
import { KATAS } from "../../../katas/catalog.ts";
import { runKataTests } from "../../../katas/evaluate.ts";
import { toGeneratedCode } from "../helpers.ts";

// Runs on a production build (npm run test:e2e), so it also proves that the
// evaluator survives the Next.js production compiler once serialized into the worker.

async function expectedPassCount(kataId: string, solution: "reference" | "naive"): Promise<number> {
  const solutions = await import(`../../katas/solutions/${kataId}.ts`);
  const kata = KATAS.find((candidate) => candidate.id === kataId)!;
  return runKataTests(solutions[solution], kata.tests).filter((outcome) => outcome.status === "passed").length;
}

for (const kata of KATAS) {
  for (const solution of ["reference", "naive"] as const) {
    test(`${kata.id}: the ${solution} solution gets the same score in the browser as in Node`, async ({ page }) => {
      const passed = await expectedPassCount(kata.id, solution);
      await page.goto("/e2e-sandbox");
      await page.getByLabel("Kata").selectOption(kata.id);
      await page.getByLabel("Generated code").fill(toGeneratedCode(kata.id, kata.functionName, solution));
      await page.getByRole("button", { name: "Run tests" }).click();
      await expect(page.getByTestId("score")).toHaveText(`${passed} / ${kata.tests.length} tests passed`);
      if (solution === "reference") expect(passed).toBe(kata.tests.length);
    });
  }
}
