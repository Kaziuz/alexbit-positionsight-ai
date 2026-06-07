import { expect, test } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "PositionSight AI" })).toBeVisible();
});

test("language toggle switches to Spanish", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "English" })).toBeVisible();
  await page.getByRole("button", { name: "Español" }).click();

  await expect(page.getByText("Temporalidad de estrategia", { exact: true })).toBeVisible();
});

test("strategy timeframe selector shows supported options", async ({ page }) => {
  await page.goto("/");

  for (const timeframe of ["15m", "30m", "1h", "1d", "1w", "1mo"]) {
    await expect(page.getByRole("button", { name: timeframe, exact: true })).toBeVisible();
  }
});

test("strategy explanation can be opened", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "What is this?" }).first().click();

  await expect(page.getByText("Looks for a setup where the market is showing enough strength")).toBeVisible();
});

test("market API returns a safe data source", async ({ request }) => {
  const response = await request.get("/api/market?symbol=ADA&debug=1");

  expect(response.status()).toBe(200);

  const payload = (await response.json()) as { source?: string };

  expect(["coinmarketcap", "mock"]).toContain(payload.source);
});
