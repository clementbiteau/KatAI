import { expect, test } from "@playwright/test";
import { findKata } from "../../../katas/catalog.ts";
import { saveAnthropicKey, signUp, toGeneratedCode, uniqueEmail } from "../helpers.ts";

// T20: every page carries a nonce-based CSP and the security headers, and a full attempt
// (Firebase, model call, sandbox iframe and worker) runs without any CSP violation.
test("pages carry a fresh nonce-based CSP and the security headers", async ({ page }) => {
  const first = await page.goto("/katas");
  const second = await page.goto("/katas");
  const policy = first?.headers()["content-security-policy"] ?? "";
  expect(policy).toMatch(/script-src 'self' 'nonce-[^']+' 'sha256-[^']+' blob:/);
  expect(policy).toContain("frame-ancestors 'none'");
  expect(policy.split("; ").find((directive) => directive.startsWith("script-src"))).not.toContain("unsafe-inline");
  expect(second?.headers()["content-security-policy"]).not.toBe(policy);
  expect(first?.headers()).toMatchObject({
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
  });
});

test("a full attempt runs without any CSP violation", async ({ page }, testInfo) => {
  const violations: string[] = [];
  page.on("console", (message) => {
    if (/content security policy|refused to/i.test(message.text())) violations.push(message.text());
  });
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => console.error(`Refused to load: ${event.violatedDirective}`));
  });
  const kata = findKata("retail-cart")!;
  await signUp(page, uniqueEmail(testInfo.project.name), "correct-horse");
  await saveAnthropicKey(page);
  await page.goto(`/katas/${kata.id}`);
  await page.getByLabel("Your specification").fill("```javascript\n" + toGeneratedCode(kata.id, kata.functionName, "reference") + "```");
  await page.getByRole("button", { name: "Generate and test" }).click();
  await expect(page.getByTestId("score")).toHaveText("12 / 12 tests passed");
  expect(violations).toEqual([]);
});
