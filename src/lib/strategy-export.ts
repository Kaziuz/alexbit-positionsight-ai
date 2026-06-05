import type { BacktestSpec, MarketContext, PositionInput, StrategyDecision, StrategyExport } from "@/types/strategy";

function getInputSchema(): StrategyExport["inputSchema"] {
  return {
    required: ["symbol", "entryPrice", "positionSize", "timeframe", "maxRiskPercentage", "strategyMode"],
    properties: {
      symbol: { type: "string", description: "Eligible token symbol to analyze." },
      entryPrice: { type: "number", exclusiveMinimum: 0, description: "User entry price or planned entry price." },
      positionSize: { type: "number", exclusiveMinimum: 0, description: "Token quantity held or planned." },
      timeframe: { type: "string", enum: ["15m", "1h", "4h", "1d"], description: "Strategy evaluation interval." },
      maxRiskPercentage: {
        type: "number",
        minimum: 1,
        maximum: 6,
        description: "Maximum percentage of entry price to risk if setup fails.",
      },
      strategyMode: {
        type: "string",
        enum: ["auto", "trend_confirmation", "breakout_retest", "defensive_rebound", "risk_check"],
        description: "Auto or user-selected strategy mode.",
      },
    },
  };
}

function getCommonRules(position: PositionInput, decision: StrategyDecision, context: MarketContext) {
  const spec = decision.spec;

  return {
    stopRule: {
      type: "fixed_price_stop",
      stopLoss: spec.stopLoss,
      trigger: "close_at_or_below_stop_loss",
    },
    takeProfitRule: {
      type: "fixed_price_target",
      takeProfit: spec.takeProfit,
      allowTrailingRunner: true,
      trigger: "close_at_or_above_take_profit",
    },
    invalidationRule: {
      type: "price_level",
      invalidationLevel: spec.invalidationLevel,
      trigger: "close_below_invalidation_level",
    },
    positionSizing: {
      type: "risk_based",
      entryPrice: position.entryPrice,
      positionSize: position.positionSize,
      maxRiskPercentage: position.maxRiskPercentage,
      estimatedRiskAmount: spec.riskRules.estimatedRiskAmount,
      sizingNote: "Size positions from defined risk, not available capital alone.",
    },
    riskManagement: {
      maxRiskPercentage: position.maxRiskPercentage,
      riskControlled: position.maxRiskPercentage <= 4,
      liquidityScore: context.orderBook.liquidityScore,
      sentimentLabel: context.sentiment.label,
      noLiveExecution: true,
    },
  };
}

