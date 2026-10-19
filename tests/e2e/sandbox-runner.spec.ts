import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import ts from "typescript";
import { KATAS } from "../../katas/catalog.ts";
import { runKataTests } from "../../katas/evaluate.ts";

// Runs on a production build (npm run test:e2e), so it also proves that the
// evaluator survives the Next.js production compiler once serialized into the worker.

// Turns a verified solution file into plain JavaScript that defines the kata's function,
// like a model's answer would.
function toGeneratedCode(kataId: string, functionName: string, solution: "reference" | "naive"): string {
  const source = readFileSync(resolve(import.meta.dirname, `../katas/solutions/${kataId}.ts`), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  return `${outputText.replace(/^export /gm, "")}\nvar ${functionName} = ${solution};\n`;
}

async function expectedPassCount(kataId: string, solution: "reference" | "naive"): Promise<number> {
  const solutions = await import(`../katas/solutions/${kataId}.ts`);
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
