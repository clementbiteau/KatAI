import { expect, test } from "@playwright/test";
import { expectFitsMobileWidth, expectNoSeriousViolations, openPage } from "./checks.ts";

// T24: every page a visitor can open, in light and dark mode and at phone width.
const PUBLIC_PAGES = ["/", "/katas", "/katas/retail-cart", "/randori", "/login", "/signup", "/reset-password", "/katas/does-not-exist"];

for (const path of PUBLIC_PAGES) {
  test(`${path} has no serious accessibility violation and fits a phone`, async ({ page }) => {
    await openPage(page, path);
    await expectNoSeriousViolations(page);
    await expectFitsMobileWidth(page);
  });
}

test("the keyboard reaches a skip link first, then sees where its focus is", async ({ page, browserName }) => {
  await openPage(page, "/katas");
  // WebKit only tabs to links when the system setting asks for it; Alt+Tab always does.
  const tab = browserName === "webkit" ? "Alt+Tab" : "Tab";
  await page.keyboard.press(tab);
  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();
  expect(await skipLink.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
  await page.keyboard.press("Enter");
  await page.keyboard.press(tab);
  await expect(page.getByRole("main").getByRole("link").first()).toBeFocused();
});