export function createBacktestSpec(
  position: PositionInput,
  decision: StrategyDecision,
  context: MarketContext,
): BacktestSpec {
  const spec = decision.spec;
  const common = getCommonRules(position, decision, context);
  const fitAllowsOpen = decision.fit === "good" || decision.fit === "caution";

  if (spec.strategyType === "no_trade") {
    return {
      strategyType: spec.strategyType,
      signal: "ABSTAIN",
      shouldOpenPosition: false,
      entryRule: {
        type: "none",
        reason: spec.riskRules.noTradeReason ?? "No-trade selected because risk or market structure is unclear.",
      },
      exitRule: { type: "none" },
      ...common,
    };
  }

  if (spec.strategyType === "breakout_with_volume") {
    return {
      strategyType: spec.strategyType,
      signal: "LONG",
      shouldOpenPosition: fitAllowsOpen,
      entryRule: {
        type: "breakout_retest",
        closePosition: context.technicals.closePosition,
        allowedClosePositions: ["breakout", "near_resistance"],
        minimumPercentChange24h: 2.5,
        actualPercentChange24h: context.quote.percentChange24h,
        minimumVolume24h: 150_000_000,
        actualVolume24h: context.quote.volume24h,
        minimumLiquidityScore: 68,
        actualLiquidityScore: context.orderBook.liquidityScore,
        sentimentMustNotBe: "bearish",
        actualSentiment: context.sentiment.label,
      },
      exitRule: {
        type: "failed_retest_or_target",
        failedRetestTrigger: "close_below_breakout_or_invalidation_area",
        trailingExit: "trail_after_take_profit_if_trend_filter_holds",
      },
      ...common,
    };
  }

  if (spec.strategyType === "defensive_mean_reversion") {
    const riskControlled = position.maxRiskPercentage <= 4;

    return {
      strategyType: spec.strategyType,
      signal: riskControlled ? "CONDITIONAL_LONG" : "ABSTAIN",
      shouldOpenPosition: riskControlled && fitAllowsOpen,
      entryRule: {
        type: riskControlled ? "support_stabilization" : "none",
        requiresSupportStabilization: true,
        support: context.technicals.support,
        currentPrice: context.quote.price,
        rsi14: context.technicals.rsi14,
        maxRiskPercentage: position.maxRiskPercentage,
        reason: riskControlled
          ? "Only valid if price stabilizes near support and risk remains controlled."
          : "Risk is not controlled enough for a defensive rebound.",
      },
      exitRule: {
        type: "quick_loss_cut_or_recovery",
        reduceIf: "close_below_stop_loss_or_support",
        holdOnlyIf: "higher_timeframe_close_confirms_support",
      },
      ...common,
    };
  }

  return {
    strategyType: spec.strategyType,
    signal: "LONG",
    shouldOpenPosition: fitAllowsOpen,
    entryRule: {
      type: "trend_confirmation",
      requiresTrendState: ["bullish", "neutral"],
      actualTrendState: context.technicals.trendState,
      requiresPriceAboveSupport: true,
      support: context.technicals.support,
      currentPrice: context.quote.price,
      emaConditions: {
        ema20: context.technicals.ema20,
        ema50: context.technicals.ema50,
        ema200: context.technicals.ema200,
        preferredRelationship: "ema20 >= ema50 >= ema200 or neutral-to-bullish trend",
      },
      rsi14: context.technicals.rsi14,
      rsiMustBeBelow: 72,
      maxRiskPercentage: position.maxRiskPercentage,
    },
    exitRule: {
      type: "target_or_trailing_exit",
      trailingExit: "trail_remaining_position while price holds above trend filter",
      cutLossIf: "close_below_invalidation_or_stop",
    },
    ...common,
  };
}

export function createStrategyExport(
  position: PositionInput,
  decision: StrategyDecision,
  context: MarketContext,
): StrategyExport {
  return {
    schemaVersion: "1.0.0",
    skill: {
      name: "positionsight-ai",
      track: "strategy_skills",
      artifactType: "backtestable_strategy_spec",
    },
    inputSchema: getInputSchema(),
    dataProvenance: {
      source: context.source,
      isLive: context.source === "coinmarketcap",
      intendedLiveSource: "CoinMarketCap",
      generatedAt: new Date().toISOString(),
    },
    dataRequirements: {
      requiredSeries: ["open", "high", "low", "close", "volume"],
      interval: position.timeframe,
      lookbackPeriods: 200,
      requiredIndicators: ["ema20", "ema50", "ema200", "rsi14", "atr14", "support", "resistance"],
    },
    backtestSpec: createBacktestSpec(position, decision, context),
    executionAssumptions: {
      initialCapital: 10000,
      feesBps: 10,
      slippageBps: 5,
      allowShort: false,
      allowLeverage: false,
      orderType: "market_on_next_close",
    },
    evaluationMetrics: [
      "total_return",
      "max_drawdown",
      "win_rate",
      "profit_factor",
      "sharpe_ratio",
      "number_of_trades",
    ],
    validation: {
      backtestReady: true,
      limitations: ["mock data", "not financial advice", "no live execution"],
    },
    strategySpec: decision.spec,
    strategyDecision: {
      selectedMode: decision.selectedMode,
      selectedBy: decision.selectedBy,
      fit: decision.fit,
      whyThisStrategy: decision.whyThisStrategy,
      warnings: decision.warnings,
      nextConfirmation: decision.nextConfirmation,
      beginnerExplanation: decision.beginnerExplanation,
    },
    marketContext: context,
    explanation: decision.beginnerExplanation,
    warnings: decision.warnings,
  };
}
