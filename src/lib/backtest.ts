import type {
  BacktestResult,
  BacktestSource,
  HistoryResponse,
  OhlcvCandle,
  PaperBacktestCandle,
  PaperBacktestDataSource,
  PaperBacktestEvent,
  PaperBacktestResult,
  PositionInput,
  RiskBadge,
  StrategyExport,
  StrategySpec,
  StrategyTimeframe,
  StrategyType,
} from "@/types/strategy";

type RunSimpleBacktestInput = {
  symbol: string;
  position: PositionInput;
  strategy: StrategySpec;
  currentPrice: number;
  strategyType: StrategyType;
  history?: HistoryResponse | null;
};

function roundNumber(value: number, decimals = 4) {
  return Number.isFinite(value) ? Number(value.toFixed(decimals)) : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidRiskBadge(value: unknown): value is RiskBadge {
  return value === "low" || value === "medium" || value === "high" || value === "no_trade";
}

function isValidStrategyTimeframe(value: unknown): value is StrategyTimeframe {
  return value === "15m" || value === "30m" || value === "1h" || value === "1d" || value === "1w" || value === "1mo";
}

const requiredPositionSightExportKeys = [
  "schemaVersion",
  "skill",
  "symbol",
  "entryPrice",
  "positionSize",
  "strategyTimeframe",
  "positionIntent",
  "strategySpec",
  "strategyDecision",
  "marketContext",
  "dataProvenance",
  "executionAssumptions",
  "validation",
] as const;

export function isPositionSightStrategyExport(value: unknown): value is StrategyExport {
  if (!isRecord(value)) {
    return false;
  }

  const hasRequiredKeys = requiredPositionSightExportKeys.every((key) => key in value);

  if (!hasRequiredKeys || !("backtestSpec" in value || "backtestResult" in value)) {
    return false;
  }

  const skill = value.skill;
  const strategySpec = value.strategySpec;
  const strategyDecision = value.strategyDecision;

  return (
    isRecord(skill) &&
    skill.name === "positionsight-ai" &&
    typeof value.symbol === "string" &&
    typeof value.entryPrice === "number" &&
    typeof value.positionSize === "number" &&
    isValidStrategyTimeframe(value.strategyTimeframe) &&
    isRecord(strategySpec) &&
    isRecord(strategyDecision) &&
    isRecord(value.marketContext) &&
    isRecord(value.dataProvenance) &&
    isRecord(value.executionAssumptions) &&
    isRecord(value.validation)
  );
}

function getBacktestSource(history: HistoryResponse | null | undefined): BacktestSource {
  if (!history?.candles.length) {
    return "demo_dataset";
  }

  return history.source === "coinmarketcap" ? "historical_cmc" : "estimated_from_live_quote";
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);

  return next;
}

function createDemoCandles(input: RunSimpleBacktestInput): OhlcvCandle[] {
  const baseDate = new Date(input.strategy.dataUsed.lastUpdated);
  const safeBaseDate = Number.isNaN(baseDate.getTime()) ? new Date(0) : baseDate;
  const prices = [
    input.position.entryPrice,
    (input.position.entryPrice + input.currentPrice) / 2,
    input.currentPrice,
    input.currentPrice * 1.015,
    input.strategy.takeProfit,
  ];

  return prices.map((close, index) => {
    const open = index === 0 ? close : prices[index - 1];
    const high = Math.max(open, close) * 1.01;
    const low = Math.min(open, close) * 0.99;

    return {
      time: addDays(safeBaseDate, index - prices.length + 1).toISOString(),
      open,
      high,
      low,
      close,
      volume: input.strategy.dataUsed.volume24h / 24,
    };
  });
}

function getCandles(input: RunSimpleBacktestInput) {
  if (input.history?.candles.length) {
    return input.history.candles;
  }

  return createDemoCandles(input);
}

function getLimitations(source: BacktestSource) {
  const common = [
    "Simple deterministic backtest v1; not a professional trading simulator.",
    "No live execution, no wallet connection, and no exchange order placement.",
  ];

  if (source === "historical_cmc") {
    return [
      ...common,
      "Uses CoinMarketCap historical OHLCV candles when available; execution order inside each candle is simplified.",
    ];
  }

  if (source === "estimated_from_live_quote") {
    return [
      ...common,
      "Historical OHLCV is unavailable on the current response or plan; candles are estimated from live quote context.",
    ];
  }

  return [
    ...common,
    "No history response was available in the UI; a small demo dataset was generated for illustration only.",
  ];
}

