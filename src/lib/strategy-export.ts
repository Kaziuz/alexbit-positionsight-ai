import type {
  BacktestSpec,
  HistoryResponse,
  MarketContext,
  PositionInput,
  StrategyDecision,
  StrategyExport,
} from "@/types/strategy";
import {
  getAggregationHint,
  getTimeframeCategory,
  getTimeframeProfile,
  getTimeframeWarning,
} from "./strategy-timeframe";

function getInputSchema(): StrategyExport["inputSchema"] {
  return {
    required: [
      "symbol",
      "entryPrice",
      "positionSize",
      "totalCapital",
      "strategyTimeframe",
      "timeframeCategory",
      "analysisInterval",
      "maxRiskPercentage",
      "positionIntent",
      "strategyMode",
    ],
    properties: {
      symbol: { type: "string", description: "Eligible token symbol to analyze." },
      entryPrice: { type: "number", exclusiveMinimum: 0, description: "User entry price or planned entry price." },
      positionSize: {
        type: "number",
        exclusiveMinimum: 0,
        description: "Calculated token quantity based on total capital, max risk, entry, ATR, and stop distance.",
      },
      totalCapital: { type: "number", exclusiveMinimum: 0, description: "Capital base used for risk sizing." },
      strategyTimeframe: {
        type: "string",
        enum: ["15m", "30m", "1h", "1d", "1w", "1mo"],
        description: "Selected strategy timeframe.",
      },
      timeframeCategory: {
        type: "string",
        enum: ["intraday", "daily", "weekly", "monthly"],
        description: "Risk category derived from the selected timeframe.",
      },
      analysisInterval: {
        type: "string",
        enum: ["15m", "30m", "1h", "1d", "1w", "1mo"],
        description: "Backtest analysis interval. Weekly and monthly selections include an aggregation hint.",
      },
      maxRiskPercentage: {
        type: "number",
        minimum: 0.5,
        maximum: 6,
        description: "Maximum percentage of total capital to risk if setup fails. PositionSight defaults to 1%.",
      },
      strategyMode: {
        type: "string",
        enum: ["auto", "trend_confirmation", "breakout_retest", "defensive_rebound", "risk_check"],
        description: "Auto or user-selected strategy mode.",
      },
      positionIntent: {
        type: "string",
        enum: ["analyze_entry", "manage_open_position", "exit_review"],
        description: "Whether the user is evaluating a new entry, managing an open position, or reviewing exit/reduction conditions.",
      },
    },
  };
}

function getCommonRules(position: PositionInput, decision: StrategyDecision, context: MarketContext) {
  const spec = decision.spec;
  const timeframe = getTimeframeProfile(position.strategyTimeframe);
  const trailingExit = {
    enabled: true as const,
    method: "atr_ma_trailing" as const,
    initialReference: spec.takeProfit,
    atrMultiple: spec.riskRules.atrMultiple ?? 1.75,
  };

  return {
    stopRule: {
      type: spec.riskRules.positionSizingMethod === "atr_volatility" ? "atr_volatility_stop" : "fixed_price_stop",
      stopLoss: spec.stopLoss,
      atrMultiple: spec.riskRules.atrMultiple,
      stopDistance: spec.riskRules.stopDistance,
      trigger: "close_at_or_below_stop_loss",
    },
    takeProfitRule: {
      type: "compatibility_trailing_reference",
      takeProfit: spec.takeProfit,
      trailingExit,
      trigger: "activate_trailing_exit_at_or_above_initial_reference",
    },
    trailingExit,
    invalidationRule: {
      type: "price_level",
      invalidationLevel: spec.invalidationLevel,
      trigger: "close_below_invalidation_level",
    },
    positionSizing: {
      type: "risk_based",
      sizingMode: decision.sizingMode,
      totalCapital: position.totalCapital,
      entryPrice: position.entryPrice,
      positionSize: position.positionSize,
      calculatedPositionSize:
        decision.sizingMode === "calculated_new_entry" ? position.positionSize : decision.spec.riskRules.calculatedPositionSize,
      maxRiskPercentage: position.maxRiskPercentage,
      stopDistance: spec.riskRules.stopDistance,
      method: spec.riskRules.positionSizingMethod,
      estimatedRiskAmount: spec.riskRules.estimatedRiskAmount,
      sizingNote:
        decision.sizingMode === "calculated_new_entry"
          ? "Size possible new entries from total capital, defined risk, volatility, and stop distance."
          : "Use the provided existing long position size; risk is measured against stop distance.",
    },
    riskManagement: {
      positionIntent: position.positionIntent,
      intentAction: decision.intentAction,
      intentVerdict: decision.intentVerdict,
      stopStatus: decision.stopStatus,
      shouldAddExposure: decision.shouldAddExposure,
      shouldReduceExposure: decision.shouldReduceExposure,
      shouldExitPosition: decision.shouldExitPosition,
      allowShort: false,
      sellReviewMeaning: "Exit/reduce a long position; short selling is out of scope for this MVP.",
      sizingMode: decision.sizingMode,
      chartMode: decision.chartMode,
      maxRiskPercentage: position.maxRiskPercentage,
      riskControlled: position.maxRiskPercentage <= timeframe.maxRiskForRiskControlled,
      timeframeCategory: getTimeframeCategory(position.strategyTimeframe),
      liquidityScore: context.orderBook.liquidityScore,
      sentimentLabel: context.sentiment.label,
      noLiveExecution: true,
    },
  };
}

