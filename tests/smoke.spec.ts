import { expect, test, type Page } from "@playwright/test";

async function getExportJson(page: Page) {
  await expect(page.locator("pre")).toContainText('"schemaVersion"');

  return JSON.parse(await page.locator("pre").innerText()) as {
    schemaVersion?: string;
    skill?: unknown;
    inputSchema?: unknown;
    symbol?: string;
    entryPrice?: number;
    positionSize?: number;
    totalCapital?: number;
    calculatedPositionSize?: number;
    dataProvenance?: unknown;
    dataRequirements?: unknown;
    strategySpec?: {
      asset?: string;
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

async function getCompleteExportJson(page: Page) {
  await expect(page.locator("pre")).toContainText('"schemaVersion"', { timeout: 20_000 });
  await expect(page.locator("pre")).toContainText('"backtestResult"', { timeout: 20_000 });
  await expect(page.locator("pre")).toContainText('"candlesUsed"', { timeout: 20_000 });

  return getExportJson(page);
}

async function getNonJsonBodyText(page: Page) {
  return page.locator("body").evaluate((body) => {
    const clone = body.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("pre").forEach((node) => node.remove());
    clone.querySelectorAll("textarea").forEach((node) => node.remove());

    return clone.innerText;
  });
}

function expectValidStrategyExport(
  payload: Awaited<ReturnType<typeof getExportJson>>,
  rawJson: string,
  symbol: string,
  intent: "analyze_entry" | "manage_open_position" | "exit_review",
) {
  for (const key of [
    "schemaVersion",
    "skill",
    "inputSchema",
    "symbol",
    "entryPrice",
    "totalCapital",
    "strategyTimeframe",
    "positionIntent",
    "strategySpec",
    "strategyDecision",
    "marketContext",
    "dataProvenance",
    "backtestSpec",
    "executionAssumptions",
    "validation",
  ] as const) {
    expect(payload[key], `${symbol} ${intent} missing ${key}`).toBeTruthy();
  }

  expect(payload.symbol).toBe(symbol);
  expect(payload.strategySpec?.asset).toBe(symbol);
  expect(payload.positionIntent).toBe(intent);
  expect(payload.strategyDecision?.positionIntent).toBe(intent);
  expect(typeof payload.entryPrice).toBe("number");
  expect(typeof payload.totalCapital).toBe("number");
  expect(typeof (payload.positionSize ?? payload.calculatedPositionSize)).toBe("number");
  expect(["low", "medium", "high", "no_trade"]).toContain(payload.riskBadge);
  expect(payload.history?.indicators ?? payload.marketContext).toBeTruthy();
  expect(payload.backtestResult?.candlesUsed).toBeGreaterThan(0);
  expect(["historical_cmc", "estimated_from_live_quote", "demo_dataset"]).toContain(payload.backtestResult?.backtestSource);
  expect(["coinmarketcap", "mock"]).toContain((payload.dataProvenance as { source?: string }).source);
  expect(["coinmarketcap", "estimated"]).toContain((payload.dataProvenance as { historySource?: string }).historySource);
  expect(payload.executionAssumptions?.allowShort).toBe(false);
  expect(payload.validation?.limitations?.join(" ")).toMatch(/not financial advice|no live execution/i);
  expect(rawJson).not.toMatch(/CMC_API_KEY|AI_API_KEY|\.env\.local|your_provider_api_key_here/i);
}

async function selectAda(page: Page) {
  await page.goto("/");
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

  await expect(page.getByRole("button", { name: "Constructor de estrategia", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Backtest paper", exact: true })).toBeVisible();
  await expect(page.getByText("Temporalidad de estrategia", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Analizar entrada", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Gestionar posición abierta", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Revisar salida / venta", exact: true })).toBeVisible();
  await expect(page.locator("pre")).toContainText('"schemaVersion"', { timeout: 20_000 });
  await expect(page.getByText("Nivel de riesgo", { exact: true })).toBeVisible();
  await expect(page.getByText("Ajuste de estrategia", { exact: true })).toBeVisible();
  await expect(page.getByText("Modo de tamaño", { exact: true })).toBeVisible();
  await expect(page.getByText(/Fecha local:/).first()).toBeVisible();
  await expect(page.getByText("Detalle de estrategia", { exact: true })).toBeVisible();
  await expect(page.getByText("Prueba simple", { exact: true })).toBeVisible();
  await expect(page.getByText("Fuente de la prueba", { exact: true })).toBeVisible();
  await expect(page.getByText("Alcance del escaneo", { exact: true })).toBeVisible();
  await expect(page.locator("header").getByText("Soporte", { exact: true })).toBeVisible();
  await expect(page.locator("header").getByText("Resistencia", { exact: true })).toBeVisible();
  await expect(page.getByText(/Soporte estimado|Soporte/).first()).toBeVisible();
  await expect(page.getByText(/Resistencia estimada|Resistencia/).first()).toBeVisible();
  await expect(page.getByText("This checks whether", { exact: false })).toHaveCount(0);
  expect(await getNonJsonBodyText(page)).not.toContain("Risk or market structure is unclear");
  expect(await getNonJsonBodyText(page)).not.toMatch(/\b(?:Alcista|Bajista)\b/);
  await expect(page.getByRole("button", { name: "1sem", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "1mes", exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/mock\/proxy|proxy/i);
});

test("paper backtest imports PositionSight JSON and keeps no-trade specs closed", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Strategy Builder", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Paper Backtest", exact: true })).toBeVisible();
  const payload = await getCompleteExportJson(page);
  const rawJson = await page.locator("pre").innerText();

  await page.getByRole("button", { name: "Export JSON", exact: true }).click();
  await page.getByRole("button", { name: "Paper Backtest", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Paper Backtest from JSON", exact: true })).toBeVisible();
  await expect(page.getByText("This is not live trading and does not connect to your exchange account.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Use latest exported JSON", exact: true })).toBeVisible();
  await expect(page.getByText("This is a paper simulation only.", { exact: false })).toHaveCount(0);

  await page.getByLabel("PositionSight JSON export").fill(rawJson);
  await page.getByRole("button", { name: "Run paper backtest", exact: true }).click();

  await expect(page.getByText("Pair used", { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Entry triggered", { exact: true })).toBeVisible();
  await expect(page.getByText("Estimated P/L", { exact: true })).toBeVisible();
  await expect(page.getByText("Max drawdown", { exact: true })).toBeVisible();
  await expect(page.getByText(/Binance public klines|Demo fallback/).first()).toBeVisible();
  await expect(page.getByText("View:", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Line", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Candles", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Candles", exact: true }).click();
  await expect(page.getByRole("application", { name: "Paper backtest chart" })).toBeVisible();
  await expect(page.getByText("This is a paper simulation only.", { exact: false })).toHaveCount(1);
  await expect(page.locator("body")).not.toContainText(/connect Binance account|API key required|NEXT_PUBLIC_BINANCE_KEY/i);

  const noTradePayload = {
    ...payload,
    riskBadge: "no_trade",
    noTradeRecommended: true,
    strategySpec: {
      ...payload.strategySpec,
      strategyType: "no_trade",
    },
    strategyDecision: {
      ...payload.strategyDecision,
      riskBadge: "no_trade",
      noTradeRecommended: true,
      finalRiskVerdict: "no_trade_recommended",
    },
    backtestSpec: {
      ...payload.backtestSpec,
      signal: "ABSTAIN",
      shouldOpenPosition: false,
    },
  };

  await page.getByLabel("PositionSight JSON export").fill(JSON.stringify(noTradePayload, null, 2));
  await page.getByRole("button", { name: "Run paper backtest", exact: true }).click();
  await expect(page.getByText("No trade", { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Capital protected / no position opened.", { exact: true })).toBeVisible();
  await expect(page.getByText("Entry triggered", { exact: true })).toBeVisible();
  await expect(page.getByText("No", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Español", exact: true }).click();
  await expect(page.getByRole("button", { name: "Constructor de estrategia", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Backtest paper desde JSON", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ejecutar backtest paper", exact: true })).toBeVisible();
  await expect(page.getByText("Vista:", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Línea", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Velas", exact: true })).toBeVisible();
  await expect(page.getByText("Esta es solo una simulación paper.", { exact: false })).toHaveCount(1);
  expect(await getNonJsonBodyText(page)).not.toContain("This is a paper simulation only.");
  expect(await getNonJsonBodyText(page)).not.toContain("Used Binance public market-data klines only.");
  await expect(page.locator("body")).not.toContainText(/connect Binance account|API key required|NEXT_PUBLIC_BINANCE_KEY/i);
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

test("day 10, 11, and 13 validation matrix covers requested tokens, intents, languages, chart, backtest, and export", async ({
  page,
}) => {
  test.setTimeout(240_000);

  const tokens = ["BNB", "ETH", "LINK", "AVAX", "CAKE", "TWT", "AAVE", "UNI", "ATOM", "FIL"];
  const intents = ["analyze_entry", "manage_open_position", "exit_review"] as const;
  const labels = {
    en: {
      languageButton: "English",
      chartTitle: "Entry vs current price",
      riskBadge: "Risk badge",
      backtest: "Simple Backtest",
      export: "Backtest-ready JSON",
      chartPathNote: /Chart path is estimated|Latest quote and historical candles|Demo fallback data/i,
      chartMarkers: ["Stop", "Entry", "Current", "Trailing Exit"],
      intentLabels: {
        analyze_entry: "Analyze entry",
        manage_open_position: "Manage open position",
        exit_review: "Exit / Sell review",
      },
      intentPanelText: {
        analyze_entry: "This checks whether a new entry is worth planning.",
        manage_open_position: "This checks whether an open position should be held, reduced, or protected.",
        exit_review: "This checks whether the position should be reduced, exited, or monitored.",
      },
      absentText: "Temporalidad de estrategia",
    },
    es: {
      languageButton: "Español",
      chartTitle: "Entrada vs precio actual",
      riskBadge: "Nivel de riesgo",
      backtest: "Prueba simple",
      export: "JSON listo para pruebas",
      chartPathNote: /recorrido del gráfico|velas históricas|datos demo/i,
      chartMarkers: ["Stop", "Entrada", "Actual", "Salida dinámica"],
      intentLabels: {
        analyze_entry: "Analizar entrada",
        manage_open_position: "Gestionar posición abierta",
        exit_review: "Revisar salida / venta",
      },
      intentPanelText: {
        analyze_entry: "Esto revisa si vale la pena planear una entrada nueva.",
        manage_open_position: "Esto revisa si una posición abierta debe mantenerse, reducirse o protegerse.",
        exit_review: "Esto revisa si la posición debe reducirse, cerrarse o monitorearse.",
      },
      absentText: "This checks whether",
    },
  };

  await page.goto("/");

  for (const language of ["en", "es"] as const) {
    await page.getByRole("button", { name: labels[language].languageButton, exact: true }).click();
    await expect(page.locator("body")).not.toContainText(labels[language].absentText);

    for (const symbol of tokens) {
      await page.locator("form select").selectOption(symbol);
      await expect(page.locator("pre")).toContainText(`"asset": "${symbol}"`, { timeout: 20_000 });

      for (const intent of intents) {
        await page.getByRole("button", { name: labels[language].intentLabels[intent], exact: true }).click();
        await expect(page.locator("pre")).toContainText(`"positionIntent": "${intent}"`, { timeout: 20_000 });

        const payload = await getCompleteExportJson(page);
        const rawJson = await page.locator("pre").innerText();
        expectValidStrategyExport(payload, rawJson, symbol, intent);

        await expect(page.getByText(labels[language].chartTitle, { exact: true })).toBeVisible();
        await expect(page.getByRole("application").first()).toBeVisible();
        await expect(page.getByText(labels[language].chartPathNote).first()).toBeVisible();
        for (const marker of labels[language].chartMarkers) {
          await expect(page.getByText(marker, { exact: true }).first()).toBeVisible();
        }
        await expect(page.getByText(labels[language].riskBadge, { exact: true }).first()).toBeVisible();
        await expect(page.getByText(labels[language].intentPanelText[intent], { exact: true })).toBeVisible();
        await expect(page.getByText(labels[language].backtest, { exact: true })).toBeVisible();
        await expect(page.getByText(labels[language].export, { exact: true })).toBeVisible();
        await expect(page.locator("body")).not.toContainText(/AI_API_KEY|CMC_API_KEY|\.env\.local|OpenAI|ChatGPT/i);
      }
    }
  }
});

test("scanner scope supports current selected and specific token modes in English and Spanish", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");

  await expect(page.getByText("Scan scope", { exact: true })).toBeVisible();

  const scanScopeSelect = page.getByRole("combobox", { name: "Scan scope", exact: true });
  await scanScopeSelect.selectOption("specific");
  await page.getByRole("combobox", { name: "Specific token", exact: true }).selectOption("FIL");
  await page.getByRole("button", { name: "Scan tokens", exact: true }).click();
  await expect(page.locator("div").filter({ hasText: /^FIL - Filecoin$/ }).first()).toBeVisible({ timeout: 20_000 });
  await expect.poll(async () => page.getByText("Possible movement to review", { exact: true }).count()).toBe(1);

  await page.locator("form select").selectOption("LINK");
  await expect(page.locator("pre")).toContainText('"asset": "LINK"', { timeout: 20_000 });
  await scanScopeSelect.selectOption("current");
  await page.getByRole("button", { name: "Scan tokens", exact: true }).click();
  await expect(page.locator("div").filter({ hasText: /^LINK - Chainlink$/ }).first()).toBeVisible({ timeout: 20_000 });
  await expect.poll(async () => page.getByText("Possible movement to review", { exact: true }).count()).toBe(1);

  await page.getByRole("button", { name: "Español", exact: true }).click();
  await expect(page.getByText("Alcance del escaneo", { exact: true })).toBeVisible();
  expect(await getNonJsonBodyText(page)).not.toContain("Risk or market structure is unclear");

  const alcanceSelect = page.getByRole("combobox", { name: "Alcance del escaneo", exact: true });
  await alcanceSelect.selectOption("specific");
  await page.getByRole("combobox", { name: "Token específico", exact: true }).selectOption("TWT");
  await page.getByRole("button", { name: "Escanear tokens", exact: true }).click();
  await expect(page.locator("div").filter({ hasText: /^TWT - Trust Wallet Token$/ }).first()).toBeVisible({ timeout: 20_000 });
  await expect.poll(async () => page.getByText("Posible movimiento a revisar", { exact: true }).count()).toBe(1);

  await page.locator("form select").selectOption("CAKE");
  await expect(page.locator("pre")).toContainText('"asset": "CAKE"', { timeout: 20_000 });
  await alcanceSelect.selectOption("current");
  await page.getByRole("button", { name: "Escanear tokens", exact: true }).click();
  await expect(page.locator("div").filter({ hasText: /^CAKE - PancakeSwap$/ }).first()).toBeVisible({ timeout: 20_000 });
  await expect.poll(async () => page.getByText("Posible movimiento a revisar", { exact: true }).count()).toBe(1);
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
  await expect(page.getByText(/Local date:/).first()).toBeVisible();
  await expect(page.getByText("Strategy details", { exact: true })).toBeVisible();
  expect(await getNonJsonBodyText(page)).not.toMatch(/\b(?:Bullish|Bearish)\b/);
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

  const riskSlider = page.locator('input[type="range"]');
  await expect(riskSlider).toHaveAttribute("max", "10");
  await riskSlider.fill("2");
  await expect(page.getByText("Risk above 1% is aggressive", { exact: false })).toBeVisible();
  await riskSlider.fill("10");
  await expect(page.locator("pre")).toContainText('"maxRiskPercentage": 10');

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
  await expect(page.locator("header").getByText("Support", { exact: true })).toBeVisible();
  await expect(page.locator("header").getByText("Resistance", { exact: true })).toBeVisible();
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
  await expect(page.getByText(/Current price is too far from entry|Entry price is very far from current price/).first()).toBeVisible();

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
  await expect(page.getByText("Prueba simple", { exact: true })).toBeVisible();
  await expect(page.getByText("This checks whether", { exact: false })).toHaveCount(0);
});

test("token scanner runs deterministic scan and can load a result", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Token Scanner", { exact: true })).toBeVisible();
  await expect(page.getByText("Possible movement to review", { exact: true })).toHaveCount(0);
  const maxTokensSelect = page.getByLabel("Max tokens to scan");
  for (const option of ["30", "40", "50"]) {
    await expect(maxTokensSelect.locator(`option[value="${option}"]`)).toHaveCount(1);
  }

  await page.getByRole("button", { name: "Scan tokens", exact: true }).click();
  await expect(page.getByText("Possible movement to review", { exact: true }).first()).toBeVisible();

  const scannerCards = page.getByText("Possible movement to review", { exact: true });
  await expect.poll(async () => scannerCards.count()).toBeGreaterThanOrEqual(3);
  await expect(page.getByText("Risk badge", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Intent action", { exact: true }).first()).toBeVisible();
  const firstScannerCard = page
    .getByText("Possible movement to review", { exact: true })
    .first()
    .locator("xpath=ancestor::div[contains(@class, 'bg-panel')][1]");
  await expect(firstScannerCard.getByText("Quote source", { exact: true })).toHaveCount(0);
  await expect(firstScannerCard.getByText("History", { exact: true })).toHaveCount(0);
  await expect(firstScannerCard.getByText("Backtest source", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Load in main analysis", exact: true }).first().click();

  const payload = await getExportJson(page);
  expect(payload.strategySpec?.asset).toBeTruthy();
  expect(payload.strategyTimeframe).toBe("1d");
  expect(payload.strategyDecision?.positionIntent).toBe("analyze_entry");
  expect(Array.isArray(payload.scannerResults)).toBe(true);
  expect((payload.scannerResults ?? []).length).toBeGreaterThanOrEqual(3);
  await expect(page.locator("body")).not.toContainText(/AI_API_KEY|your_provider_api_key_here/i);
  await expect(page.locator("body")).not.toContainText(/OpenAI|ChatGPT/i);
});