function getSourceNote(source: BacktestSource) {
  if (source === "historical_cmc") {
    return "Backtest used CoinMarketCap historical OHLCV candles.";
  }

  if (source === "estimated_from_live_quote") {
    return "Backtest used estimated candles from live quote context because historical OHLCV was unavailable.";
  }

  return "Backtest used a documented demo dataset because no history candles were available.";
}

export function runSimpleBacktest(input: RunSimpleBacktestInput): BacktestResult {
  const source = getBacktestSource(input.history);
  const candles = getCandles(input);
  const entryPrice = input.position.entryPrice;
  const stopLoss = input.strategy.stopLoss;
  const trailingExit = input.strategy.takeProfit;
  const isExistingPosition = input.position.positionIntent !== "analyze_entry";
  const notes: string[] = [getSourceNote(source)];

  if (input.strategyType === "no_trade") {
    notes.push("Strategy type is no_trade, so the backtest records capital-protection behavior instead of opening a new position.");
  }

  if (!candles.length) {
    return {
      backtestSource: source,
      candlesUsed: 0,
      entryTriggered: false,
      exitTriggered: false,
      stopHit: false,
      trailingExitHit: false,
      finalPrice: input.currentPrice,
      grossReturnPercentage: 0,
      estimatedPnL: 0,
      maxDrawdownPercentage: 0,
      winLossResult: "not_triggered",
      notes,
      limitations: getLimitations(source),
    };
  }

  let entryIndex = isExistingPosition ? 0 : -1;

  if (!isExistingPosition && input.strategyType !== "no_trade") {
    entryIndex = candles.findIndex((candle) => candle.low <= entryPrice && candle.high >= entryPrice);
  }

  const entryTriggered = input.strategyType !== "no_trade" && entryIndex >= 0;
  const simulationCandles = entryTriggered ? candles.slice(entryIndex) : [];
  let stopHit = false;
  let trailingExitHit = false;
  let exitTriggered = false;
  let exitPrice = input.currentPrice;

  for (const candle of simulationCandles) {
    if (candle.low <= stopLoss) {
      stopHit = true;
      exitTriggered = true;
      exitPrice = stopLoss;
      break;
    }

    if (candle.high >= trailingExit) {
      trailingExitHit = true;
      exitTriggered = true;
      exitPrice = trailingExit;
      break;
    }
  }

  if (entryTriggered && !exitTriggered) {
    exitPrice = simulationCandles.at(-1)?.close ?? input.currentPrice;
  }

  const finalPrice = entryTriggered ? exitPrice : candles.at(-1)?.close ?? input.currentPrice;
  const grossReturnPercentage = entryTriggered ? ((finalPrice - entryPrice) / entryPrice) * 100 : 0;
  const estimatedPnL = entryTriggered ? (finalPrice - entryPrice) * input.position.positionSize : 0;
  const worstLow = entryTriggered
    ? Math.min(...simulationCandles.map((candle) => candle.low), entryPrice)
    : entryPrice;
  const maxDrawdownPercentage = entryTriggered ? Math.min(((worstLow - entryPrice) / entryPrice) * 100, 0) : 0;
  const winLossResult =
    !entryTriggered
      ? "not_triggered"
      : Math.abs(grossReturnPercentage) < 0.01
        ? "flat"
        : grossReturnPercentage > 0
          ? "win"
          : "loss";

  if (input.position.positionIntent === "manage_open_position") {
    notes.push("Manage-open-position mode assumes the long position is already open.");
  }

  if (input.position.positionIntent === "exit_review") {
    notes.push("Exit-review mode checks reduce/exit behavior for an existing long position; it does not simulate short selling.");
  }

  return {
    backtestSource: source,
    candlesUsed: candles.length,
    startDate: candles[0]?.time,
    endDate: candles.at(-1)?.time,
    entryTriggered,
    exitTriggered,
    stopHit,
    trailingExitHit,
    finalPrice: roundNumber(finalPrice, finalPrice < 1 ? 8 : 4),
    grossReturnPercentage: roundNumber(grossReturnPercentage, 2),
    estimatedPnL: roundNumber(estimatedPnL, 4),
    maxDrawdownPercentage: roundNumber(maxDrawdownPercentage, 2),
    winLossResult,
    notes,
    limitations: getLimitations(source),
  };
}

type RunPaperBacktestInput = {
  strategyExport: StrategyExport;
  candles?: PaperBacktestCandle[];
  dataSource: PaperBacktestDataSource;
  pairUsed: string;
  fallbackReason?: string;
};

function addMinutes(date: Date, minutes: number) {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + minutes);

  return next;
}

function getDemoCandleSpacingMinutes(timeframe: StrategyTimeframe) {
  if (timeframe === "15m") {
    return 15;
  }

  if (timeframe === "30m") {
    return 30;
  }

  if (timeframe === "1h") {
    return 60;
  }

  if (timeframe === "1w") {
    return 60 * 24 * 7;
  }

  if (timeframe === "1mo") {
    return 60 * 24 * 30;
  }

  return 60 * 24;
}

