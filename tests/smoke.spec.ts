import { expect, test, type Page } from "@playwright/test";

async function getExportJson(page: Page) {
  await expect(page.locator("pre")).toContainText('"schemaVersion"');

  return JSON.parse(await page.locator("pre").innerText()) as {
    schemaVersion?: string;
    skill?: unknown;
    inputSchema?: unknown;
    dataProvenance?: unknown;
    dataRequirements?: unknown;
    strategySpec?: {
      dataUsed?: { currentPrice?: number };
      strategyType?: string;
    };
    strategyDecision?: {
      positionIntent?: string;
      finalRiskVerdict?: string;
      riskBadge?: string;
      sizingMode?: string;
      stopStatus?: string;
      shouldAddExposure?: boolean;
      shouldExitPosition?: boolean;
    };
    marketContext?: unknown;
    backtestSpec?: {
      signal?: string;
      shouldOpenPosition?: boolean;
      allowShort?: boolean;
      sizingMode?: string;
      positionSizingMode?: string;
    };
    backtestResult?: {
      backtestSource?: string;
      candlesUsed?: number;
      limitations?: string[];
    };
    executionAssumptions?: { allowShort?: boolean };
    evaluationMetrics?: unknown;
    validation?: { limitations?: string[] };
    aiExplanation?: {
      source?: string;
      guardrails?: {
        doesNotOverrideEngine?: boolean;
        noFinancialAdvice?: boolean;
        noTradeExecution?: boolean;
      };
    };
    scannerResults?: unknown[];
    positionIntent?: string;
    intentAction?: string;
    riskBadge?: string;
    riskVerdict?: string;
    strategyTimeframe?: string;
    timeframeCategory?: string;
    analysisInterval?: string;
    sizingMode?: string;
    positionSizingMode?: string;
    allowShort?: boolean;
    sellReviewMeaning?: string;
    history?: {
      indicators?: {
        ma20?: number | null;
        ma50?: number | null;
        ma200?: number | null;
        rsi14?: number | null;
        atr14?: number | null;
        averageVolume?: number | null;
        support?: number | null;
        resistance?: number | null;
      };
    };
  };
}

async function selectAda(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Advanced", exact: true }).click();
  await page.locator("form select").selectOption("ADA");
  await expect(page.locator("pre")).toContainText('"asset": "ADA"');
}

test("home page loads", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "PositionSight AI" })).toBeVisible();
});

