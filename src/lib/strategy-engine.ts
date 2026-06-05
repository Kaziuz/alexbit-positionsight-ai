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

  if (position.maxRiskPercentage > 8 || absoluteMoveFromEntry > position.maxRiskPercentage * 2.5) {
    return "no_trade";
  }

  if (quote.percentChange24h > 2.5 && quote.volume24h > 500_000_000) {
    return "breakout_with_volume";
  }

  if (pnlPercentage < -position.maxRiskPercentage * 0.75 || quote.percentChange24h < -1.5) {
    return "defensive_mean_reversion";
  }

  return "trend_following_pullback";
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
        "Wait for price to hold above entry after a shallow pullback and confirm momentum with a higher low.",
      exitCondition: "Exit on stop loss, take profit, or a close below invalidation level.",
    },
    breakout_with_volume: {
      entryCondition:
        "Enter only if price confirms strength above current price with elevated volume versus the 24h baseline.",
      exitCondition: "Trail risk after a confirmed breakout, then exit on take profit or failed retest.",
    },
    defensive_mean_reversion: {
      entryCondition:
        "Do not add exposure unless price stabilizes near support and recovers above entry with reduced downside pressure.",
      exitCondition: "Reduce or close exposure if price loses the stop level or fails to reclaim entry.",
    },
    no_trade: {
      entryCondition: "No new entry. Position risk is outside the configured limit.",
      exitCondition: "Wait for volatility and downside exposure to return inside risk constraints.",
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
          ? "Configured risk is high or current price is too far from entry for a fresh strategy signal."
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