function createPaperDemoCandles(strategyExport: StrategyExport, count = 80): PaperBacktestCandle[] {
  const entryPrice = strategyExport.entryPrice ?? strategyExport.strategySpec.dataUsed.entryPrice;
  const currentPrice = strategyExport.strategySpec.dataUsed.currentPrice;
  const stopLoss = strategyExport.strategySpec.stopLoss;
  const dynamicExit = strategyExport.trailingExit?.initialReference ?? strategyExport.strategySpec.takeProfit;
  const timeframe = strategyExport.strategyTimeframe ?? strategyExport.strategySpec.strategyTimeframe;
  const baseDate = new Date(strategyExport.dataProvenance.generatedAt);
  const safeBaseDate = Number.isNaN(baseDate.getTime()) ? new Date(0) : baseDate;
  const spacingMinutes = getDemoCandleSpacingMinutes(timeframe);
  const startDate = addMinutes(safeBaseDate, -spacingMinutes * count);
  const minLevel = Math.min(entryPrice, currentPrice, stopLoss);
  const maxLevel = Math.max(entryPrice, currentPrice, dynamicExit);
  const range = Math.max(maxLevel - minLevel, entryPrice * 0.03, 0.00000001);

  return Array.from({ length: count }, (_, index) => {
    const progress = count === 1 ? 1 : index / (count - 1);
    const wave = Math.sin(progress * Math.PI * 3) * range * 0.08;
    const close = entryPrice + (currentPrice - entryPrice) * progress + wave;
    const previousProgress = count === 1 ? 0 : Math.max(index - 1, 0) / (count - 1);
    const open =
      index === 0
        ? entryPrice * 0.995
        : entryPrice + (currentPrice - entryPrice) * previousProgress + Math.sin(previousProgress * Math.PI * 3) * range * 0.08;
    const high = Math.max(open, close, index === Math.floor(count * 0.64) ? dynamicExit * 1.002 : close) + range * 0.025;
    const low = Math.min(open, close, index === Math.floor(count * 0.36) ? entryPrice * 0.998 : close) - range * 0.025;
    const openTime = addMinutes(startDate, spacingMinutes * index);
    const closeTime = addMinutes(openTime, spacingMinutes);

    return {
      openTime: openTime.toISOString(),
      open: roundNumber(open, open < 1 ? 8 : 4),
      high: roundNumber(high, high < 1 ? 8 : 4),
      low: roundNumber(Math.max(low, 0.00000001), low < 1 ? 8 : 4),
      close: roundNumber(Math.max(close, 0.00000001), close < 1 ? 8 : 4),
      volume: roundNumber((strategyExport.marketContext.quote.volume24h || 1_000_000) / Math.max(24, count), 2),
      closeTime: closeTime.toISOString(),
    };
  });
}

function getPaperNoTradeMessage(strategyExport: StrategyExport) {
  const signal = strategyExport.backtestSpec?.signal;

  if (signal === "ABSTAIN") {
    return "capital protected / no position opened";
  }

  return "capital protected / no position opened";
}

function shouldPaperBacktestOpenPosition(strategyExport: StrategyExport) {
  const signal = strategyExport.backtestSpec?.signal;
  const strategyType = strategyExport.strategySpec.strategyType;
  const decision = strategyExport.strategyDecision;

  if (
    signal === "ABSTAIN" ||
    strategyType === "no_trade" ||
    decision.noTradeRecommended ||
    decision.riskBadge === "no_trade" ||
    strategyExport.riskBadge === "no_trade"
  ) {
    return false;
  }

  return Boolean(
    strategyExport.backtestSpec?.shouldOpenPosition &&
      (signal === "LONG" || signal === "CONDITIONAL_LONG"),
  );
}

