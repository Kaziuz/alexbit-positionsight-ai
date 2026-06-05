import type {
  MarketContext,
  MarketQuote,
  PositionInput,
  StrategyDecision,
  StrategyFit,
  StrategyMode,
  StrategySpec,
  StrategyType,
} from "@/types/strategy";

function roundPrice(value: number) {
  if (value < 0.01) {
    return Number(value.toFixed(8));
  }

  if (value < 1) {
    return Number(value.toFixed(5));
  }

  return Number(value.toFixed(2));
}

function isMarketContext(input: MarketQuote | MarketContext): input is MarketContext {
  return "quote" in input && "technicals" in input;
}

function quoteFromInput(input: MarketQuote | MarketContext): MarketQuote {
  if (!isMarketContext(input)) {
    return input;
  }

  return {
    symbol: input.symbol,
    price: input.quote.price,
    percentChange24h: input.quote.percentChange24h,
    volume24h: input.quote.volume24h,
    marketCap: input.quote.marketCap,
    lastUpdated: input.quote.lastUpdated,
    source: input.source,
  };
}

function getModeStrategyType(mode: StrategyMode): StrategyType | undefined {
  const map: Record<Exclude<StrategyMode, "auto">, StrategyType> = {
    trend_confirmation: "trend_following_pullback",
    breakout_retest: "breakout_with_volume",
    defensive_rebound: "defensive_mean_reversion",
    risk_check: "no_trade",
  };

  return mode === "auto" ? undefined : map[mode];
}

function getMarketSignals(position: PositionInput, quote: MarketQuote, context?: MarketContext) {
  const pnlPercentage = ((quote.price - position.entryPrice) / position.entryPrice) * 100;
  const absoluteMoveFromEntry = Math.abs(pnlPercentage);
  const riskControlled = position.maxRiskPercentage <= 4;
  const priceAboveSupport = context ? quote.price >= context.technicals.support : quote.price >= position.entryPrice;
  const emaBullish =
    context &&
    context.technicals.ema20 >= context.technicals.ema50 &&
    context.technicals.ema50 >= context.technicals.ema200;
  const rsiOverbought = context ? context.technicals.rsi14 >= 72 : false;
  const rsiWeak = context ? context.technicals.rsi14 <= 42 : quote.percentChange24h < -1.5;
  const nearSupport = context
    ? Math.abs(quote.price - context.technicals.support) / quote.price <= 0.06
    : pnlPercentage < position.maxRiskPercentage;
  const breakoutLike =
    context?.technicals.closePosition === "breakout" || context?.technicals.closePosition === "near_resistance";
  const liquidityAcceptable = context ? context.orderBook.liquidityScore >= 55 : true;
  const liquidityStrong = context ? context.orderBook.liquidityScore >= 68 : quote.volume24h > 500_000_000;
  const buyPressurePositive = context ? context.orderBook.buyPressure >= context.orderBook.sellPressure + 8 : true;
  const sentimentNotBearish = context ? context.sentiment.label !== "bearish" : true;
  const bearishWeakContext =
    context?.technicals.trendState === "bearish" &&
    context.sentiment.label === "bearish" &&
    context.orderBook.liquidityScore < 60;
  const memeRisk =
    ["DOGE", "SHIB", "BONK", "FLOKI", "PENGU", "LUNC"].includes(position.symbol) &&
    (context?.orderBook.liquidityScore ?? 70) < 65;
  const derivativesConflict =
    context &&
    position.maxRiskPercentage > 4 &&
    (context.derivatives.fundingBias === "unavailable" ||
      context.derivatives.longShortBias === "unavailable" ||
      (context.derivatives.fundingBias === "positive" && context.derivatives.longShortBias === "short") ||
      (context.derivatives.fundingBias === "negative" && context.derivatives.longShortBias === "long"));
  const clearUltraShortBreakout =
    riskControlled &&
    quote.price > position.entryPrice &&
    quote.percentChange24h >= 3.5 &&
    liquidityStrong &&
    buyPressurePositive &&
    absoluteMoveFromEntry <= position.maxRiskPercentage * 1.5;

  return {
    pnlPercentage,
    absoluteMoveFromEntry,
    riskControlled,
    priceAboveSupport,
    emaBullish,
    rsiOverbought,
    rsiWeak,
    nearSupport,
    breakoutLike,
    liquidityAcceptable,
    liquidityStrong,
    buyPressurePositive,
    sentimentNotBearish,
    bearishWeakContext,
    memeRisk,
    derivativesConflict,
    clearUltraShortBreakout,
  };
}

