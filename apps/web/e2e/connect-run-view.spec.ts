import { expect, test } from "@playwright/test";

/** PRD demo path: sign up → connect integrations → run checks → view results and evidence. */
test("connect, run checks and view results", async ({ page }) => {
  const email = `e2e-${Date.now()}@e2e-example.com`;
  await page.goto("/signup");
  await page.waitForLoadState("networkidle");
  await page.fill("#full_name", "E2E Tester");
  await page.fill("#email", email);
  await page.fill("#company", "E2E Widgets Ltd");
  await page.fill("#employee_count", "25");
  await page.fill("#password", "e2e-password-long-enough");
  await page.click("button[type=submit]");
  await page.waitForURL(/\/app\/[0-9a-f-]{36}/);

  await expect(page.getByText("Connect your first system")).toBeVisible();
  await page.getByRole("link", { name: "Connect an integration" }).click();
  for (const name of ["Microsoft 365 / Entra ID", "GitHub"]) {
    const card = page.locator("[data-slot=card]", { hasText: name });
    await card.getByRole("button", { name: "Use sample data" }).click();
    await expect(card.getByText("Connected")).toBeVisible();
  }

  await page.getByRole("button", { name: "Run checks" }).click();
  await expect(page.getByText(/Checks complete/)).toBeVisible({ timeout: 60_000 });

  await page.getByRole("link", { name: "Dashboard" }).click();
  await expect(page.getByText("ISO 27001:2022 readiness")).toBeVisible();
  await expect(page.getByText("Needs attention")).toBeVisible();

  await page.getByRole("link", { name: /Controls & checks/ }).click();
  await page.getByRole("radio", { name: /Failing/ }).click();
  await page.locator("tbody tr").first().click();
  await expect(page.getByText("How to fix")).toBeVisible();
  await expect(page.getByText(/sha256 [0-9a-f]{20}/).first()).toBeVisible();
});
