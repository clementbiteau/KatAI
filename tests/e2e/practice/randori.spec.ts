import { expect, test, type Page } from "@playwright/test";
import { findKata } from "../../../katas/catalog.ts";
import { saveAnthropicKey, signUp, toGeneratedCode, uniqueEmail } from "../helpers.ts";

// Randori flows on the emulator-backed production build, with the echo provider.
const kata = findKata("retail-cart")!;

async function submitCode(page: Page, solution: "reference" | "naive") {
  await page.getByLabel("Your specification").fill("```javascript\n" + toGeneratedCode(kata.id, kata.functionName, solution) + "```");
  await page.getByRole("button", { name: "Generate and test" }).click();
}

test("a randori runs on the server clock, survives a reload and ends at the first perfect score (CA7.1 to CA7.3, CA7.7, CA7.11)", async ({ page }, testInfo) => {
  await signUp(page, uniqueEmail(testInfo.project.name), "correct-horse");
  await saveAnthropicKey(page);
  await page.goto("/randori");
  const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: kata.title }) });
  await expect(card.getByText("Easy · 10 minutes")).toBeVisible();
  await card.getByRole("button", { name: "Start randori" }).click();

  await expect(page).toHaveURL(/\/randori\/[^/]+$/);
  await expect(page.getByTestId("countdown")).toHaveText(/^(10:00|9:[0-5]\d)$/);
  await page.reload();
  await expect(page.getByTestId("countdown")).toHaveText(/^(10:00|9:[0-5]\d)$/);

  await submitCode(page, "naive");
  await expect(page.getByTestId("score")).toHaveText("4 / 12 tests passed");
  await expect(page.getByText("Best score: 4 / 12 · 1 attempt")).toBeVisible();
  await submitCode(page, "reference");
  await expect(page.getByText(/^Solved in 0:\d\d with 2 attempts\./)).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate and test" })).toHaveCount(0);

  await page.goto("/randori");
  const row = card.getByRole("row").nth(1);
  await expect(row.getByRole("cell").nth(1)).toHaveText("Solved");
  await expect(row.getByRole("cell").nth(2)).toHaveText("12 / 12");
  await expect(row.getByRole("cell").nth(4)).toHaveText("2");
});

test("one randori at a time, a key is required, and a randori can be abandoned (CA7.8 to CA7.10)", async ({ page }, testInfo) => {
  await signUp(page, uniqueEmail(testInfo.project.name), "correct-horse");
  await page.goto("/randori");
  const cards = page.getByRole("listitem");
  await cards.first().getByRole("button", { name: "Start randori" }).click();
  await expect(cards.first().getByRole("alert")).toContainText("Add your Anthropic API key in Settings first.");
  await expect(cards.first().getByRole("link", { name: "Open Settings" })).toBeVisible();

  await saveAnthropicKey(page);
  await page.goto("/randori");
  await cards.first().getByRole("button", { name: "Start randori" }).click();
  await expect(page).toHaveURL(/\/randori\/[^/]+$/);
  const runningUrl = page.url();

  await page.goto("/randori");
  await cards.nth(1).getByRole("button", { name: "Start randori" }).click();
  await cards.nth(1).getByRole("link", { name: "Resume your running randori" }).click();
  await expect(page).toHaveURL(runningUrl);

  await page.getByRole("button", { name: "Abandon" }).click();
  await expect(page.getByText("Randori abandoned. Best score: 0 / 12 after 0 attempts.")).toBeVisible();
});
