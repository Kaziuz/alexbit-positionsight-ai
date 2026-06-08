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
  await expect(page.getByRole("button", { name: "1sem", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "1mes", exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/mock\/proxy|proxy/i);
});

test("strategy timeframe selector shows supported options", async ({ page }) => {
  await page.goto("/");

  for (const timeframe of ["15m", "30m", "1h", "1d", "1w", "1mo"]) {
    await expect(page.getByRole("button", { name: timeframe, exact: true })).toBeVisible();
  }

  await expect(page.locator("body")).not.toContainText(/mock\/proxy|proxy/i);
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

test("history API returns candles and indicators or estimated fallback", async ({ request }) => {
  const response = await request.get("/api/history?symbol=ADA&timeframe=1d&debug=1");

  expect(response.status()).toBe(200);

  const payload = (await response.json()) as {
    source?: string;
    candles?: unknown[];
    indicators?: Record<string, unknown>;
  };

  expect(["coinmarketcap", "estimated"]).toContain(payload.source);
  expect(Array.isArray(payload.candles)).toBe(true);
  for (const key of ["ma20", "ma50", "ma200", "rsi14", "atr14", "averageVolume", "support", "resistance"]) {
    expect(payload.indicators).toHaveProperty(key);
  }
});

test("risk-first sizing, warnings, chart labels, and export stay coherent", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("pre")).toContainText('"strategyTimeframe": "1d"');
  await expect(page.getByRole("button", { name: "1d", exact: true })).toHaveClass(/bg-sky-700/);
  await expect(page.getByText("Total capital", { exact: true })).toBeVisible();
  await expect(page.locator('input[type="text"]').nth(1)).toHaveValue("1000");
  const calculatedSizeInput = page.locator('input[readonly]').first();
  await expect(calculatedSizeInput).toBeVisible();
  await expect(page.getByText("Calculated position size", { exact: true })).toBeVisible();
  await expect(page.getByText("Entry", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Current", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Stop", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Trailing Exit", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Take Profit", { exact: true })).toHaveCount(0);
  await expect(page.locator("pre")).toContainText('"invalidationLevel"');
  await expect(page.locator("pre")).toContainText('"totalCapital"');
  await expect(page.locator("pre")).toContainText('"calculatedPositionSize"');
  await expect(page.locator("pre")).toContainText('"trailingExit"');

  await page.locator('input[type="range"]').fill("2");
  await expect(page.getByText("Risk above 1% is aggressive", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "15m", exact: true }).click();
  await expect(page.getByText("Intraday trading is more speculative", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "1h", exact: true }).click();
  await expect(page.getByRole("application").getByText("+2h", { exact: true })).toBeVisible();
  await expect(page.locator("pre")).toContainText('"strategyTimeframe": "1h"');
  await page.getByRole("button", { name: "1mo", exact: true }).click();
  await expect(page.getByRole("application").getByText("3mo ago", { exact: true })).toBeVisible();
  await expect(page.locator("pre")).toContainText('"strategyTimeframe": "1mo"');
  await page.getByRole("button", { name: "1w", exact: true }).click();
  await expect(page.getByText("History Source", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Trend", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("MA 20", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("MA 50", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("MA 200", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("EMA 20", { exact: true })).toHaveCount(0);
  await expect(page.getByText("RSI 14", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("ATR 14", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Avg Volume", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Support", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Resistance", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Current", { exact: true }).first()).toBeVisible();
  await expect(page.locator("pre")).toContainText('"strategyTimeframe": "1w"');
  await expect(page.locator("pre")).toContainText('"historySource"');
  await expect(page.locator("pre")).toContainText('"indicatorSource"');
  await expect(page.locator("pre")).toContainText('"chartSeriesType"');
  await expect(page.locator("pre")).toContainText('"indicators"');
  await expect(page.locator("pre")).toContainText('"ma20"');
  await expect(page.locator("body")).toContainText(/Historical candles from CoinMarketCap|Estimated candles|estimated/i);
  await expect(page.locator("body")).not.toContainText(/mock\/proxy|proxy/i);
  const dataNoteSentence =
    "The latest quote is live from CoinMarketCap. The chart path and some indicators are estimated until historical OHLCV is available.";
  const nonJsonText = await page.locator("body").evaluate((body) => {
    const clone = body.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("pre").forEach((node) => node.remove());

    return clone.innerText;
  });
  const dataNoteCount = nonJsonText.split(dataNoteSentence).length - 1;
  expect(dataNoteCount).toBeLessThanOrEqual(1);
});
