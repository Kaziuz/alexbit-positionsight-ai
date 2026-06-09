import type {
  BacktestResult,
  BacktestSource,
  HistoryResponse,
  OhlcvCandle,
  PositionInput,
  StrategySpec,
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