function getAutoStrategyType(position: PositionInput, input: MarketQuote | MarketContext): StrategyType {
  const quote = quoteFromInput(input);
  const context = isMarketContext(input) ? input : undefined;
  const signals = getMarketSignals(position, quote, context);

  if (
    position.maxRiskPercentage > 6 ||
    signals.absoluteMoveFromEntry > position.maxRiskPercentage * 2 ||
    (Math.abs(quote.percentChange24h) < 0.5 && signals.absoluteMoveFromEntry < position.maxRiskPercentage) ||
    (position.timeframe === "15m" && !signals.clearUltraShortBreakout) ||
    signals.bearishWeakContext ||
    !signals.liquidityAcceptable ||
    signals.memeRisk ||
    signals.derivativesConflict
  ) {
    return "no_trade";
  }

  if (
    quote.price > position.entryPrice &&
    quote.percentChange24h > 2.5 &&
    quote.volume24h > 150_000_000 &&
    signals.breakoutLike &&
    signals.liquidityStrong &&
    signals.buyPressurePositive &&
    signals.sentimentNotBearish
  ) {
    return "breakout_with_volume";
  }

  if (
    signals.riskControlled &&
    signals.liquidityAcceptable &&
    (signals.rsiWeak || quote.percentChange24h < -1.5 || signals.nearSupport) &&
    signals.priceAboveSupport
  ) {
    return "defensive_mean_reversion";
  }

  if (
    signals.riskControlled &&
    signals.priceAboveSupport &&
    !signals.rsiOverbought &&
    (!context || context.technicals.trendState !== "bearish") &&
    (!context || signals.emaBullish || context.technicals.trendState === "neutral")
  ) {
    return "trend_following_pullback";
  }

  return "no_trade";
}

function getNoTradeReason(position: PositionInput, input: MarketQuote | MarketContext) {
  const quote = quoteFromInput(input);
  const context = isMarketContext(input) ? input : undefined;
  const signals = getMarketSignals(position, quote, context);

  if (position.timeframe === "15m") {
    return "The 15m timeframe is too speculative for this MVP unless momentum, volume, and risk are exceptionally clear.";
  }

  if (position.maxRiskPercentage > 6) {
    return "Configured risk is too high for a capital-preservation strategy.";
  }

  if (signals.absoluteMoveFromEntry > position.maxRiskPercentage * 2) {
    return "Current price is too far from entry to create a realistic risk-managed setup.";
  }

  if (!signals.liquidityAcceptable) {
    return "Liquidity proxy is too weak for a beginner-friendly setup.";
  }

  if (signals.bearishWeakContext) {
    return "Trend, sentiment, and liquidity are aligned against the trade.";
  }

  if (signals.memeRisk) {
    return "Meme-asset context is high risk and does not have enough liquidity support.";
  }

  if (signals.derivativesConflict) {
    return "Derivatives proxy is unavailable or conflicting while risk is elevated.";
  }

  if (position.maxRiskPercentage > 4 && (signals.pnlPercentage < position.maxRiskPercentage * 0.5 || quote.percentChange24h < -1.5)) {
    return "Risk is not controlled enough for a defensive setup while market pressure is elevated.";
  }

  if (Math.abs(quote.percentChange24h) < 0.5 && signals.absoluteMoveFromEntry < position.maxRiskPercentage) {
    return "Market structure is unclear, so waiting for a stronger timeframe close is preferred.";
  }

  return "Risk or market structure is unclear for a fresh strategy signal.";
}

