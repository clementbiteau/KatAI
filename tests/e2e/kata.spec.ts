import { expect, test, type Page } from "@playwright/test";
import { findKata } from "../../katas/catalog.ts";
import { signOut, signUp, toGeneratedCode, uniqueEmail } from "./helpers.ts";

// The production build runs with the echo provider (KATAI_FAKE_PROVIDER=1, emulators only):
// the "model" returns the code block written in the spec, so the flow is fully deterministic.
const kata = findKata("retail-cart")!;

async function saveKey(page: Page) {
  await page.goto("/settings");
  await page.getByLabel("Anthropic API key").fill("sk-ant-e2e-" + "k".repeat(40));
  await page.getByRole("button", { name: "Save key" }).click();
  await expect(page.getByText(/Configured on/)).toBeVisible();
}

async function submitSpec(page: Page, spec: string) {
  await page.getByLabel("Your specification").fill(spec);
  await page.getByRole("button", { name: "Generate and test" }).click();
}

test("a visitor browses the catalog and a kata, without seeing the tests (CA3.1, CA3.2, H5)", async ({ page }) => {
  await page.goto("/katas");
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(3);
  await expect(page.getByText("Retail · Easy · Specification")).toBeVisible();
  await page.getByRole("link", { name: kata.title }).click();
  await expect(page.getByRole("region", { name: "Client brief" })).toContainText("140 stores");
  await expect(page.getByText("12 hidden acceptance tests will score the generated code.")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(kata.tests[1]!.label);
  await expect(page.getByRole("link", { name: "Sign in to practice" })).toHaveAttribute("href", "/login?next=%2Fkatas%2Fretail-cart");
});

test("an unknown kata shows a not-found page with a way back (CA3.3)", async ({ page }) => {
  const response = await page.goto("/katas/does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("link", { name: "Browse the katas" })).toBeVisible();
});

test("without a key, the user is sent to Settings and keeps the spec (CA4.3)", async ({ page }, testInfo) => {
  await signUp(page, uniqueEmail(testInfo.project.name), "correct-horse");
  await page.goto(`/katas/${kata.id}`);
  await submitSpec(page, "Sum the cart.");
  // Scoped to the attempt area: Next.js adds its own role="alert" route announcer.
  const attemptArea = page.getByRole("region", { name: "Your attempt" });
  await expect(attemptArea.getByRole("alert")).toContainText("Add your Anthropic API key in Settings first.");
  await expect(page.getByRole("link", { name: "Open Settings" })).toBeVisible();
  await expect(page.getByLabel("Your specification")).toHaveValue("Sum the cart.");
});

test("a full attempt: generated code is shown as text, run in the sandbox and scored (CA4.1)", async ({ page }, testInfo) => {
  await signUp(page, uniqueEmail(testInfo.project.name), "correct-horse");
  await saveKey(page);
  await page.goto(`/katas/${kata.id}`);

  await submitSpec(page, "```javascript\n" + toGeneratedCode(kata.id, kata.functionName, "reference") + "```");
  await expect(page.getByTestId("score")).toHaveText("12 / 12 tests passed");
  await expect(page.locator(".attempt-code code").last()).toContainText("function reference");
  await expect(page.getByText("Answered by echo")).toBeVisible();

  await submitSpec(page, "```javascript\n" + toGeneratedCode(kata.id, kata.functionName, "naive") + "```");
  await expect(page.getByTestId("score")).toHaveText("4 / 12 tests passed");
  await expect(page.getByRole("listitem").filter({ hasText: "Failed: Every third unit is free" })).toBeVisible();
});

test("an answer without code fails every test at once (CA4.7)", async ({ page }, testInfo) => {
  await signUp(page, uniqueEmail(testInfo.project.name), "correct-horse");
  await saveKey(page);
  await page.goto(`/katas/${kata.id}`);
  await submitSpec(page, "A spec without any code block.");
  await expect(page.getByText("No code was found in the model's answer, so every test fails.")).toBeVisible();
  await expect(page.getByTestId("score")).toHaveText("0 / 12 tests passed");
});

test("the history lists attempts live, most recent first, and only their owner can open them (US5, CA6.5)", async ({ page }, testInfo) => {
  await signUp(page, uniqueEmail(testInfo.project.name), "correct-horse");
  await saveKey(page);
  await page.goto(`/katas/${kata.id}`);
  const history = page.getByRole("region", { name: "Your attempts" });
  await expect(history).toContainText("No attempt yet.");

  await submitSpec(page, "```javascript\n" + toGeneratedCode(kata.id, kata.functionName, "reference") + "```");
  await expect(page.getByTestId("score")).toHaveText("12 / 12 tests passed");
  await submitSpec(page, "```javascript\n" + toGeneratedCode(kata.id, kata.functionName, "naive") + "```");
  await expect(page.getByTestId("score")).toHaveText("4 / 12 tests passed");

  const rows = history.getByRole("row");
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(1).getByRole("cell").nth(2)).toHaveText("4 / 12");
  await expect(rows.nth(2).getByRole("cell").nth(2)).toHaveText("12 / 12");

  await rows.nth(1).getByRole("link", { name: "View" }).click();
  await expect(page).toHaveURL(/\/attempts\/[^/]+$/);
  const attemptUrl = page.url();
  await expect(page.getByTestId("score")).toHaveText("4 / 12 tests passed");
  await expect(page.locator("article")).toContainText("function naive");

  await signOut(page);
  await expect(page).toHaveURL(/\/login\?next=%2Fattempts%2F/);
  await signUp(page, uniqueEmail(testInfo.project.name), "correct-horse");
  await page.goto(attemptUrl);
  await expect(page.getByText("Attempt not found.")).toBeVisible();
});

test("two attempts are compared side by side, the older on the left (US6)", async ({ page }, testInfo) => {
  await signUp(page, uniqueEmail(testInfo.project.name), "correct-horse");
  await saveKey(page);
  await page.goto(`/katas/${kata.id}`);
  await submitSpec(page, "```javascript\n" + toGeneratedCode(kata.id, kata.functionName, "reference") + "```");
  await expect(page.getByTestId("score")).toHaveText("12 / 12 tests passed");
  await submitSpec(page, "```javascript\n" + toGeneratedCode(kata.id, kata.functionName, "naive") + "```");
  await expect(page.getByTestId("score")).toHaveText("4 / 12 tests passed");

  const history = page.getByRole("region", { name: "Your attempts" });
  const compare = history.getByRole("button", { name: "Compare selected" });
  await expect(compare).toBeDisabled();
  for (const checkbox of await history.getByRole("checkbox").all()) await checkbox.check();
  await compare.click();

  await expect(page).toHaveURL(/\/compare\?a=[^&]+&b=[^&]+$/);
  const scoreRow = page.getByRole("row").filter({ has: page.getByRole("rowheader", { name: "Score" }) });
  await expect(scoreRow.getByRole("cell")).toHaveText(["12 / 12", "4 / 12"]);
  const freeUnitRow = page.getByRole("row").filter({ has: page.getByRole("rowheader", { name: "Every third unit is free" }) });
  await expect(freeUnitRow.getByRole("cell")).toHaveText(["Passed", "Failed"]);
  const compareUrl = page.url();

  await signOut(page);
  await expect(page).toHaveURL(/\/login\?next=%2Fcompare%3Fa%3D.+%26b%3D/);
  await signUp(page, uniqueEmail(testInfo.project.name), "correct-horse");
  await page.goto(compareUrl);
  await expect(page.getByText("Attempt not found.")).toBeVisible();
});