export function runPaperBacktest(input: RunPaperBacktestInput): PaperBacktestResult {
  const strategyExport = input.strategyExport;
  const symbol = strategyExport.symbol ?? strategyExport.strategySpec.asset;
  const timeframe = strategyExport.strategyTimeframe ?? strategyExport.strategySpec.strategyTimeframe;
  const entryPrice = strategyExport.entryPrice ?? strategyExport.strategySpec.dataUsed.entryPrice;
  const positionSize = strategyExport.positionSize ?? strategyExport.calculatedPositionSize ?? 0;
  const stopLoss = strategyExport.strategySpec.stopLoss;
  const dynamicExit = strategyExport.trailingExit?.initialReference ?? strategyExport.strategySpec.takeProfit;
  const riskBadge = isValidRiskBadge(strategyExport.riskBadge)
    ? strategyExport.riskBadge
    : isValidRiskBadge(strategyExport.strategyDecision.riskBadge)
      ? strategyExport.strategyDecision.riskBadge
      : "medium";
  const candles = input.candles?.length ? input.candles : createPaperDemoCandles(strategyExport);
  const allowOpen = shouldPaperBacktestOpenPosition(strategyExport);
  const notes = [
    input.dataSource === "binance_public_klines"
      ? "Used Binance Market Data public klines only."
      : "Used the documented demo fallback because Binance public klines were unavailable.",
    "Paper simulation only; no orders, wallets, exchange accounts, balances, or private credentials are used.",
  ];

  if (input.fallbackReason) {
    notes.push(input.fallbackReason);
  }

  if (!allowOpen) {
    return {
      symbol,
      pairUsed: input.pairUsed,
      timeframe,
      dataSource: input.dataSource,
      candlesUsed: candles.length,
      positionIntent: strategyExport.positionIntent,
      riskBadge,
      entryPrice,
      stopLoss,
      dynamicExit,
      entryTriggered: false,
      stopHit: false,
      dynamicExitHit: false,
      result: strategyExport.strategySpec.strategyType === "no_trade" || riskBadge === "no_trade" ? "no_trade" : "not_triggered",
      returnPercentage: 0,
      estimatedPnL: 0,
      maxDrawdownPercentage: 0,
      message: getPaperNoTradeMessage(strategyExport),
      notes,
      fallbackReason: input.fallbackReason,
      candles,
      events: [],
    };
  }

  const entryIndex = candles.findIndex((candle) => candle.low <= entryPrice && candle.high >= entryPrice);
  const entryTriggered = entryIndex >= 0;

  if (!entryTriggered) {
    return {
      symbol,
      pairUsed: input.pairUsed,
      timeframe,
      dataSource: input.dataSource,
      candlesUsed: candles.length,
      positionIntent: strategyExport.positionIntent,
      riskBadge,
      entryPrice,
      stopLoss,
      dynamicExit,
      entryTriggered: false,
      stopHit: false,
      dynamicExitHit: false,
      result: "not_triggered",
      returnPercentage: 0,
      estimatedPnL: 0,
      maxDrawdownPercentage: 0,
      message: "entry not triggered / no position opened",
      notes,
      fallbackReason: input.fallbackReason,
      candles,
      events: [],
    };
  }

  const simulationCandles = candles.slice(entryIndex);
  const events: PaperBacktestEvent[] = [
    { type: "entry", price: entryPrice, time: candles[entryIndex]?.openTime ?? candles[0]?.openTime ?? "" },
  ];
  let stopHit = false;
  let dynamicExitHit = false;
  let exitPrice = simulationCandles.at(-1)?.close ?? entryPrice;

  for (const candle of simulationCandles) {
    if (candle.low <= stopLoss) {
      stopHit = true;
      exitPrice = stopLoss;
      events.push({ type: "stop", price: stopLoss, time: candle.closeTime });
      break;
    }

    if (candle.high >= dynamicExit) {
      dynamicExitHit = true;
      exitPrice = dynamicExit;
      events.push({ type: "dynamic_exit", price: dynamicExit, time: candle.closeTime });
      break;
    }
  }

  const returnPercentage = ((exitPrice - entryPrice) / entryPrice) * 100;
  const estimatedPnL = (exitPrice - entryPrice) * positionSize;
  const worstLow = Math.min(...simulationCandles.map((candle) => candle.low), entryPrice);
  const maxDrawdownPercentage = Math.min(((worstLow - entryPrice) / entryPrice) * 100, 0);
  const result =
    Math.abs(returnPercentage) < 0.01
      ? "flat"
      : returnPercentage > 0
        ? "win"
        : "loss";

  return {
    symbol,
    pairUsed: input.pairUsed,
    timeframe,
    dataSource: input.dataSource,
    candlesUsed: candles.length,
    positionIntent: strategyExport.positionIntent,
    riskBadge,
    entryPrice,
    stopLoss,
    dynamicExit,
    entryTriggered,
    stopHit,
    dynamicExitHit,
    result,
    returnPercentage: roundNumber(returnPercentage, 2),
    estimatedPnL: roundNumber(estimatedPnL, 4),
    maxDrawdownPercentage: roundNumber(maxDrawdownPercentage, 2),
    message: stopHit
      ? "stop loss touched in the paper simulation"
      : dynamicExitHit
        ? "dynamic exit touched in the paper simulation"
        : "position marked to final candle close in the paper simulation",
    notes,
    fallbackReason: input.fallbackReason,
    candles,
    events,
  };
}