function copyForStrategy(strategyType: StrategyType) {
  const copy = {
    trend_following_pullback: {
      entryCondition:
        "Wait for a confirmed higher close or retest above the trend area before treating the pullback as a continuation setup.",
      exitCondition:
        "Cut the trade at invalidation, take partial profit at target, and trail any runner while price holds above the trend filter.",
    },
    breakout_with_volume: {
      entryCondition:
        "Enter only after breakout strength is confirmed by volume and price holds or retests above the breakout area.",
      exitCondition:
        "Exit on a failed retest, stop loss, or period close below invalidation; trail winners instead of closing too early.",
    },
    defensive_mean_reversion: {
      entryCondition:
        "Do not add exposure unless risk is controlled and price stabilizes near support with evidence of a rebound.",
      exitCondition:
        "Reduce quickly if price loses the stop level, and only hold for recovery if a higher timeframe close confirms support.",
    },
    no_trade: {
      entryCondition: "No new entry. Wait for clearer trend confirmation on a higher timeframe.",
      exitCondition: "Reconsider only after risk, entry distance, and market structure return inside controlled limits.",
    },
  } satisfies Record<StrategyType, { entryCondition: string; exitCondition: string }>;

  return copy[strategyType];
}

function buildStrategySpec(position: PositionInput, input: MarketQuote | MarketContext, strategyType: StrategyType): StrategySpec {
  const quote = quoteFromInput(input);
  const stopLossDistance = Math.max(position.maxRiskPercentage / 100, 0.01);
  const rewardDistance = stopLossDistance * 1.8;
  const stopLoss = roundPrice(position.entryPrice * (1 - stopLossDistance));
  const takeProfit = roundPrice(position.entryPrice * (1 + rewardDistance));
  const invalidationLevel = strategyType === "defensive_mean_reversion" ? stopLoss : roundPrice(stopLoss * 0.995);
  const estimatedRiskAmount = roundPrice(Math.abs(position.entryPrice - stopLoss) * position.positionSize);
  const copy = copyForStrategy(strategyType);

  return {
    asset: position.symbol,
    timeframe: position.timeframe,
    strategyType,
    entryCondition: copy.entryCondition,
    exitCondition: copy.exitCondition,
    stopLoss,
    takeProfit,
    invalidationLevel,
    riskRules: {
      maxRiskPercentage: position.maxRiskPercentage,
      positionSize: position.positionSize,
      estimatedRiskAmount,
      noTradeReason: strategyType === "no_trade" ? getNoTradeReason(position, input) : undefined,
    },
    dataUsed: {
      entryPrice: position.entryPrice,
      currentPrice: quote.price,
      percentChange24h: quote.percentChange24h,
      volume24h: quote.volume24h,
      marketCap: quote.marketCap,
      source: quote.source,
      lastUpdated: quote.lastUpdated,
    },
  };
}