test("language toggle switches to Spanish", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "English" })).toBeVisible();
  await page.getByRole("button", { name: "Español" }).click();

  await expect(page.getByText("Temporalidad de estrategia", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Analizar entrada", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Gestionar posición abierta", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Revisar salida / venta", exact: true })).toBeVisible();
  await expect(page.getByText("Nivel de riesgo", { exact: true })).toBeVisible();
  await expect(page.getByText("Ajuste de estrategia", { exact: true })).toBeVisible();
  await expect(page.getByText("Modo de tamaño", { exact: true })).toBeVisible();
  await expect(page.getByText("Backtest simple", { exact: true })).toBeVisible();
  await expect(page.getByText("Fuente del backtest", { exact: true })).toBeVisible();
  await expect(page.locator("header").getByText("Soporte", { exact: true })).toHaveCount(0);
  await expect(page.locator("header").getByText("Resistencia", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/Soporte estimado|Soporte/).first()).toBeVisible();
  await expect(page.getByText(/Resistencia estimada|Resistencia/).first()).toBeVisible();
  await expect(page.getByText("This checks whether", { exact: false })).toHaveCount(0);
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

test("explanation endpoint and panel use deterministic fallback without provider", async ({ page }) => {
  await page.goto("/");
  const payload = await getExportJson(page);
  const response = await page.request.post("/api/explain", {
    data: {
      artifact: payload,
      language: "en",
    },
  });

  expect(response.status()).toBe(200);

  const explanationPayload = (await response.json()) as {
    source?: string;
    model?: string | null;
    explanation?: {
      summary?: string;
      whatTheSystemSaw?: string[];
      whyThisDecision?: string[];
      riskExplanation?: string;
      whatToWatchNext?: string[];
      limitations?: string[];
      notFinancialAdvice?: string;
    };
  };

  expect(explanationPayload.source).toBe("deterministic_fallback");
  expect(explanationPayload.model).toBeNull();
  expect(explanationPayload.explanation?.summary).toContain("deterministic engine");
  expect(Array.isArray(explanationPayload.explanation?.whatTheSystemSaw)).toBe(true);

  await page.getByRole("button", { name: "Generate explanation", exact: true }).click();
  await expect(page.getByText("Local deterministic explanation", { exact: true })).toBeVisible();
  await expect(page.getByText("What the system saw", { exact: true })).toBeVisible();
  await expect(page.getByText("Why this decision", { exact: true })).toBeVisible();
  await expect(page.getByText("Risk explanation", { exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/AI_API_KEY|your_provider_api_key_here/i);
  await expect(page.locator("body")).not.toContainText(/OpenAI|ChatGPT/i);
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
  await expect(page.locator("pre")).toContainText('"positionIntent": "analyze_entry"');
  await expect(page.locator("pre")).toContainText('"intentAction"');
  await expect(page.locator("pre")).toContainText('"riskBadge"');
  await expect(page.locator("pre")).toContainText('"stopStatus"');
  await expect(page.locator("pre")).toContainText('"shouldAddExposure"');
  await expect(page.locator("pre")).toContainText('"shouldReduceExposure"');
  await expect(page.locator("pre")).toContainText('"shouldExitPosition"');
  await expect(page.getByRole("button", { name: "Analyze entry", exact: true })).toHaveClass(/bg-sky-700/);
  await expect(page.getByRole("button", { name: "Manage open position", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Exit / Sell review", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "1d", exact: true })).toHaveClass(/bg-sky-700/);
  await expect(page.getByText("Planned entry price", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Total capital", { exact: true })).toBeVisible();
  await expect(page.locator('input[type="text"]').nth(1)).toHaveValue("1000");
  const calculatedSizeInput = page.locator('input[readonly]').first();
  await expect(calculatedSizeInput).toBeVisible();
  await expect(page.getByText("Calculated position size", { exact: true })).toBeVisible();
  await expect(page.getByText("Intent action", { exact: true })).toBeVisible();
  await expect(page.getByText("Risk badge", { exact: true })).toBeVisible();
  await expect(page.getByText("Strategy fit", { exact: true })).toBeVisible();
  await expect(page.getByText("Stop status", { exact: true })).toBeVisible();
  await expect(page.getByText("Position size mode", { exact: true })).toBeVisible();
  await expect(page.getByText("Simple Backtest", { exact: true })).toBeVisible();
  await expect(page.getByText("Backtest source", { exact: true })).toBeVisible();
  await expect(page.getByText("Candles used", { exact: true })).toBeVisible();
  await expect(page.getByText("Result", { exact: true })).toBeVisible();
  await expect(page.getByText(/Historical CMC|Estimated from live quote|Demo dataset/).first()).toBeVisible();
  await expect(page.getByText("Add exposure allowed", { exact: true })).toBeVisible();
  await expect(page.getByText("Reduce/exit recommended", { exact: true })).toBeVisible();
  await expect(page.getByText("This checks whether a new entry is worth planning.", { exact: true })).toBeVisible();
  await expect(page.getByText("Entry", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Current", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Stop", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Trailing Exit", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Take Profit", { exact: true })).toHaveCount(0);
  await expect(page.locator("pre")).toContainText('"invalidationLevel"');
  await expect(page.locator("pre")).toContainText('"totalCapital"');
  await expect(page.locator("pre")).toContainText('"calculatedPositionSize"');
  await expect(page.locator("pre")).toContainText('"trailingExit"');
  await expect(page.locator("pre")).toContainText('"backtestResult"');
  await expect(page.locator("pre")).toContainText('"backtestSource"');
  await expect(page.locator("pre")).toContainText('"candlesUsed"');

  await page.getByRole("button", { name: "Manage open position", exact: true }).click();
  await expect(page.getByText("Average entry price", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Current position size", { exact: true })).toBeVisible();
  await expect(page.locator('input[type="text"]').nth(2)).not.toHaveAttribute("readonly", "");
  await expect(page.locator("pre")).toContainText('"positionIntent": "manage_open_position"');
  await expect(page.locator("pre")).toContainText('"sizingMode": "existing_position"');
  await expect(page.locator("pre")).toContainText('"positionSizingMode": "existing_position"');
  await expect(page.locator("pre")).toContainText('"shouldAddExposure": false');
  await expect(page.getByText("This checks whether an open position should be held, reduced, or protected.", { exact: true })).toBeVisible();

  await page.locator('input[type="text"]').first().fill("100");
  await expect(page.getByText("Stop breached", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Current price is below the stop", { exact: false }).first()).toBeVisible();
  await expect(page.locator("pre")).toContainText('"stopStatus": "stop_breached"');
  await expect(page.locator("pre")).toContainText('"shouldExitPosition": true');

  await page.getByRole("button", { name: "Exit / Sell review", exact: true }).click();
  await expect(page.getByText("Original entry price", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Decision condition:", { exact: true })).toBeVisible();
  await expect(page.getByText("Exit review:", { exact: false })).toBeVisible();
  await expect(page.locator("pre")).toContainText('"positionIntent": "exit_review"');
  await expect(page.getByText("This checks whether the position should be reduced, exited, or monitored.", { exact: true })).toBeVisible();
  await expect(page.locator("pre")).toContainText('"shouldOpenPosition": false');
  await expect(page.locator("pre")).toContainText('"allowShort": false');
  await expect(page.locator("pre")).toContainText('"sellReviewMeaning"');
  await expect(page.locator("pre")).toContainText('"backtestSpec"');

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
  await expect(page.locator("header").getByText("Support", { exact: true })).toHaveCount(0);
  await expect(page.locator("header").getByText("Resistance", { exact: true })).toHaveCount(0);
  const chartSection = page.locator("section").filter({ hasText: "Entry vs current price" }).first();
  await expect(chartSection.getByText(/Estimated Support|Support/).first()).toBeVisible();
  await expect(chartSection.getByText(/Estimated Resistance|Resistance/).first()).toBeVisible();
  await expect(page.getByText("Current", { exact: true }).first()).toBeVisible();
  await expect(page.locator("pre")).toContainText('"strategyTimeframe": "1w"');
  await expect(page.locator("pre")).toContainText('"historySource"');
  await expect(page.locator("pre")).toContainText('"indicatorSource"');
  await expect(page.locator("pre")).toContainText('"chartSeriesType"');
  await expect(page.locator("pre")).toContainText('"indicators"');
  await expect(page.locator("pre")).toContainText('"ma20"');
  await expect(page.locator("pre")).toContainText('"support"');
  await expect(page.locator("pre")).toContainText('"resistance"');
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

test("day 7 and day 8 targeted ADA QA scenarios", async ({ page }) => {
  await selectAda(page);

  let payload = await getExportJson(page);
  const currentPrice = payload.strategySpec?.dataUsed?.currentPrice;
  expect(typeof currentPrice).toBe("number");

  await page.locator('input[type="text"]').first().fill(String(currentPrice));
  payload = await getExportJson(page);

  for (const key of [
    "schemaVersion",
    "skill",
    "inputSchema",
    "dataProvenance",
    "dataRequirements",
    "strategySpec",
    "strategyDecision",
    "marketContext",
    "backtestSpec",
    "backtestResult",
    "executionAssumptions",
    "evaluationMetrics",
    "validation",
    "aiExplanation",
  ] as const) {
    expect(payload[key]).toBeTruthy();
  }

  expect(payload.positionIntent).toBe("analyze_entry");
  expect(payload.strategyDecision?.positionIntent).toBe("analyze_entry");
  expect(payload.strategyTimeframe).toBe("1d");
  expect(payload.timeframeCategory).toBe("daily");
  expect(payload.analysisInterval).toBe("1d");
  expect(payload.allowShort).toBe(false);
  expect(payload.executionAssumptions?.allowShort).toBe(false);
  expect(payload.aiExplanation?.source).toBe("not_generated");
  expect(payload.aiExplanation?.guardrails?.doesNotOverrideEngine).toBe(true);
  expect(payload.aiExplanation?.guardrails?.noFinancialAdvice).toBe(true);
  expect(payload.aiExplanation?.guardrails?.noTradeExecution).toBe(true);
  expect(payload.backtestSpec?.allowShort).toBe(false);
  expect(["low", "medium", "high", "no_trade"]).toContain(payload.riskBadge);
  expect(["historical_cmc", "estimated_from_live_quote", "demo_dataset"]).toContain(payload.backtestResult?.backtestSource);
  expect(payload.backtestResult?.candlesUsed).toBeGreaterThan(0);
  for (const key of ["ma20", "ma50", "ma200", "rsi14", "atr14", "averageVolume", "support", "resistance"] as const) {
    expect(payload.history?.indicators).toHaveProperty(key);
  }

  await page.locator('input[type="text"]').first().fill(String((currentPrice ?? 1) * 10));
  payload = await getExportJson(page);
  expect(payload.positionIntent).toBe("analyze_entry");
  expect(payload.riskBadge).toBe("no_trade");
  expect(payload.strategyDecision?.finalRiskVerdict).toBe("no_trade_recommended");
  await expect(page.getByText("Entry price is very far from current price", { exact: false }).first()).toBeVisible();

  await page.getByRole("button", { name: "Manage open position", exact: true }).click();
  await page.locator('input[type="text"]').nth(2).fill("25");
  payload = await getExportJson(page);
  expect(payload.positionIntent).toBe("manage_open_position");
  expect(payload.sizingMode ?? payload.positionSizingMode).toBe("existing_position");
  expect(payload.backtestSpec?.sizingMode ?? payload.backtestSpec?.positionSizingMode).toBe("existing_position");
  expect(payload.strategyDecision?.shouldAddExposure).toBe(false);
  expect(payload.strategyDecision?.stopStatus).toBe("stop_breached");
  expect(payload.strategyDecision?.shouldExitPosition).toBe(true);
  await expect(page.getByText("This checks whether an open position should be held, reduced, or protected.", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "1mo", exact: true }).click();
  await expect(page.getByRole("application").getByText("3mo ago", { exact: true })).toBeVisible();
  payload = await getExportJson(page);
  expect(payload.strategyTimeframe).toBe("1mo");
  expect(payload.positionIntent).toBe("manage_open_position");

  await page.getByRole("button", { name: "Exit / Sell review", exact: true }).click();
  await page.getByRole("button", { name: "1d", exact: true }).click();
  payload = await getExportJson(page);
  expect(payload.positionIntent).toBe("exit_review");
  expect(payload.allowShort).toBe(false);
  expect(payload.sellReviewMeaning).toContain("short selling is out of scope");
  expect(["REDUCE", "EXIT", "ABSTAIN", "HOLD"]).toContain(payload.backtestSpec?.signal);
  expect(["LONG", "CONDITIONAL_LONG"]).not.toContain(payload.backtestSpec?.signal);
  await expect(page.getByText("This checks whether the position should be reduced, exited, or monitored.", { exact: true })).toBeVisible();

  const timeframeChecks: Array<[string, string[]]> = [
    ["15m", ["-45m", "+30m"]],
    ["30m", ["-90m", "+1h"]],
    ["1h", ["-3h", "+2h"]],
    ["1d", ["-3d", "+2d"]],
    ["1w", ["4w ago", "+2w"]],
    ["1mo", ["3mo ago", "+2mo"]],
  ];

  for (const [timeframe, labels] of timeframeChecks) {
    await page.getByRole("button", { name: timeframe, exact: true }).click();
    for (const label of labels) {
      await expect(page.getByRole("application").getByText(label, { exact: true })).toBeVisible();
    }
  }

  await page.getByRole("button", { name: "15m", exact: true }).click();
  await expect(page.getByText("Intraday trading is more speculative", { exact: false })).toBeVisible();
  await expect(page.getByText("Stop", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Entry", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Current", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Trailing Exit", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("MA 20", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("MA 50", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("MA 200", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("EMA 20", { exact: true })).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(/mock\/proxy|proxy/i);

  await page.getByRole("button", { name: "Español" }).click();
  await expect(page.getByText("Nivel de riesgo", { exact: true })).toBeVisible();
  await expect(page.getByText("Backtest simple", { exact: true })).toBeVisible();
  await expect(page.getByText("This checks whether", { exact: false })).toHaveCount(0);
});

test("token scanner runs deterministic scan and can load a result", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Token Scanner", { exact: true })).toBeVisible();
  await expect(page.getByText("Possible movement to review", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Scan tokens", exact: true }).click();
  await expect(page.getByText("Possible movement to review", { exact: true }).first()).toBeVisible();

  const scannerCards = page.getByText("Possible movement to review", { exact: true });
  await expect.poll(async () => scannerCards.count()).toBeGreaterThanOrEqual(3);
  await expect(page.getByText("Risk badge", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Intent action", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Historical CMC|Estimated candles|History unavailable/).first()).toBeVisible();

  await page.getByRole("button", { name: "Load in main analysis", exact: true }).first().click();
  await expect(page.locator("pre")).toContainText('"asset": "ETH"');

  const payload = await getExportJson(page);
  expect(payload.strategyTimeframe).toBe("1d");
  expect(payload.strategyDecision?.positionIntent).toBe("analyze_entry");
  expect(Array.isArray(payload.scannerResults)).toBe(true);
  expect((payload.scannerResults ?? []).length).toBeGreaterThanOrEqual(3);
  await expect(page.locator("body")).not.toContainText(/AI_API_KEY|your_provider_api_key_here/i);
  await expect(page.locator("body")).not.toContainText(/OpenAI|ChatGPT/i);
});
