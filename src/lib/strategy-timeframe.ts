import type { AggregationHint, StrategyTimeframe, TimeframeCategory } from "@/types/strategy";

export const strategyTimeframes = ["15m", "30m", "1h", "1d", "1w", "1mo"] as const satisfies readonly StrategyTimeframe[];

export function getTimeframeCategory(strategyTimeframe: StrategyTimeframe): TimeframeCategory {
  if (strategyTimeframe === "1w") {
    return "weekly";
  }

  if (strategyTimeframe === "1mo") {
    return "monthly";
  }

  if (strategyTimeframe === "1d") {
    return "daily";
  }

  return "intraday";
}

export function getAggregationHint(strategyTimeframe: StrategyTimeframe): AggregationHint | undefined {
  if (strategyTimeframe === "1w") {
    return "weekly";
  }

  if (strategyTimeframe === "1mo") {
    return "monthly";
  }

  return undefined;
}

export function getTimeframeWarning(strategyTimeframe: StrategyTimeframe): string | undefined {
  return getTimeframeCategory(strategyTimeframe) === "intraday"
    ? "Intraday timeframe requires stronger confirmation and may be more speculative."
    : undefined;
}

export function getTimeframeProfile(strategyTimeframe: StrategyTimeframe) {
  const profiles: Record<
    StrategyTimeframe,
    {
      entryDistanceMultiplier: number;
      breakoutPercentChange: number;
      breakoutVolume: number;
      unclearMoveThreshold: number;
      minLiquidityScore: number;
      strongLiquidityScore: number;
      maxRiskForRiskControlled: number;
      trendRequiresBullishStructure: boolean;
      intradayStrict: boolean;
    }
  > = {
    "15m": {
      entryDistanceMultiplier: 1.15,
      breakoutPercentChange: 4,
      breakoutVolume: 250_000_000,
      unclearMoveThreshold: 1,
      minLiquidityScore: 70,
      strongLiquidityScore: 82,
      maxRiskForRiskControlled: 3,
      trendRequiresBullishStructure: true,
      intradayStrict: true,
    },
    "30m": {
      entryDistanceMultiplier: 1.25,
      breakoutPercentChange: 3.7,
      breakoutVolume: 225_000_000,
      unclearMoveThreshold: 0.9,
      minLiquidityScore: 68,
      strongLiquidityScore: 80,
      maxRiskForRiskControlled: 3,
      trendRequiresBullishStructure: true,
      intradayStrict: true,
    },
    "1h": {
      entryDistanceMultiplier: 1.5,
      breakoutPercentChange: 3,
      breakoutVolume: 200_000_000,
      unclearMoveThreshold: 0.75,
      minLiquidityScore: 62,
      strongLiquidityScore: 72,
      maxRiskForRiskControlled: 3.5,
      trendRequiresBullishStructure: true,
      intradayStrict: true,
    },
    "1d": {
      entryDistanceMultiplier: 2,
      breakoutPercentChange: 2.5,
      breakoutVolume: 150_000_000,
      unclearMoveThreshold: 0.5,
      minLiquidityScore: 55,
      strongLiquidityScore: 68,
      maxRiskForRiskControlled: 4,
      trendRequiresBullishStructure: false,
      intradayStrict: false,
    },
    "1w": {
      entryDistanceMultiplier: 2.5,
      breakoutPercentChange: 1.8,
      breakoutVolume: 100_000_000,
      unclearMoveThreshold: 0.35,
      minLiquidityScore: 50,
      strongLiquidityScore: 60,
      maxRiskForRiskControlled: 4.5,
      trendRequiresBullishStructure: false,
      intradayStrict: false,
    },
    "1mo": {
      entryDistanceMultiplier: 3,
      breakoutPercentChange: 1.2,
      breakoutVolume: 80_000_000,
      unclearMoveThreshold: 0.25,
      minLiquidityScore: 50,
      strongLiquidityScore: 58,
      maxRiskForRiskControlled: 4.5,
      trendRequiresBullishStructure: false,
      intradayStrict: false,
    },
  };

  return profiles[strategyTimeframe];
}
