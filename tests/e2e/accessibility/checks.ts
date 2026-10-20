import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

// Shared accessibility checks of T24: axe in light and dark mode, and the mobile width.

const MOBILE_VIEWPORT = { width: 375, height: 812 };

// Opens a page and waits until the header knows the session, so the scan sees the final page.
export async function openPage(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Account" }).getByRole("link").first()).toBeVisible();
}

// No serious or critical axe violation, in both color schemes. The failure lists each
// rule with the elements it flagged.
export async function expectNoSeriousViolations(page: Page) {
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    const { violations } = await new AxeBuilder({ page }).analyze();
    const serious = violations
      .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
      .map((violation) => `${colorScheme} · ${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`);
    expect(serious).toEqual([]);
  }
}

// At phone width the page never scrolls sideways; wide tables scroll inside their own frame.
// On failure, the outermost elements that stick out of the screen help find the cause.
export async function expectFitsMobileWidth(page: Page) {
  const previous = page.viewportSize();
  await page.setViewportSize(MOBILE_VIEWPORT);
  const layout = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const sticksOut = (element: Element) => element.getBoundingClientRect().right > width + 0.5;
    const offenders = [...document.body.querySelectorAll("*")]
      .filter((element) => sticksOut(element) && !(element.parentElement && sticksOut(element.parentElement)))
      .map((element) => `${element.tagName.toLowerCase()}.${[...element.classList].join(".")}`);
    return { overflow: document.documentElement.scrollWidth - width, offenders };
  });
  expect(layout.overflow, `Elements sticking out: ${layout.offenders.join(", ")}`).toBe(0);
  if (previous) await page.setViewportSize(previous);
}
