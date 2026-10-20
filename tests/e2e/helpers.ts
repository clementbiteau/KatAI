import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, type Page } from "@playwright/test";
import ts from "typescript";

// Shared steps for end-to-end tests on the emulator-backed production build.

export function uniqueEmail(browser: string): string {
  return `ada-${browser}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

export async function signUp(page: Page, email: string, password: string) {
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("navigation", { name: "Account" })).toContainText(email);
  // Sign-up ends with a navigation to the home page: wait for it, or the next page.goto races with it.
  await expect(page).toHaveURL("/");
}

export async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
}

// Turns a verified solution file into plain JavaScript that defines the kata's function,
// like a model's answer would.
export function toGeneratedCode(kataId: string, functionName: string, solution: "reference" | "naive"): string {
  const source = readFileSync(resolve(import.meta.dirname, `../katas/solutions/${kataId}.ts`), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  return `${outputText.replace(/^export /gm, "")}\nvar ${functionName} = ${solution};\n`;
}

export async function saveAnthropicKey(page: Page) {
  await page.goto("/settings");
  await page.getByLabel("Anthropic API key").fill("sk-ant-e2e-" + "k".repeat(40));
  await page.getByRole("button", { name: "Save key" }).click();
  await expect(page.getByText(/Configured on/)).toBeVisible();
}
