import type { MarketQuote, PositionInput, StrategySpec, StrategyType } from "@/types/strategy";

function roundPrice(value: number) {
  if (value < 0.01) {
    return Number(value.toFixed(8));
  }

  if (value < 1) {
    return Number(value.toFixed(5));
  }

  return Number(value.toFixed(2));
}

function getStrategyType(position: PositionInput, quote: MarketQuote, pnlPercentage: number): StrategyType {
  const absoluteMoveFromEntry = Math.abs(pnlPercentage);
  const riskControlled = position.maxRiskPercentage <= 4;
  const ultraShortTimeframe = position.timeframe === "15m";
  const clearUltraShortBreakout =
    riskControlled &&
    quote.price > position.entryPrice &&
    quote.percentChange24h >= 3.5 &&
    quote.volume24h >= 500_000_000 &&
    absoluteMoveFromEntry <= position.maxRiskPercentage * 1.5;

  if (
    position.maxRiskPercentage > 6 ||
    absoluteMoveFromEntry > position.maxRiskPercentage * 2 ||
    (Math.abs(quote.percentChange24h) < 0.5 && absoluteMoveFromEntry < position.maxRiskPercentage) ||
    (ultraShortTimeframe && !clearUltraShortBreakout)
  ) {
    return "no_trade";
  }

  if (quote.price > position.entryPrice && quote.percentChange24h > 2.5 && quote.volume24h > 500_000_000) {
    return "breakout_with_volume";
  }

  if (!riskControlled && (pnlPercentage < position.maxRiskPercentage * 0.5 || quote.percentChange24h < -1.5)) {
    return "no_trade";
  }

  if (riskControlled && (pnlPercentage < position.maxRiskPercentage * 0.5 || quote.percentChange24h < -1.5)) {
    return "defensive_mean_reversion";
  }

  return "trend_following_pullback";
}

function getNoTradeReason(position: PositionInput, quote: MarketQuote, pnlPercentage: number) {
  const absoluteMoveFromEntry = Math.abs(pnlPercentage);

  if (position.timeframe === "15m") {
    return "The 15m timeframe is too speculative for this MVP unless momentum, volume, and risk are exceptionally clear.";
  }

  if (position.maxRiskPercentage > 6) {
    return "Configured risk is too high for a capital-preservation strategy.";
  }

  if (position.maxRiskPercentage > 4 && (pnlPercentage < position.maxRiskPercentage * 0.5 || quote.percentChange24h < -1.5)) {
    return "Risk is not controlled enough for a defensive setup while market pressure is elevated.";
  }

  if (absoluteMoveFromEntry > position.maxRiskPercentage * 2) {
    return "Current price is too far from entry to create a realistic risk-managed setup.";
  }

  if (Math.abs(quote.percentChange24h) < 0.5 && absoluteMoveFromEntry < position.maxRiskPercentage) {
    return "Market structure is unclear, so waiting for a stronger timeframe close is preferred.";
  }

  return "Risk or market structure is unclear for a fresh strategy signal.";
}

export function generateStrategySpec(position: PositionInput, quote: MarketQuote): StrategySpec {
  const pnlPercentage = ((quote.price - position.entryPrice) / position.entryPrice) * 100;
  const strategyType = getStrategyType(position, quote, pnlPercentage);
  const stopLossDistance = Math.max(position.maxRiskPercentage / 100, 0.01);
  const rewardDistance = stopLossDistance * 1.8;
  const stopLoss = roundPrice(position.entryPrice * (1 - stopLossDistance));
  const takeProfit = roundPrice(position.entryPrice * (1 + rewardDistance));
  const invalidationLevel = strategyType === "defensive_mean_reversion" ? stopLoss : roundPrice(stopLoss * 0.995);
  const estimatedRiskAmount = roundPrice(Math.abs(position.entryPrice - stopLoss) * position.positionSize);

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

  return {
    asset: position.symbol,
    timeframe: position.timeframe,
    strategyType,
    entryCondition: copy[strategyType].entryCondition,
    exitCondition: copy[strategyType].exitCondition,
    stopLoss,
    takeProfit,
    invalidationLevel,
    riskRules: {
      maxRiskPercentage: position.maxRiskPercentage,
      positionSize: position.positionSize,
      estimatedRiskAmount,
      noTradeReason:
        strategyType === "no_trade"
          ? getNoTradeReason(position, quote, pnlPercentage)
          : undefined,
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