function evaluateRequestedStrategy(
  position: PositionInput,
  input: MarketQuote | MarketContext,
  requestedType: StrategyType,
): { fit: StrategyFit; warnings: string[]; why: string; nextConfirmation: string; beginnerExplanation: string } {
  const quote = quoteFromInput(input);
  const context = isMarketContext(input) ? input : undefined;
  const autoType = getAutoStrategyType(position, input);
  const signals = getMarketSignals(position, quote, context);
  const warnings: string[] = [];
  let fit: StrategyFit = requestedType === autoType ? "good" : "caution";

  if (position.timeframe === "15m" && requestedType !== "no_trade" && !signals.clearUltraShortBreakout) {
    warnings.push("15m setups are usually too speculative for this MVP.");
    fit = "poor";
  }

  if (signals.absoluteMoveFromEntry > position.maxRiskPercentage * 2 && requestedType !== "no_trade") {
    warnings.push("Entry price is too far from current price for a clean risk setup.");
    fit = "poor";
  }

  if (!signals.liquidityAcceptable && requestedType !== "no_trade") {
    warnings.push("Liquidity proxy is weak, so forced strategy signals are unreliable.");
    fit = "poor";
  }

  if (["DOGE", "SHIB", "BONK", "FLOKI", "PENGU", "LUNC"].includes(position.symbol) && requestedType !== "no_trade") {
    warnings.push("Meme assets can move quickly; keep position risk small and wait for stronger confirmation.");
    fit = fit === "good" ? "caution" : fit;
  }

  if (requestedType === "breakout_with_volume" && !(signals.breakoutLike && quote.percentChange24h > 2.5 && signals.buyPressurePositive)) {
    warnings.push("Breakout + Retest needs stronger momentum, volume, and a clear retest or breakout area.");
    fit = fit === "poor" ? "poor" : "caution";
  }

  if (requestedType === "trend_following_pullback" && (!signals.priceAboveSupport || signals.rsiOverbought)) {
    warnings.push("Trend Confirmation needs price above support and RSI that is not extremely overheated.");
    fit = fit === "poor" ? "poor" : "caution";
  }

  if (requestedType === "defensive_mean_reversion" && !(signals.riskControlled && signals.nearSupport && signals.liquidityAcceptable)) {
    warnings.push("Defensive Rebound only fits when risk is controlled and price is near support.");
    fit = fit === "poor" ? "poor" : "caution";
  }

  if (requestedType === "no_trade") {
    fit = autoType === "no_trade" ? "good" : "caution";
    if (autoType !== "no_trade") {
      warnings.push("Auto mode sees a possible setup, but Risk Check is still valid for conservative traders.");
    }
  }

  const labels: Record<StrategyType, string> = {
    trend_following_pullback: "trend confirmation",
    breakout_with_volume: "breakout and retest",
    defensive_mean_reversion: "defensive rebound",
    no_trade: "risk check / no-trade",
  };

  return {
    fit,
    warnings,
    why:
      fit === "good"
        ? `The selected ${labels[requestedType]} mode matches the current mock market context.`
        : `Auto mode prefers ${labels[autoType]}, while the selected mode needs more confirmation.`,
    nextConfirmation:
      requestedType === "breakout_with_volume"
        ? "Wait for price to hold above the breakout area after a retest."
        : requestedType === "trend_following_pullback"
          ? "Wait for a higher-timeframe close above support or the trend filter."
          : requestedType === "defensive_mean_reversion"
            ? "Wait for stabilization near support and avoid averaging down without confirmation."
            : "Wait for risk, liquidity, and market structure to improve before taking a new setup.",
    beginnerExplanation:
      requestedType === "no_trade"
        ? "No-trade means protecting capital when the setup is not clear enough."
        : "PositionSight compares the selected setup against trend, risk, liquidity, and momentum context before recommending it.",
  };
}

export function generateStrategySpec(position: PositionInput, input: MarketQuote | MarketContext): StrategySpec {
  return buildStrategySpec(position, input, getAutoStrategyType(position, input));
}

export function generateStrategyDecision(
  position: PositionInput,
  input: MarketQuote | MarketContext,
  selectedMode: StrategyMode = "auto",
): StrategyDecision {
  const selectedBy = selectedMode === "auto" ? "auto" : "user";
  const autoType = getAutoStrategyType(position, input);
  const requestedType = getModeStrategyType(selectedMode) ?? autoType;
  const evaluation = evaluateRequestedStrategy(position, input, requestedType);
  const finalType = selectedBy === "user" && evaluation.fit === "poor" ? "no_trade" : requestedType;
  const spec = buildStrategySpec(position, input, finalType);

  return {
    spec,
    selectedMode,
    selectedBy,
    fit: evaluation.fit,
    whyThisStrategy:
      selectedBy === "auto"
        ? `Auto Recommended selected this because the strongest fit is ${spec.strategyType.replaceAll("_", " ")}.`
        : evaluation.why,
    warnings: evaluation.warnings,
    nextConfirmation: evaluation.nextConfirmation,
    beginnerExplanation: evaluation.beginnerExplanation,
  };
}
