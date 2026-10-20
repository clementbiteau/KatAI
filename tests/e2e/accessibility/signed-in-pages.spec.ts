import { expect, test } from "@playwright/test";
import { findKata } from "../../../katas/catalog.ts";
import { saveAnthropicKey, signUp, toGeneratedCode, uniqueEmail } from "../helpers.ts";
import { expectFitsMobileWidth, expectNoSeriousViolations } from "./checks.ts";

// T24: the pages of a signed-in user, each with real content (results, history, comparison,
// randori), in light and dark mode and at phone width. The echo provider returns the spec's code.
const kata = findKata("retail-cart")!;

test("signed-in pages have no serious accessibility violation and fit a phone", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await signUp(page, uniqueEmail(testInfo.project.name), "correct-horse");
  await expectNoSeriousViolations(page);
  await saveAnthropicKey(page);
  await expectNoSeriousViolations(page);
  await expectFitsMobileWidth(page);

  await page.goto(`/katas/${kata.id}`);
  await expect(page.getByText("No attempt yet.")).toBeVisible();
  await expectNoSeriousViolations(page);
  for (const [solution, score] of [["reference", "12 / 12"], ["naive", "4 / 12"]] as const) {
    await page.getByLabel("Your specification").fill("```javascript\n" + toGeneratedCode(kata.id, kata.functionName, solution) + "```");
    await page.getByRole("button", { name: "Generate and test" }).click();
    await expect(page.getByTestId("score")).toHaveText(`${score} tests passed`);
  }
  const history = page.getByRole("region", { name: "Your attempts" });
  await expect(history.getByRole("row")).toHaveCount(3);
  await expectNoSeriousViolations(page);
  await expectFitsMobileWidth(page);

  await history.getByRole("link", { name: "View" }).first().click();
  await expect(page.getByRole("heading", { name: "Generated code" })).toBeVisible();
  await expectNoSeriousViolations(page);
  await expectFitsMobileWidth(page);

  await page.goBack();
  await expect(history.getByRole("row")).toHaveCount(3);
  for (const checkbox of await history.getByRole("checkbox").all()) await checkbox.check();
  await page.getByRole("button", { name: "Compare selected" }).click();
  await expect(page.getByRole("columnheader", { name: "Newer attempt" })).toBeVisible();
  await expectNoSeriousViolations(page);
  await expectFitsMobileWidth(page);

  await page.goto("/randori");
  const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: kata.title }) });
  await expect(card.getByText("No randori yet on this kata.")).toBeVisible();
  await expectNoSeriousViolations(page);
  await card.getByRole("button", { name: "Start randori" }).click();
  await expect(page.getByTestId("countdown")).toBeVisible();
  await expectNoSeriousViolations(page);
  await expectFitsMobileWidth(page);
});