function getBacktestBase(position: PositionInput, decision: StrategyDecision, strategyType: BacktestSpec["strategyType"]) {
  return {
    positionIntent: position.positionIntent,
    intentAction: decision.intentAction,
    intentVerdict: decision.intentVerdict,
    stopStatus: decision.stopStatus,
    shouldAddExposure: decision.shouldAddExposure,
    shouldReduceExposure: decision.shouldReduceExposure,
    shouldExitPosition: decision.shouldExitPosition,
    allowShort: false as const,
    sellReviewMeaning: "Exit/reduce a long position; short selling is out of scope for this MVP.",
    sizingMode: decision.sizingMode,
    chartMode: decision.chartMode,
    strategyType,
    strategyTimeframe: position.strategyTimeframe,
    timeframeCategory: getTimeframeCategory(position.strategyTimeframe),
    analysisInterval: position.analysisInterval,
    aggregationHint: getAggregationHint(position.strategyTimeframe),
    warning: getTimeframeWarning(position.strategyTimeframe),
  };
}

function shouldOpenForIntent(decision: StrategyDecision, fitAllowsOpen: boolean) {
  return decision.positionIntent === "analyze_entry" && decision.shouldAddExposure && fitAllowsOpen;
}

function getIntentSignal(decision: StrategyDecision, defaultSignal: BacktestSpec["signal"]) {
  if (decision.shouldExitPosition) {
    return "EXIT";
  }

  if (decision.shouldReduceExposure) {
    return "REDUCE";
  }

  if (decision.positionIntent !== "analyze_entry") {
    return decision.intentAction === "hold_with_trailing_exit" ? "HOLD" : "ABSTAIN";
  }

  return defaultSignal;
}

function getIntentEntryRule(position: PositionInput, baseRule: Record<string, unknown>) {
  if (position.positionIntent === "analyze_entry") {
    return baseRule;
  }

  return {
    type: "none",
    positionIntent: position.positionIntent,
    reason:
      position.positionIntent === "exit_review"
        ? "Review existing exposure for reduce or exit conditions; do not open a new position."
        : "Manage existing exposure with hold, reduce, or trailing-exit review; do not open a new position.",
    evaluatedRule: baseRule,
  };
}

