import { expect, test } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers.ts";

const anthropicKey = "sk-ant-e2e-" + "k".repeat(40);

test("a user saves, sees and deletes a provider key, which never comes back to the browser (CA2.1 to CA2.4, R3)", async ({
  page,
}, testInfo) => {
  const apiBodies: string[] = [];
  page.on("response", async (response) => {
    if (response.url().includes("/api/keys")) apiBodies.push(await response.text());
  });

  await signUp(page, uniqueEmail(testInfo.project.name), "correct-horse");
  await page.goto("/settings");
  const anthropic = page.locator("form", { has: page.getByRole("heading", { name: "Anthropic" }) });
  await expect(anthropic.getByText("Not configured")).toBeVisible();

  await anthropic.getByLabel("Anthropic API key").fill(anthropicKey);
  await anthropic.getByRole("button", { name: "Save key" }).click();
  await expect(anthropic.getByText(/Configured on/)).toBeVisible();
  await expect(anthropic.getByLabel("Anthropic API key")).toHaveValue("");

  await page.reload();
  await expect(anthropic.getByText(/Configured on/)).toBeVisible();
  await expect(page.locator("body")).not.toContainText(anthropicKey);

  await anthropic.getByRole("button", { name: "Delete key" }).click();
  await expect(anthropic.getByText("Not configured")).toBeVisible();

  expect(apiBodies.length).toBeGreaterThanOrEqual(3);
  for (const body of apiBodies) expect(body).not.toContain(anthropicKey);
});
