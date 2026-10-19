import { expect, test } from "@playwright/test";
import { signOut, signUp, uniqueEmail } from "./helpers.ts";

// Full sign-up, sign-in, sign-out and reset flows on a production build wired to
// the Firebase Auth emulator. Each test uses its own email, so tests can run in parallel.

test("a visitor creates an account, is signed in, then signs out (CA1.1, CA1.6)", async ({ page }, testInfo) => {
  const email = uniqueEmail(testInfo.project.name);
  await signUp(page, email, "correct-horse");
  await expect(page).toHaveURL("/");
  await signOut(page);
});

test("a protected page sends a visitor to sign in, then back to it (CA1.3, CA1.7)", async ({ page }, testInfo) => {
  const email = uniqueEmail(testInfo.project.name);
  await signUp(page, email, "correct-horse");
  await signOut(page);
  await page.goto("/settings");
  await expect(page).toHaveURL("/login?next=%2Fsettings");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-horse");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Provider keys" })).toBeVisible();
});

test("a wrong password gets a generic message (CA1.4)", async ({ page }, testInfo) => {
  const email = uniqueEmail(testInfo.project.name);
  await signUp(page, email, "correct-horse");
  await signOut(page);
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  // Scoped to the form: Next.js adds its own role="alert" route announcer to every page.
  await expect(page.locator("form").getByRole("alert")).toHaveText("Incorrect email or password.");
});

test("a reset request gets the same neutral answer for any email (CA1.8)", async ({ page }, testInfo) => {
  await page.goto("/reset-password");
  await page.getByLabel("Email").fill(uniqueEmail(testInfo.project.name));
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.locator("form").getByRole("status")).toHaveText(
    "If an account exists for this email, we have sent a link to reset your password.",
  );
});