export function createBacktestSpec(
  position: PositionInput,
  decision: StrategyDecision,
  context: MarketContext,
): BacktestSpec {
  const spec = decision.spec;
  const common = getCommonRules(position, decision, context);
  const timeframe = getTimeframeProfile(position.strategyTimeframe);
  const fitAllowsOpen = decision.fit === "good" || decision.fit === "caution";

  if (decision.noTradeRecommended || spec.strategyType === "no_trade") {
    return {
      ...getBacktestBase(position, decision, spec.strategyType),
      signal: getIntentSignal(decision, "ABSTAIN"),
      shouldOpenPosition: false,
      entryRule: {
        type: "none",
        positionIntent: position.positionIntent,
        evaluatedStrategyType: decision.evaluatedStrategyType,
        reason:
          decision.noTradeReason ??
          spec.riskRules.noTradeReason ??
          "No-trade selected because risk or market structure is unclear.",
      },
      exitRule:
        decision.shouldExitPosition || decision.shouldReduceExposure
          ? {
              type: decision.shouldExitPosition ? "exit_existing_long" : "reduce_existing_long",
              reason: decision.suggestedAction,
              stopStatus: decision.stopStatus,
            }
          : { type: "none" },
      ...common,
    };
  }

  if (spec.strategyType === "breakout_with_volume") {
    return {
      ...getBacktestBase(position, decision, spec.strategyType),
      signal: getIntentSignal(decision, "LONG"),
      shouldOpenPosition: shouldOpenForIntent(decision, fitAllowsOpen),
      entryRule: getIntentEntryRule(position, {
        type: "breakout_retest",
        closePosition: context.technicals.closePosition,
        allowedClosePositions: ["breakout", "near_resistance"],
        minimumPercentChange24h: timeframe.breakoutPercentChange,
        actualPercentChange24h: context.quote.percentChange24h,
        minimumVolume24h: timeframe.breakoutVolume,
        actualVolume24h: context.quote.volume24h,
        minimumLiquidityScore: timeframe.strongLiquidityScore,
        actualLiquidityScore: context.orderBook.liquidityScore,
        sentimentMustNotBe: "bearish",
        actualSentiment: context.sentiment.label,
      }),
      exitRule: {
        type: "failed_retest_or_target",
        failedRetestTrigger: "close_below_breakout_or_invalidation_area",
        trailingExit: "trail_after_take_profit_if_trend_filter_holds",
      },
      ...common,
    };
  }

  if (spec.strategyType === "defensive_mean_reversion") {
    const riskControlled = position.maxRiskPercentage <= timeframe.maxRiskForRiskControlled;

    return {
      ...getBacktestBase(position, decision, spec.strategyType),
      signal: getIntentSignal(decision, riskControlled ? "CONDITIONAL_LONG" : "ABSTAIN"),
      shouldOpenPosition: shouldOpenForIntent(decision, riskControlled && fitAllowsOpen),
      entryRule: getIntentEntryRule(position, {
        type: riskControlled ? "support_stabilization" : "none",
        requiresSupportStabilization: true,
        support: context.technicals.support,
        currentPrice: context.quote.price,
        rsi14: context.technicals.rsi14,
        maxRiskPercentage: position.maxRiskPercentage,
        reason: riskControlled
          ? "Only valid if price stabilizes near support and risk remains controlled."
          : "Risk is not controlled enough for a defensive rebound.",
      }),
      exitRule: {
        type: "quick_loss_cut_or_recovery",
        reduceIf: "close_below_stop_loss_or_support",
        holdOnlyIf: "selected_timeframe_close_confirms_support",
      },
      ...common,
    };
  }

  return {
    ...getBacktestBase(position, decision, spec.strategyType),
    signal: getIntentSignal(decision, "LONG"),
    shouldOpenPosition: shouldOpenForIntent(decision, fitAllowsOpen),
    entryRule: getIntentEntryRule(position, {
      type: "trend_confirmation",
      requiresTrendState: ["bullish", "neutral"],
      actualTrendState: context.technicals.trendState,
      requiresPriceAboveSupport: true,
      support: context.technicals.support,
      currentPrice: context.quote.price,
      maConditions: {
        ma20: context.technicals.ema20,
        ma50: context.technicals.ema50,
        ma200: context.technicals.ema200,
        preferredRelationship: "ma20 >= ma50 >= ma200 or neutral-to-bullish trend",
      },
      rsi14: context.technicals.rsi14,
      rsiMustBeBelow: 72,
      maxRiskPercentage: position.maxRiskPercentage,
    }),
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
  history?: HistoryResponse,
): StrategyExport {
  const historySource = history?.source ?? context.technicals.historySource ?? "estimated";
  const indicatorSource = historySource === "coinmarketcap" ? "coinmarketcap_ohlcv" : "estimated_candles";
  const estimatedHistoryWarning =
    "Historical OHLCV is unavailable with the current CoinMarketCap plan; chart path and indicators are estimated.";
  const indicatorWarnings = history?.warnings ?? context.technicals.indicatorWarnings ?? [];
  const limitations =
    context.source === "mock"
      ? [
          "mock data fallback",
          "Historical OHLCV is not integrated yet",
          "not financial advice",
          "no live execution",
        ]
      : [
          ...(historySource === "coinmarketcap"
            ? []
            : [
                "Historical OHLCV is unavailable with the current CoinMarketCap plan",
                "chart path and indicators are estimated",
              ]),
          "not financial advice",
          "no live execution",
        ];

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
      latestQuoteSource: context.source,
      historySource,
      isLive: context.source === "coinmarketcap",
      intendedLiveSource: "CoinMarketCap",
      generatedAt: new Date().toISOString(),
    },
    historySource,
    indicatorSource,
    chartSeriesType: historySource === "coinmarketcap" ? "historical_ohlcv" : "estimated_from_live_quote_context",
    advancedContextType: "estimated_until_ohlcv",
    dataRequirements: {
      requiredSeries: ["open", "high", "low", "close", "volume"],
      interval: position.analysisInterval,
      aggregationHint: getAggregationHint(position.strategyTimeframe),
      minimumHistoryDays: 200,
      lookbackPeriods: 200,
      requiredIndicators: ["ma20", "ma50", "ma200", "rsi14", "atr14", "support", "resistance"],
    },
    totalCapital: position.totalCapital,
    calculatedPositionSize: position.positionSize,
    positionIntent: position.positionIntent,
    intentAction: decision.intentAction,
    intentVerdict: decision.intentVerdict,
    stopStatus: decision.stopStatus,
    shouldAddExposure: decision.shouldAddExposure,
    shouldReduceExposure: decision.shouldReduceExposure,
    shouldExitPosition: decision.shouldExitPosition,
    allowShort: false,
    sellReviewMeaning: "Exit/reduce a long position; short selling is out of scope for this MVP.",
    sizingMode: decision.sizingMode,
    chartMode: decision.chartMode,
    selectedStrategyMode: decision.selectedStrategyMode,
    evaluatedStrategyType: decision.evaluatedStrategyType,
    finalRiskVerdict: decision.finalRiskVerdict,
    noTradeRecommended: decision.noTradeRecommended,
    noTradeReason: decision.noTradeReason,
    backtestSpec: createBacktestSpec(position, decision, context),
    trailingExit: {
      enabled: true,
      method: "atr_ma_trailing",
      initialReference: decision.spec.takeProfit,
      atrMultiple: decision.spec.riskRules.atrMultiple ?? 1.75,
    },
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
      limitations,
    },
    strategySpec: decision.spec,
    strategyDecision: {
      positionIntent: decision.positionIntent,
      intentAction: decision.intentAction,
      intentVerdict: decision.intentVerdict,
      stopStatus: decision.stopStatus,
      shouldAddExposure: decision.shouldAddExposure,
      shouldReduceExposure: decision.shouldReduceExposure,
      shouldExitPosition: decision.shouldExitPosition,
      allowShort: false,
      sizingMode: decision.sizingMode,
      chartMode: decision.chartMode,
      suggestedAction: decision.suggestedAction,
      decisionCondition: decision.decisionCondition,
      selectedMode: decision.selectedMode,
      selectedStrategyMode: decision.selectedStrategyMode,
      evaluatedStrategyType: decision.evaluatedStrategyType,
      finalRiskVerdict: decision.finalRiskVerdict,
      noTradeRecommended: decision.noTradeRecommended,
      noTradeReason: decision.noTradeReason,
      selectedBy: decision.selectedBy,
      fit: decision.fit,
      whyThisStrategy: decision.whyThisStrategy,
      warnings: decision.warnings,
      nextConfirmation: decision.nextConfirmation,
      beginnerExplanation: decision.beginnerExplanation,
    },
    marketContext: context,
    history: {
      source: historySource,
      candlesUsed: history?.candles.length ?? context.technicals.historyCandlesUsed ?? 0,
      indicatorSource,
      indicators: history?.indicators ?? {
        ema20: context.technicals.ema20,
        ema50: context.technicals.ema50,
        ema200: context.technicals.ema200,
        ma20: context.technicals.ema20,
        ma50: context.technicals.ema50,
        ma200: context.technicals.ema200,
        rsi14: context.technicals.rsi14,
        atr14: context.technicals.atr14,
        averageVolume: context.technicals.averageVolume ?? null,
        support: context.technicals.support,
        resistance: context.technicals.resistance,
      },
      warnings: historySource === "coinmarketcap" ? indicatorWarnings : [estimatedHistoryWarning, ...indicatorWarnings],
    },
    explanation: decision.beginnerExplanation,
    warnings:
      historySource === "coinmarketcap"
        ? [...decision.warnings, ...indicatorWarnings]
        : [...decision.warnings, estimatedHistoryWarning, ...indicatorWarnings],
  };
}
