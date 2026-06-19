export type Language = "en" | "es";

export const languageLabels: Record<Language, string> = {
  en: "English",
  es: "Español",
};

export const translations = {
  en: {
    subtitle:
      "Beginner-friendly crypto position intelligence with live CMC quotes, estimated market context, visual risk levels, and backtest-ready strategy exports.",
    badge: "CoinMarketCap Strategy Skill MVP",
    language: "Language",
    strategyBuilderTab: "Strategy Builder",
    paperBacktestTab: "Paper Backtest",
    positionInput: "Position input",
    tokenList: "Token list",
    beginner: "Beginner",
    advanced: "Advanced",
    eligibleToken: "Eligible token",
    symbol: "Symbol",
    positionIntent: "Position intent",
    entryPrice: "Entry price",
    positionSize: "Position size",
    totalCapital: "Total capital",
    currentPositionSize: "Current position size",
    currentPositionSizeHelper: "Existing holdings used to measure open-position risk against the stop.",
    existingPositionRisk: "Estimated risk on existing position",
    calculatedPositionSize: "Calculated position size",
    calculatedPositionSizeHelper: "Calculated from capital, risk, entry price, ATR, and stop distance.",
    strategyTimeframe: "Strategy Timeframe",
    strategyMode: "Strategy mode",
    maxRiskPercentage: "Max risk percentage",
    localDate: "Local date",
    currentPrice: "Current price",
    move24h: "24h move",
    volume24h: "Volume 24h",
    marketCap: "Market cap",
    source: "Source",
    pnl: "P/L",
    unavailable: "Unavailable",
    cmcLiveQuote: "CMC live quote",
    coinMarketCapLiveQuote: "CoinMarketCap live quote",
    mockDataFallback: "Demo fallback",
    checkInputs: "Check position inputs",
    positionWarning: "Position warning",
    tokenCategory: "Category",
    tokenCategoryNote:
      "Current MVP uses live quotes when available and estimated context for demo reliability.",
    entryVsCurrentPrice: "Entry vs current price",
    loadingMarketContext: "Loading market context...",
    marketContextReady: "Market context ready",
    marketContextUnavailable: "Market context is unavailable.",
    loadingMockMarketContext: "Loading market context.",
    positionValue: "Position value",
    marketContext: "Market context",
    estimatedContextFields: "CoinMarketCap live quote; estimated context fields",
    historySource: "History Source",
    coinMarketCapHistoricalOhlcv: "Historical candles from CoinMarketCap",
    coinMarketCapHistoricalShort: "CoinMarketCap historical",
    estimatedHistory: "Estimated candles from live quote context",
    estimatedCandlesShort: "Estimated candles",
    latestAndHistoryFromCmc: "Latest quote and historical candles come from CoinMarketCap.",
    latestLiveHistoryEstimated:
      "The latest quote is live from CoinMarketCap. The chart path and some indicators are estimated until historical OHLCV is available.",
    notEnoughHistory: "Not enough history",
    averageVolume: "Average Volume",
    avgVolume: "Avg Volume",
    support: "Support",
    resistance: "Resistance",
    trend: "Trend",
    sentiment: "Sentiment",
    liquidity: "Liquidity",
    derivatives: "Derivatives",
    dataNote: "Data note",
    strategySignal: "Strategy signal",
    strategyType: "Strategy type",
    strategyEvaluated: "Strategy evaluated",
    selectedStrategy: "Selected strategy",
    riskVerdict: "Risk verdict",
    riskBadge: "Risk badge",
    strategyFit: "Strategy fit",
    intentAction: "Intent action",
    stopStatus: "Stop status",
    suggestedAction: "Suggested action:",
    addExposureAllowed: "Add exposure allowed",
    reduceOrExitRecommended: "Reduce/exit recommended",
    yes: "Yes",
    no: "No",
    fit: "Fit",
    selectedBy: "Selected by",
    auto: "Auto",
    user: "User",
    estimatedRisk: "Estimated risk",
    dataSource: "Data source",
    positionSizeMode: "Position size mode",
    whyThisStrategy: "Why this strategy?",
    entryCondition: "Entry condition:",
    decisionCondition: "Decision condition:",
    nextConfirmation: "Next confirmation:",
    beginnerNote: "Beginner note:",
    noTradeReason: "No-trade reason",
    warnings: "Warnings",
    simpleBacktest: "Simple Backtest",
    backtestSource: "Backtest source",
    candlesUsed: "Candles used",
    entryTriggered: "Entry triggered",
    stopHit: "Stop hit",
    trailingExitHit: "Trailing exit hit",
    backtestResult: "Result",
    returnPercentage: "Return %",
    estimatedPnl: "Estimated P/L",
    maxDrawdown: "Max drawdown",
    pairUsed: "Pair used",
    dynamicExit: "Dynamic exit",
    dynamicExitHit: "Dynamic exit hit",
    limitations: "Limitations",
    stopLoss: "Stop loss",
    takeProfit: "Take profit",
    trailingExit: "Trailing exit",
    trailingExitHelper: "ATR/MA trailing module",
    chartDataNotes: {
      live: "Chart path is estimated until historical OHLCV is available.",
      mock: "Demo fallback data is being used because the live CoinMarketCap quote is unavailable.",
      history: "Latest quote and historical candles come from CoinMarketCap.",
      estimatedHistory:
        "Latest quote is live from CoinMarketCap. Chart path and indicators are estimated until historical OHLCV is available on the current plan.",
    },
    backtestReadyJson: "Backtest-ready JSON",
    exportJson: "Export JSON",
    paperBacktestTitle: "Paper Backtest from JSON",
    paperBacktestIntro:
      "Paste a PositionSight JSON export and test it against public historical candles. This is not live trading and does not connect to your exchange account.",
    pastedJsonLabel: "PositionSight JSON export",
    runPaperBacktest: "Run paper backtest",
    runningPaperBacktest: "Running paper backtest...",
    useLatestExportedJson: "Use latest exported JSON",
    invalidPositionSightJson: "This does not look like a valid PositionSight strategy JSON.",
    paperBacktestUnavailable: "Paper backtest is unavailable. Try again or use another JSON export.",
    paperBacktestChart: "Paper backtest chart",
    paperBacktestView: "View",
    paperBacktestLineView: "Line",
    paperBacktestCandlesView: "Candles",
    noPaperResultsYet: "Paste a valid PositionSight export to run a paper simulation.",
    paperBacktestSafetyNote:
      "This is a paper simulation only. It does not place orders, sign transactions, connect wallets, or access your Binance account.",
    paperBacktestMessageLabels: {
      noPositionOpened: "Capital protected / no position opened.",
      entryNotTriggered: "Entry not triggered / no position opened.",
      stopHit: "Stop loss touched in the paper simulation.",
      dynamicExitHit: "Dynamic exit touched in the paper simulation.",
      markedToFinalClose: "Position marked to final candle close in the paper simulation.",
    },
    paperBacktestSourceNoteLabels: {
      binance_public_klines: "Used Binance public market-data klines only.",
      demo_fallback: "Used the documented demo fallback because Binance public klines were unavailable.",
    },
    paperBacktestSourceLabels: {
      binance_public_klines: "Binance public klines",
      demo_fallback: "Demo fallback",
    },
    paperBacktestResultLabels: {
      win: "Win",
      loss: "Loss",
      flat: "Flat",
      not_triggered: "Not triggered",
      no_trade: "No trade",
    },
    strategyExplanation: "Strategy explanation",
    generateExplanation: "Generate explanation",
    generatingExplanation: "Generating explanation...",
    providerConfigured: "Provider configured",
    localDeterministicExplanation: "Local deterministic explanation",
    explanationUnavailable: "Explanation is unavailable.",
    aiExplanationNote:
      "This layer explains the deterministic engine output only. It does not create entries, exits, risk levels, or trade decisions.",
    whatTheSystemSaw: "What the system saw",
    whyThisDecision: "Why this decision",
    riskExplanation: "Risk explanation",
    whatToWatchNext: "What to watch next",
    tokenScanner: "Token Scanner",
    scannerSubtitle:
      "Scan eligible tokens for possible movement to review. Results are deterministic and are not buy/sell signals.",
    scannerScope: "Scan scope",
    scannerScopeCurrent: "Current selected token",
    scannerScopeSpecific: "Specific token",
    scannerScopeGroup: "Token group",
    scannerCurrentToken: "Current selected token",
    scannerSpecificToken: "Specific token",
    scannerUniverse: "Token universe",
    beginnerTokens: "Beginner tokens",
    advancedTokens: "Advanced tokens",
    allEligibleTokens: "All eligible tokens",
    maxTokensToScan: "Max tokens to scan",
    scanTokens: "Scan tokens",
    scanningTokens: "Scanning tokens...",
    possibleMovementToReview: "Possible movement to review",
    maAlignment: "MA alignment",
    loadInMainAnalysis: "Load in main analysis",
    scannerNoResults: "No scanner results were available for this token universe.",
    scannerFailed: "Token scan failed. Try a smaller scan size or check data availability.",
    quoteSource: "Quote source",
    historySourceShort: "History",
    scannerDataSource: "Data source",
    estimatedDemoFallback: "Estimated/demo fallback",
    unavailableHistory: "History unavailable",
    maAlignmentLabels: {
      bullish: "Bullish",
      mixed: "Mixed",
      bearish: "Bearish",
      unavailable: "Unavailable",
    },
    demoRange: "Demo range",
    demoRangeSeparator: "to",
    perStrategy: "per strategy.",
    strategyDetails: "Strategy details",
    strategyPrinciples:
      "These modes follow patient, risk-first principles: avoid overtrading, wait for confirmation, define invalidation, and avoid unclear setups.",
    whatIsThis: "What is this?",
    hideExplanation: "Hide explanation",
    simpleExplanation: "Simple explanation",
    bestUsedWhen: "Best used when",
    avoidWhen: "Avoid when",
    systemChecks: "What the system checks",
    entryPriceGreaterThanZero: "Entry price must be greater than 0.",
    positionSizeGreaterThanZero: "Position size must be greater than 0.",
    maxRiskRange: "Max risk must stay between",
    and: "and",
    entryDistanceWarning: "Entry price is very far from current price. This may be an old position or a typo.",
    useValidDecimals: "Use dot or comma for decimals, but values must be valid numbers.",
    totalCapitalGreaterThanZero: "Total capital must be greater than 0.",
    calculatedPositionSizeUnavailable: "Calculated position size is unavailable. Check capital, risk, entry, and stop distance.",
    intradayTradingWarning:
      "Intraday trading is more speculative and often dominated by noise. PositionSight recommends validating this setup on the daily timeframe before acting.",
    riskAboveOneWarning:
      "Risk above 1% is aggressive; consider reducing risk before entering.",
    atrFallbackWarning: "ATR is unavailable, so PositionSight is using the percent-based stop fallback.",
    positionSizeEstimatedWarning: "Position size uses estimated ATR until historical OHLCV is available.",
    positionSizeFallbackWarning: "Stop distance was invalid, so PositionSight used the percent-based fallback.",
    stopLossClampedWarning: "ATR-based stop would be at or below zero, so stop loss was clamped to a safe positive level.",
    positionSizeInvalidWarning: "Calculated position size is unavailable. Check capital, risk, entry, and stop distance.",
    stopBreachWarning:
      "Current price is below the stop. Review exit/risk immediately; this is not a fresh entry setup.",
    intentEntryPriceLabels: {
      analyze_entry: "Planned entry price",
      manage_open_position: "Average entry price",
      exit_review: "Original entry price",
    },
    intentEntryPriceTooltips: {
      analyze_entry: "The price where you are considering a planned long entry.",
      manage_open_position: "Your average entry price for the existing long position.",
      exit_review: "The original or average entry price for the long position you are reviewing.",
    },
    intentActionLabels: {
      evaluate_entry: "Evaluate entry",
      wait_for_confirmation: "Wait for confirmation",
      hold_with_trailing_exit: "Hold with trailing exit",
      reduce_risk: "Reduce risk",
      exit_or_reduce: "Exit or reduce",
      stop_breached: "Stop breached",
      no_trade: "No-trade",
    },
    intentSuggestedActionLabels: {
      evaluate_entry: "Entry allowed only if confirmation remains valid.",
      wait_for_confirmation: "Wait for confirmation before adding exposure.",
      hold_with_trailing_exit: "Hold with trailing exit while trend and support remain valid.",
      reduce_risk: "Reduce risk or hold only if support and trailing-exit rules remain valid.",
      exit_or_reduce: "Review exit or reduction for the existing long position.",
      stop_breached: "Stop breached. Review exit or risk reduction immediately.",
      no_trade: "No new exposure. Protect capital until the setup improves.",
    },
    stopStatusLabels: {
      above_stop: "Above stop",
      near_stop: "Near stop",
      stop_breached: "Stop breached",
    },
    fitLabels: {
      good: "Good",
      caution: "Warning",
      poor: "Poor",
    },
    riskBadgeLabels: {
      low: "Low",
      medium: "Medium",
      high: "High",
      no_trade: "No Trade",
    },
    backtestSourceLabels: {
      historical_cmc: "Historical CMC",
      demo_dataset: "Demo dataset",
      estimated_from_live_quote: "Estimated from live quote",
    },
    winLossLabels: {
      win: "Win",
      loss: "Loss",
      flat: "Flat",
      not_triggered: "Not triggered",
    },
    sizingModeLabels: {
      calculated_new_entry: "Calculated new entry",
      existing_position: "Existing position",
    },
    intentPanelExplanations: {
      analyze_entry: "This checks whether a new entry is worth planning.",
      manage_open_position: "This checks whether an open position should be held, reduced, or protected.",
      exit_review: "This checks whether the position should be reduced, exited, or monitored.",
    },
    riskVerdictLabels: {
      good: "Good fit",
      needs_confirmation: "Needs confirmation",
      poor_fit: "Poor fit",
      no_trade_recommended: "No-trade recommended",
    },
    positionIntentLabels: {
      analyze_entry: "Analyze entry",
      manage_open_position: "Manage open position",
      exit_review: "Exit / Sell review",
    },
    chartLabels: {
      stop: "Stop",
      invalidation: "Invalidation",
      entry: "Entry",
      current: "Current",
      takeProfit: "Trailing Exit",
      support: "Support",
      resistance: "Resistance",
      estimatedSupport: "Estimated Support",
      estimatedResistance: "Estimated Resistance",
      supportResistanceOutOfRange: "Support/resistance are outside the visible chart range.",
      price: "Price",
      asset: "Asset",
      timeframe: "Timeframe",
      point: "Point",
      time: "Time",
      close: "Close",
      distanceFromEntry: "Distance from entry",
      source: "Source",
      estimatedProjection: "Estimated projection",
      estimatedPath: "Estimated strategy path",
      meaning: "Meaning",
      meanings: {
        entry: "user entry or planned entry",
        current: "latest CoinMarketCap live quote",
        stop: "risk control level",
        takeProfit: "ATR/MA trailing module",
        estimatedPath: "estimated visual path until historical OHLCV is available",
      },
      intentMeanings: {
        analyze_entry: {
          entry: "planned long entry price",
          current: "latest CoinMarketCap live quote",
          stop: "risk stop for the planned entry",
          takeProfit: "initial trailing-exit reference if the entry confirms",
          estimatedPath: "estimated setup path until historical OHLCV is available",
        },
        manage_open_position: {
          entry: "average entry for the existing long position",
          current: "latest CoinMarketCap live quote for the open position",
          stop: "risk stop for the existing long position",
          takeProfit: "trailing-exit reference for managing the position",
          estimatedPath: "estimated management path from entry to current risk decision",
        },
        exit_review: {
          entry: "original or average entry for the long position under review",
          current: "latest CoinMarketCap live quote for the sell review",
          stop: "exit or reduction trigger for the existing long position",
          takeProfit: "dynamic exit reference for protecting gains",
          estimatedPath: "estimated exit-review path for a long position",
        },
      },
      sourceLabels: {
        userInput: "User input",
        coinMarketCapLiveQuote: "CoinMarketCap live quote",
        strategyEngine: "Strategy engine",
        estimatedStrategyPath: "Estimated strategy path",
      },
      pointType: "Point type",
      pointTypes: {
        historical_ohlcv: "historical candle",
        historical_estimate: "estimated candle",
        live_quote: "Current live quote",
        strategy_projection: "Strategy projection",
      },
      sources: {
        coinmarketcap: "CoinMarketCap historical OHLCV",
        estimated: "Estimated strategy path",
      },
      timeLabels: {
        "15m": ["-45m", "-30m", "Now", "+15m", "+30m"],
        "30m": ["-90m", "-60m", "Now", "+30m", "+1h"],
        "1h": ["-3h", "-2h", "Now", "+1h", "+2h"],
        "1d": ["-3d", "-1d", "Today", "+1d", "+2d"],
        "1w": ["4w ago", "2w ago", "Today", "+1w", "+2w"],
        "1mo": ["3mo ago", "1mo ago", "Today", "+1mo", "+2mo"],
      },
    },
    trendStateLabels: {
      bullish: "Bullish",
      neutral: "Neutral",
      bearish: "Bearish",
    },
    trendIconLabels: {
      bullish: "Bullish trend",
      neutral: "Neutral trend",
      bearish: "Bearish trend",
    },
    sentimentLabels: {
      bullish: "Bullish",
      neutral: "Neutral",
      bearish: "Bearish",
    },
    derivativesLabels: {
      long: "Long",
      neutral: "Neutral",
      short: "Short",
      unavailable: "Unavailable",
    },
    tokenCategoryLabels: {
      "Main Assets": "Main Assets",
      "Stablecoins / Collateral": "Stablecoins / Collateral",
      "DeFi / Infrastructure / AI": "DeFi / Infrastructure / AI",
      "Memecoins / Web3 Culture": "Memecoins / Web3 Culture",
    },
    messageTranslations: {
      "Mock market context is unavailable.": "Demo market context is unavailable.",
      "Historical OHLCV is unavailable with the current CoinMarketCap response or plan; chart path is estimated from live quote context.":
        "Historical OHLCV is unavailable with the current CoinMarketCap response or plan; chart path is estimated from live quote context.",
      "Historical OHLCV is unavailable with the current CoinMarketCap plan; chart path and indicators are estimated.":
        "Historical OHLCV is unavailable with the current CoinMarketCap plan; chart path and indicators are estimated.",
      "Latest quote is live from CoinMarketCap. Chart path and indicators are estimated until historical OHLCV is available on the current plan.":
        "The latest quote is live from CoinMarketCap. The chart path and some indicators are estimated until historical OHLCV is available.",
      "CoinMarketCap latest quote is live; technicals, sentiment, order book, and derivatives are proxy fields until future integrations.":
        "The latest quote is live from CoinMarketCap. The chart path and some indicators are estimated until historical OHLCV is available.",
      "CoinMarketCap latest quote is live; technicals, sentiment, order book, and derivatives are mock/proxy fields.":
        "The latest quote is live from CoinMarketCap. The chart path and some indicators are estimated until historical OHLCV is available.",
      "CoinMarketCap latest quote is live. Some advanced context fields are estimated until historical OHLCV is added.":
        "Latest quote is live from CoinMarketCap. Candles and indicators are estimated until historical OHLCV is available on the current plan.",
      "Using mock data fallback because CoinMarketCap live quote is unavailable.":
        "Demo fallback data is being used because the live CoinMarketCap quote is unavailable.",
      "Configured risk is too high for a capital-preservation strategy.":
        "Configured risk is too high for a capital-preservation strategy.",
      "Current price is too far from entry to create a realistic risk-managed setup.":
        "Current price is too far from entry to create a realistic risk-managed setup.",
      "Liquidity proxy is too weak for a beginner-friendly setup.":
        "The liquidity estimate is too weak for a beginner-friendly setup.",
      "Trend, sentiment, and liquidity are aligned against the trade.":
        "Trend, sentiment, and liquidity are aligned against the trade.",
      "Meme-asset context is high risk and does not have enough liquidity support.":
        "Meme-asset context is high risk and does not have enough liquidity support.",
      "Derivatives proxy is unavailable or conflicting while risk is elevated.":
        "Derivatives context is unavailable or conflicting while risk is elevated.",
      "Intraday context needs stronger liquidity, momentum, and risk control before a setup is usable.":
        "Intraday context needs stronger liquidity, momentum, and risk control before a setup is usable.",
      "Risk is not controlled enough for a defensive setup while market pressure is elevated.":
        "Risk is not controlled enough for a defensive setup while market pressure is elevated.",
      "Market structure is unclear, so waiting for a stronger selected-timeframe close is preferred.":
        "Market structure is unclear, so waiting for a stronger selected-timeframe close is preferred.",
      "Entry price is too far from current price for a clean risk setup.":
        "Entry price is too far from current price for a clean risk setup.",
      "Intraday timeframes are more speculative and need stronger confirmation.":
        "Intraday timeframes are more speculative and need stronger confirmation.",
      "Liquidity proxy is weak, so forced strategy signals are unreliable.":
        "The liquidity estimate is weak, so forced strategy signals are unreliable.",
      "Meme assets can move quickly; keep position risk small and wait for stronger confirmation.":
        "Meme assets can move quickly; keep position risk small and wait for stronger confirmation.",
      "Breakout + Retest needs stronger momentum, volume, and a clear retest or breakout area.":
        "Breakout + Retest needs stronger momentum, volume, and a clear retest or breakout area.",
      "Trend Confirmation needs price above support and RSI that is not extremely overheated.":
        "Trend Confirmation needs price above support and RSI that is not extremely overheated.",
      "Defensive Rebound only fits when risk is controlled and price is near support.":
        "Defensive Rebound only fits when risk is controlled and price is near support.",
      "Auto mode sees a possible setup, but Risk Check is still valid for conservative traders.":
        "Auto mode sees a possible setup, but Risk Check is still valid for conservative traders.",
      "Risk or market structure is unclear for this selected strategy.":
        "Risk or market structure is unclear for this selected strategy.",
      "Not enough historical candles to calculate ema20.":
        "Not enough history to calculate MA 20.",
      "Not enough historical candles to calculate ema50.":
        "Not enough history to calculate MA 50.",
      "Not enough historical candles to calculate ema200.":
        "Not enough history to calculate MA 200.",
      "Not enough historical candles to calculate rsi14.":
        "Not enough history to calculate RSI 14.",
      "Not enough historical candles to calculate atr14.":
        "Not enough history to calculate ATR 14.",
      "Not enough historical candles to calculate averageVolume.":
        "Not enough history to calculate average volume.",
      "Not enough historical candles to calculate support.":
        "Not enough history to calculate support.",
      "Not enough historical candles to calculate resistance.":
        "Not enough history to calculate resistance.",
      "ATR is unavailable or estimated, so percent-based stop fallback is used.":
        "ATR is unavailable or estimated, so percent-based stop fallback is used.",
      "ATR-based stop would be at or below zero, so stop loss was clamped to a safe positive level.":
        "ATR-based stop would be at or below zero, so stop loss was clamped to a safe positive level.",
      "Current price is below the stop. Review exit/risk immediately; this is not a fresh entry setup.":
        "Current price is below the stop. Review exit/risk immediately; this is not a fresh entry setup.",
      "Validate a planned long entry against risk, stop distance, trend, liquidity, and confirmation.":
        "Validate a planned long entry against risk, stop distance, trend, liquidity, and confirmation.",
      "Manage the existing long position; do not add exposure while price is below the stop.":
        "Manage the existing long position; do not add exposure while price is below the stop.",
      "Manage an existing long position with hold, reduce, wait, or trailing-exit conditions.":
        "Manage an existing long position with hold, reduce, wait, or trailing-exit conditions.",
      "Review whether the existing long position should be reduced or exited.":
        "Review whether the existing long position should be reduced or exited.",
      "Wait for the selected timeframe to confirm the setup before adding exposure.":
        "Wait for the selected timeframe to confirm the setup before adding exposure.",
      "Confirm whether the stop breach persists on the selected timeframe before deciding reduce or exit.":
        "Confirm whether the stop breach persists on the selected timeframe before deciding reduce or exit.",
      "Review support, stop distance, and trailing-exit behavior before increasing or reducing exposure.":
        "Review support, stop distance, and trailing-exit behavior before increasing or reducing exposure.",
      "Check stop, support, trailing-exit protection, and market context before deciding to reduce or exit.":
        "Check stop, support, trailing-exit protection, and market context before deciding to reduce or exit.",
      "Analyze entry mode sizes a possible new long position from capital, defined risk, and stop distance.":
        "Analyze entry mode sizes a possible new long position from capital, defined risk, and stop distance.",
      "Open-position management uses your existing holdings. It does not calculate a fresh buy or add exposure automatically.":
        "Open-position management uses your existing holdings. It does not calculate a fresh buy or add exposure automatically.",
      "Exit review is a long-position risk review. It helps decide hold, reduce, or exit; it is not short selling.":
        "Exit review is a long-position risk review. It helps decide hold, reduce, or exit; it is not short selling.",
      "A breached stop means the position is no longer healthy under this risk model. This is not a fresh entry setup.":
        "A breached stop means the position is no longer healthy under this risk model. This is not a fresh entry setup.",
      "Sell review means protecting an existing long position. It does not open a short position or execute a sale.":
        "Sell review means protecting an existing long position. It does not open a short position or execute a sale.",
      "Simple deterministic backtest v1; not a professional trading simulator.":
        "Simple deterministic backtest v1; not a professional trading simulator.",
      "No live execution, no wallet connection, and no exchange order placement.":
        "No live execution, no wallet connection, and no exchange order placement.",
      "Uses CoinMarketCap historical OHLCV candles when available; execution order inside each candle is simplified.":
        "Uses CoinMarketCap historical OHLCV candles when available; execution order inside each candle is simplified.",
      "Historical OHLCV is unavailable on the current response or plan; candles are estimated from live quote context.":
        "Historical OHLCV is unavailable on the current response or plan; candles are estimated from live quote context.",
      "No history response was available in the UI; a small demo dataset was generated for illustration only.":
        "No history response was available in the UI; a small demo dataset was generated for illustration only.",
    },
    decisionCopy: {
      autoWhy: "Auto Recommended selected the strongest fit for the current context:",
      manualGood: "The selected strategy matches the current market context.",
      manualCaution: "The selected strategy is being evaluated, but it needs more confirmation before it is clean.",
      manualNoTrade:
        "The selected strategy is being evaluated, but the risk engine currently recommends no-trade conditions.",
    },
    intentDecisionCopy: {
      analyze_entry: {
        prefix: "Entry analysis:",
        nextConfirmation: "",
        beginnerExplanation: "",
      },
      manage_open_position: {
        prefix: "Open-position management:",
        nextConfirmation: "Watch whether holding remains valid, whether reducing risk is cleaner, or whether the trailing exit should guide the next decision.",
        beginnerExplanation: "This view is for managing an existing position. It does not place orders or tell you to add exposure automatically.",
      },
      exit_review: {
        prefix: "Exit review:",
        nextConfirmation: "Check stop, trailing exit, support loss, risk, and market context before deciding whether reducing or exiting is cleaner.",
        beginnerExplanation: "Exit review focuses on reducing risk or leaving a position when the setup weakens. It does not execute a sale.",
      },
    },
    nextConfirmationMessages: {
      trend_following_pullback: "Wait for the selected timeframe to close above support or the trend filter.",
      breakout_with_volume: "Wait for price to hold above the breakout area after a retest.",
      defensive_mean_reversion: "Wait for stabilization near support and avoid averaging down without confirmation.",
      no_trade: "Wait for risk, liquidity, and market structure to improve before taking a new setup.",
    },
    beginnerVerdictMessages: {
      good: "This setup is the cleanest current fit, but risk limits still matter.",
      needs_confirmation: "This setup is not rejected, but a beginner should wait for stronger confirmation.",
      poor_fit: "This setup does not fit cleanly. Treat it as research, not an action signal.",
      no_trade_recommended: "No-trade means protecting capital when the setup is not clear enough.",
    },
    tooltips: {
      tokenList: "Beginner mode shows a shorter list; Advanced mode shows more hackathon-supported tokens.",
      eligibleToken:
        "Choose the eligible crypto asset you want to analyze.",
      positionIntent:
        "Choose whether you want to analyze a possible entry, manage an existing position, or review exit and reduction conditions.",
      entryPrice: "The price where you bought, or the price where you are considering entering.",
      positionSize: "Calculated token quantity for this risk setup.",
      totalCapital: "Your capital base for calculating risk-based position size.",
      calculatedPositionSize: "Readonly size calculated from capital, risk, entry price, ATR, and stop distance.",
      currentPositionSize: "How many tokens or coins are currently held in the existing long position.",
      strategyTimeframe:
        "Choose the timeframe used to evaluate the setup. Shorter timeframes are more speculative and require stronger confirmation; higher timeframes are better for patient position decisions.",
      strategyMode:
        "Auto lets PositionSight choose the most appropriate strategy. Manual mode lets you test a specific strategy and see whether it fits.",
      maxRiskPercentage: "The maximum percentage of the entry price you are willing to risk if the setup fails.",
    },
    strategyModeLabels: {
      auto: "Auto Recommended",
      trend_confirmation: "Trend Confirmation",
      breakout_retest: "Breakout + Retest",
      defensive_rebound: "Defensive Rebound",
      risk_check: "Risk Check / No-Trade",
    },
    strategyTypeLabels: {
      trend_following_pullback: "Trend Confirmation",
      breakout_with_volume: "Breakout + Retest",
      defensive_mean_reversion: "Defensive Rebound",
      no_trade: "Risk Check / No-Trade",
    },
    timeframeLabels: {
      "15m": "15m",
      "30m": "30m",
      "1h": "1h",
      "1d": "1d",
      "1w": "1w",
      "1mo": "1mo",
    },
    strategyExplanations: {
      auto: {
        simple:
          "Lets PositionSight choose the best-fitting strategy based on market context, position risk, trend, liquidity, and momentum.",
        bestUsedWhen: "Best for beginners or when you want a risk-first recommendation.",
        avoidWhen: "Avoid when you specifically want to manually test one strategy idea.",
        checks: "Checks all available strategies and can choose no-trade when risk is poor.",
        beginnerNote: "Start here if you are unsure which setup fits the current market context.",
      },
      trend_confirmation: {
        simple: "Looks for a setup where the market is showing enough strength to continue after confirmation.",
        bestUsedWhen: "Best when price is above support, trend is healthy, and risk is controlled.",
        avoidWhen: "Avoid when price is too extended or sentiment/liquidity are weak.",
        checks: "Checks trend, support, MA estimate, RSI estimate, and risk.",
        beginnerNote: "This mode waits for evidence instead of guessing the bottom.",
      },
      breakout_retest: {
        simple: "Looks for strong movement confirmed by volume, then waits for the breakout area to hold.",
        bestUsedWhen: "Best when price is breaking resistance with volume and liquidity.",
        avoidWhen: "Avoid when the move is too extended or the breakout is not confirmed.",
        checks: "Checks percent change, volume, liquidity, resistance, and sentiment.",
        beginnerNote: "A breakout is stronger when the market proves the old resistance can hold as support.",
      },
      defensive_rebound: {
        simple: "Used when a position is under pressure but may stabilize near support.",
        bestUsedWhen: "Best when risk is controlled and price is close to support.",
        avoidWhen: "Avoid when trend is bearish, liquidity is weak, or you are averaging down blindly.",
        checks: "Checks support, RSI estimate, risk, liquidity, and invalidation.",
        beginnerNote: "This is defensive. It is not permission to keep adding to a losing position.",
      },
      risk_check: {
        simple: "Protects you from unclear or risky setups.",
        bestUsedWhen: "Best when entry is too far, risk is high, liquidity is weak, or signals conflict.",
        avoidWhen: "Avoid only when you have a clear, risk-controlled setup to test.",
        checks: "Checks entry distance, risk, trend, liquidity, sentiment, and conflicting signals.",
        beginnerNote: "Sometimes the best trade is no trade.",
      },
    },
  },
  es: {
    subtitle:
      "Inteligencia de posiciones cripto para principiantes con cotizaciones CMC en vivo, contexto estimado, niveles de riesgo visuales y exportaciones listas para pruebas.",
    badge: "Skill de estrategia con CoinMarketCap",
    language: "Idioma",
    strategyBuilderTab: "Constructor de estrategia",
    paperBacktestTab: "Backtest paper",
    positionInput: "Datos de posición",
    tokenList: "Lista de tokens",
    beginner: "Principiante",
    advanced: "Avanzado",
    eligibleToken: "Token elegible",
    symbol: "Símbolo",
    positionIntent: "Intención de posición",
    entryPrice: "Precio de entrada",
    positionSize: "Tamaño de posición",
    totalCapital: "Capital total",
    currentPositionSize: "Tamaño actual de la posición",
    currentPositionSizeHelper: "Tenencias existentes usadas para medir el riesgo de la posición abierta contra el stop.",
    existingPositionRisk: "Riesgo estimado de la posición existente",
    calculatedPositionSize: "Tamaño de posición calculado",
    calculatedPositionSizeHelper: "Calculado con capital, riesgo, precio de entrada, ATR y distancia al stop.",
    strategyTimeframe: "Temporalidad de estrategia",
    strategyMode: "Modo de estrategia",
    maxRiskPercentage: "Porcentaje máximo de riesgo",
    localDate: "Fecha local",
    currentPrice: "Precio actual",
    move24h: "Movimiento 24h",
    volume24h: "Volumen 24h",
    marketCap: "Capitalización",
    source: "Fuente",
    pnl: "P/G",
    unavailable: "No disponible",
    cmcLiveQuote: "Cotización CMC en vivo",
    coinMarketCapLiveQuote: "Cotización CoinMarketCap en vivo",
    mockDataFallback: "Respaldo con datos demo",
    checkInputs: "Revisa los datos",
    positionWarning: "Advertencia de posición",
    tokenCategory: "Categoría",
    tokenCategoryNote:
      "El MVP usa cotizaciones en vivo cuando están disponibles y contexto estimado para estabilidad de demo.",
    entryVsCurrentPrice: "Entrada vs precio actual",
    loadingMarketContext: "Cargando contexto de mercado...",
    marketContextReady: "Contexto de mercado listo",
    marketContextUnavailable: "El contexto de mercado no está disponible.",
    loadingMockMarketContext: "Cargando contexto de mercado.",
    positionValue: "Valor de posición",
    marketContext: "Contexto de mercado",
    estimatedContextFields: "Cotización CoinMarketCap en vivo; campos de contexto estimado",
    historySource: "Fuente histórica",
    coinMarketCapHistoricalOhlcv: "Velas históricas de CoinMarketCap",
    coinMarketCapHistoricalShort: "Histórico CoinMarketCap",
    estimatedHistory: "Velas estimadas desde la cotización en vivo",
    estimatedCandlesShort: "Velas estimadas",
    latestAndHistoryFromCmc: "La cotización más reciente y las velas históricas vienen desde CoinMarketCap.",
    latestLiveHistoryEstimated:
      "La cotización más reciente viene en vivo desde CoinMarketCap. El recorrido del gráfico y algunos indicadores se estiman hasta que el plan permita OHLCV histórico.",
    notEnoughHistory: "Historial insuficiente",
    averageVolume: "Volumen promedio",
    avgVolume: "Vol. promedio",
    support: "Soporte",
    resistance: "Resistencia",
    trend: "Tendencia",
    sentiment: "Sentimiento",
    liquidity: "Liquidez",
    derivatives: "Derivados",
    dataNote: "Nota de datos",
    strategySignal: "Señal de estrategia",
    strategyType: "Tipo de estrategia",
    strategyEvaluated: "Estrategia evaluada",
    selectedStrategy: "Estrategia seleccionada",
    riskVerdict: "Veredicto de riesgo",
    riskBadge: "Nivel de riesgo",
    strategyFit: "Ajuste de estrategia",
    intentAction: "Acción de intención",
    stopStatus: "Estado del stop",
    suggestedAction: "Acción sugerida:",
    addExposureAllowed: "Agregar exposición permitido",
    reduceOrExitRecommended: "Reducir/salir recomendado",
    yes: "Sí",
    no: "No",
    fit: "Ajuste",
    selectedBy: "Seleccionado por",
    auto: "Auto",
    user: "Usuario",
    estimatedRisk: "Riesgo estimado",
    dataSource: "Fuente de datos",
    positionSizeMode: "Modo de tamaño",
    whyThisStrategy: "¿Por qué esta estrategia?",
    entryCondition: "Condición de entrada:",
    decisionCondition: "Condición de decisión:",
    nextConfirmation: "Próxima confirmación:",
    beginnerNote: "Nota para principiantes:",
    noTradeReason: "Razón para no operar",
    warnings: "Advertencias",
    simpleBacktest: "Prueba simple",
    backtestSource: "Fuente de la prueba",
    candlesUsed: "Velas usadas",
    entryTriggered: "Entrada activada",
    stopHit: "Stop tocado",
    trailingExitHit: "Salida dinámica tocada",
    backtestResult: "Resultado",
    returnPercentage: "Retorno %",
    estimatedPnl: "P/G estimada",
    maxDrawdown: "Caída máxima",
    pairUsed: "Par usado",
    dynamicExit: "Salida dinámica",
    dynamicExitHit: "Salida dinámica tocada",
    limitations: "Limitaciones",
    stopLoss: "Stop de pérdida",
    takeProfit: "Toma de ganancia",
    trailingExit: "Salida dinámica",
    trailingExitHelper: "Módulo de salida dinámica ATR/MA",
    chartDataNotes: {
      live: "El recorrido del gráfico es estimado hasta que OHLCV histórico esté disponible.",
      mock: "Se están usando datos demo porque la cotización en vivo de CoinMarketCap no está disponible.",
      history: "La cotización más reciente y las velas históricas vienen desde CoinMarketCap.",
      estimatedHistory:
        "La cotización más reciente viene en vivo desde CoinMarketCap. El recorrido del gráfico y los indicadores son estimados hasta que el plan permita OHLCV histórico.",
    },
    backtestReadyJson: "JSON listo para pruebas",
    exportJson: "Exportar JSON",
    paperBacktestTitle: "Backtest paper desde JSON",
    paperBacktestIntro:
      "Pega un JSON exportado por PositionSight y pruébalo contra velas históricas públicas. Esto no es trading en vivo y no conecta tu cuenta de exchange.",
    pastedJsonLabel: "JSON exportado por PositionSight",
    runPaperBacktest: "Ejecutar backtest paper",
    runningPaperBacktest: "Ejecutando backtest paper...",
    useLatestExportedJson: "Usar último JSON exportado",
    invalidPositionSightJson: "Esto no parece un JSON de estrategia válido de PositionSight.",
    paperBacktestUnavailable: "El backtest paper no está disponible. Intenta de nuevo o usa otro JSON exportado.",
    paperBacktestChart: "Gráfico de backtest paper",
    paperBacktestView: "Vista",
    paperBacktestLineView: "Línea",
    paperBacktestCandlesView: "Velas",
    noPaperResultsYet: "Pega un export válido de PositionSight para ejecutar una simulación paper.",
    paperBacktestSafetyNote:
      "Esta es solo una simulación paper. No coloca órdenes, no firma transacciones, no conecta wallets y no accede a tu cuenta de Binance.",
    paperBacktestMessageLabels: {
      noPositionOpened: "Capital protegido / no se abrió posición.",
      entryNotTriggered: "Entrada no activada / no se abrió posición.",
      stopHit: "El stop de pérdida fue tocado en la simulación paper.",
      dynamicExitHit: "La salida dinámica fue tocada en la simulación paper.",
      markedToFinalClose: "La posición se valoró al cierre de la última vela en la simulación paper.",
    },
    paperBacktestSourceNoteLabels: {
      binance_public_klines: "Se usaron solo velas públicas de mercado de Binance.",
      demo_fallback: "Se usó el fallback demo documentado porque las velas públicas de Binance no estuvieron disponibles.",
    },
    paperBacktestSourceLabels: {
      binance_public_klines: "Velas públicas de Binance",
      demo_fallback: "Fallback demo",
    },
    paperBacktestResultLabels: {
      win: "Ganancia",
      loss: "Pérdida",
      flat: "Plano",
      not_triggered: "No activado",
      no_trade: "No operar",
    },
    strategyExplanation: "Explicación de estrategia",
    generateExplanation: "Generar explicación",
    generatingExplanation: "Generando explicación...",
    providerConfigured: "Proveedor configurado",
    localDeterministicExplanation: "Explicación determinista local",
    explanationUnavailable: "La explicación no está disponible.",
    aiExplanationNote:
      "Esta capa solo explica la salida del motor determinista. No crea entradas, salidas, niveles de riesgo ni decisiones de operación.",
    whatTheSystemSaw: "Qué vio el sistema",
    whyThisDecision: "Por qué esta decisión",
    riskExplanation: "Explicación del riesgo",
    whatToWatchNext: "Qué vigilar después",
    tokenScanner: "Buscador de oportunidades",
    scannerSubtitle:
      "Escanea tokens elegibles para encontrar posibles movimientos a revisar. Los resultados son deterministas y no son señales de compra/venta.",
    scannerScope: "Alcance del escaneo",
    scannerScopeCurrent: "Token actual seleccionado",
    scannerScopeSpecific: "Token específico",
    scannerScopeGroup: "Grupo de tokens",
    scannerCurrentToken: "Token actual seleccionado",
    scannerSpecificToken: "Token específico",
    scannerUniverse: "Universo de tokens",
    beginnerTokens: "Tokens principiantes",
    advancedTokens: "Tokens avanzados",
    allEligibleTokens: "Todos los tokens elegibles",
    maxTokensToScan: "Máximo de tokens",
    scanTokens: "Escanear tokens",
    scanningTokens: "Escaneando tokens...",
    possibleMovementToReview: "Posible movimiento a revisar",
    maAlignment: "Alineación de medias",
    loadInMainAnalysis: "Cargar en análisis principal",
    scannerNoResults: "No hubo resultados disponibles para este universo de tokens.",
    scannerFailed: "El escaneo falló. Intenta con menos tokens o revisa la disponibilidad de datos.",
    quoteSource: "Fuente de cotización",
    historySourceShort: "Histórico",
    scannerDataSource: "Fuente de datos",
    estimatedDemoFallback: "Respaldo estimado/demo",
    unavailableHistory: "Histórico no disponible",
    maAlignmentLabels: {
      bullish: "Alcista",
      mixed: "Mixta",
      bearish: "Bajista",
      unavailable: "No disponible",
    },
    demoRange: "Rango demo",
    demoRangeSeparator: "y",
    perStrategy: "por estrategia.",
    strategyDetails: "Detalle de estrategia",
    strategyPrinciples:
      "Estos modos siguen principios pacientes y centrados en riesgo: evitar operar de más, esperar confirmación, definir invalidación y evitar configuraciones poco claras.",
    whatIsThis: "¿Qué es esto?",
    hideExplanation: "Ocultar explicación",
    simpleExplanation: "Explicación simple",
    bestUsedWhen: "Úsalo cuando",
    avoidWhen: "Evítalo cuando",
    systemChecks: "Qué revisa el sistema",
    entryPriceGreaterThanZero: "El precio de entrada debe ser mayor que 0.",
    positionSizeGreaterThanZero: "El tamaño de posición debe ser mayor que 0.",
    maxRiskRange: "El riesgo máximo debe estar entre",
    and: "y",
    entryDistanceWarning: "El precio de entrada está muy lejos del precio actual. Puede ser una posición antigua o un error.",
    useValidDecimals: "Usa punto o coma para decimales, pero los valores deben ser números válidos.",
    totalCapitalGreaterThanZero: "El capital total debe ser mayor que 0.",
    calculatedPositionSizeUnavailable: "El tamaño de posición calculado no está disponible. Revisa capital, riesgo, entrada y distancia al stop.",
    intradayTradingWarning:
      "Las temporalidades intradía son más especulativas y suelen estar dominadas por ruido técnico. PositionSight recomienda validar esta configuración en temporalidad diaria antes de actuar.",
    riskAboveOneWarning:
      "Un riesgo superior al 1% es agresivo, considera reducir el riesgo antes de entrar",
    atrFallbackWarning: "ATR no está disponible, así que PositionSight usa el respaldo de stop por porcentaje.",
    positionSizeEstimatedWarning: "El tamaño de posición usa ATR estimado hasta que OHLCV histórico esté disponible.",
    positionSizeFallbackWarning: "La distancia al stop no era válida, así que PositionSight usó el respaldo por porcentaje.",
    stopLossClampedWarning: "El stop basado en ATR quedaría en cero o menos, así que se ajustó a un nivel positivo seguro.",
    positionSizeInvalidWarning: "El tamaño de posición calculado no está disponible. Revisa capital, riesgo, entrada y distancia al stop.",
    stopBreachWarning:
      "El precio actual está por debajo del stop. Revisa salida/riesgo inmediatamente; esto no es una entrada nueva.",
    intentEntryPriceLabels: {
      analyze_entry: "Precio de entrada planeado",
      manage_open_position: "Precio promedio de entrada",
      exit_review: "Precio original de entrada",
    },
    intentEntryPriceTooltips: {
      analyze_entry: "El precio donde estás considerando una entrada larga planeada.",
      manage_open_position: "Tu precio promedio de entrada para la posición larga existente.",
      exit_review: "El precio original o promedio de entrada para la posición larga que estás revisando.",
    },
    intentActionLabels: {
      evaluate_entry: "Evaluar entrada",
      wait_for_confirmation: "Esperar confirmación",
      hold_with_trailing_exit: "Mantener con salida dinámica",
      reduce_risk: "Reducir riesgo",
      exit_or_reduce: "Salir o reducir",
      stop_breached: "Stop perdido",
      no_trade: "No operar",
    },
    intentSuggestedActionLabels: {
      evaluate_entry: "Entrada permitida solo si la confirmación sigue siendo válida.",
      wait_for_confirmation: "Espera confirmación antes de agregar exposición.",
      hold_with_trailing_exit: "Mantener con salida dinámica mientras tendencia y soporte sigan válidos.",
      reduce_risk: "Reduce riesgo o mantén solo si soporte y salida dinámica siguen válidos.",
      exit_or_reduce: "Revisa salida o reducción de la posición larga existente.",
      stop_breached: "Stop perdido. Revisa salida o reducción de riesgo inmediatamente.",
      no_trade: "No agregues exposición. Protege capital hasta que la configuración mejore.",
    },
    stopStatusLabels: {
      above_stop: "Sobre el stop",
      near_stop: "Cerca del stop",
      stop_breached: "Stop perdido",
    },
    fitLabels: {
      good: "Bueno",
      caution: "Advertencia",
      poor: "Pobre",
    },
    riskBadgeLabels: {
      low: "Bajo",
      medium: "Medio",
      high: "Alto",
      no_trade: "No operar",
    },
    backtestSourceLabels: {
      historical_cmc: "Histórico CMC",
      demo_dataset: "Datos demo",
      estimated_from_live_quote: "Estimado desde cotización en vivo",
    },
    winLossLabels: {
      win: "Ganancia",
      loss: "Pérdida",
      flat: "Plano",
      not_triggered: "No activado",
    },
    sizingModeLabels: {
      calculated_new_entry: "Entrada nueva calculada",
      existing_position: "Posición existente",
    },
    intentPanelExplanations: {
      analyze_entry: "Esto revisa si vale la pena planear una entrada nueva.",
      manage_open_position: "Esto revisa si una posición abierta debe mantenerse, reducirse o protegerse.",
      exit_review: "Esto revisa si la posición debe reducirse, cerrarse o monitorearse.",
    },
    riskVerdictLabels: {
      good: "Buen ajuste",
      needs_confirmation: "Necesita confirmación",
      poor_fit: "Ajuste débil",
      no_trade_recommended: "No operar recomendado",
    },
    positionIntentLabels: {
      analyze_entry: "Analizar entrada",
      manage_open_position: "Gestionar posición abierta",
      exit_review: "Revisar salida / venta",
    },
    chartLabels: {
      stop: "Stop",
      invalidation: "Invalidación",
      entry: "Entrada",
      current: "Actual",
      takeProfit: "Salida dinámica",
      support: "Soporte",
      resistance: "Resistencia",
      estimatedSupport: "Soporte estimado",
      estimatedResistance: "Resistencia estimada",
      supportResistanceOutOfRange: "Soporte/resistencia están fuera del rango visible del gráfico.",
      price: "Precio",
      asset: "Activo",
      timeframe: "Temporalidad",
      point: "Punto",
      time: "Hora/fecha",
      close: "Cierre",
      distanceFromEntry: "Distancia desde entrada",
      source: "Fuente",
      estimatedProjection: "Proyección estimada",
      estimatedPath: "Ruta estimada de estrategia",
      meaning: "Significado",
      meanings: {
        entry: "entrada del usuario o entrada planeada",
        current: "cotización más reciente en vivo desde CoinMarketCap",
        stop: "nivel de control de riesgo",
        takeProfit: "módulo de salida dinámica ATR/MA",
        estimatedPath: "ruta visual estimada hasta integrar OHLCV histórico",
      },
      intentMeanings: {
        analyze_entry: {
          entry: "precio de entrada larga planeada",
          current: "cotización más reciente en vivo desde CoinMarketCap",
          stop: "stop de riesgo para la entrada planeada",
          takeProfit: "referencia inicial de salida dinámica si la entrada confirma",
          estimatedPath: "ruta estimada de la configuración hasta que OHLCV histórico esté disponible",
        },
        manage_open_position: {
          entry: "entrada promedio de la posición larga existente",
          current: "cotización CoinMarketCap en vivo para la posición abierta",
          stop: "stop de riesgo de la posición larga existente",
          takeProfit: "referencia de salida dinámica para gestionar la posición",
          estimatedPath: "ruta estimada de gestión desde entrada hasta decisión de riesgo actual",
        },
        exit_review: {
          entry: "entrada original o promedio de la posición larga en revisión",
          current: "cotización CoinMarketCap en vivo para revisar salida",
          stop: "disparador de salida o reducción de la posición larga existente",
          takeProfit: "referencia de salida dinámica para proteger ganancias",
          estimatedPath: "ruta estimada de revisión de salida para una posición larga",
        },
      },
      sourceLabels: {
        userInput: "Dato del usuario",
        coinMarketCapLiveQuote: "Cotización CoinMarketCap en vivo",
        strategyEngine: "Motor de estrategia",
        estimatedStrategyPath: "Ruta estimada de estrategia",
      },
      pointType: "Tipo de punto",
      pointTypes: {
        historical_ohlcv: "vela histórica",
        historical_estimate: "vela estimada",
        live_quote: "Cotización actual en vivo",
        strategy_projection: "Proyección de estrategia",
      },
      sources: {
        coinmarketcap: "OHLCV histórico CoinMarketCap",
        estimated: "ruta estimada de estrategia",
      },
      timeLabels: {
        "15m": ["-45m", "-30m", "Ahora", "+15m", "+30m"],
        "30m": ["-90m", "-60m", "Ahora", "+30m", "+1h"],
        "1h": ["-3h", "-2h", "Ahora", "+1h", "+2h"],
        "1d": ["-3d", "-1d", "Hoy", "+1d", "+2d"],
        "1w": ["hace 4sem", "hace 2sem", "Hoy", "+1sem", "+2sem"],
        "1mo": ["hace 3mes", "hace 1mes", "Hoy", "+1mes", "+2mes"],
      },
    },
    trendStateLabels: {
      bullish: "Alcista",
      neutral: "Neutral",
      bearish: "Bajista",
    },
    trendIconLabels: {
      bullish: "Tendencia alcista",
      neutral: "Tendencia neutral",
      bearish: "Tendencia bajista",
    },
    sentimentLabels: {
      bullish: "Alcista",
      neutral: "Neutral",
      bearish: "Bajista",
    },
    derivativesLabels: {
      long: "Largo",
      neutral: "Neutral",
      short: "Corto",
      unavailable: "No disponible",
    },
    tokenCategoryLabels: {
      "Main Assets": "Activos principales",
      "Stablecoins / Collateral": "Stablecoins / colateral",
      "DeFi / Infrastructure / AI": "DeFi / infraestructura / IA",
      "Memecoins / Web3 Culture": "Memecoins / cultura Web3",
    },
    messageTranslations: {
      "Mock market context is unavailable.": "El contexto de mercado demo no está disponible.",
      "Historical OHLCV is unavailable with the current CoinMarketCap response or plan; chart path is estimated from live quote context.":
        "El OHLCV histórico no está disponible con la respuesta o plan actual de CoinMarketCap; el recorrido del gráfico se estima desde la cotización en vivo.",
      "Historical OHLCV is unavailable with the current CoinMarketCap plan; chart path and indicators are estimated.":
        "El OHLCV histórico no está disponible con el plan actual de CoinMarketCap; el recorrido del gráfico y los indicadores son estimados.",
      "Latest quote is live from CoinMarketCap. Chart path and indicators are estimated until historical OHLCV is available on the current plan.":
        "La cotización más reciente viene en vivo desde CoinMarketCap. El recorrido del gráfico y algunos indicadores se estiman hasta que el plan permita OHLCV histórico.",
      "CoinMarketCap latest quote is live; technicals, sentiment, order book, and derivatives are proxy fields until future integrations.":
        "La cotización más reciente viene en vivo desde CoinMarketCap. El recorrido del gráfico y algunos indicadores se estiman hasta que el plan permita OHLCV histórico.",
      "CoinMarketCap latest quote is live; technicals, sentiment, order book, and derivatives are mock/proxy fields.":
        "La cotización más reciente viene en vivo desde CoinMarketCap. El recorrido del gráfico y algunos indicadores se estiman hasta que el plan permita OHLCV histórico.",
      "CoinMarketCap latest quote is live. Some advanced context fields are estimated until historical OHLCV is added.":
        "La cotización más reciente viene en vivo desde CoinMarketCap. Las velas y los indicadores son estimados hasta que el plan permita OHLCV histórico.",
      "Using mock data fallback because CoinMarketCap live quote is unavailable.":
        "Se están usando datos demo porque la cotización en vivo de CoinMarketCap no está disponible.",
      "Configured risk is too high for a capital-preservation strategy.":
        "El riesgo configurado es demasiado alto para una estrategia de preservación de capital.",
      "Current price is too far from entry to create a realistic risk-managed setup.":
        "El precio actual está demasiado lejos de la entrada para crear una configuración realista con riesgo controlado.",
      "Liquidity proxy is too weak for a beginner-friendly setup.":
        "La estimación de liquidez es demasiado débil para una configuración amigable para principiantes.",
      "Trend, sentiment, and liquidity are aligned against the trade.":
        "Tendencia, sentimiento y liquidez están alineados contra la operación.",
      "Meme-asset context is high risk and does not have enough liquidity support.":
        "El contexto del meme asset es de alto riesgo y no tiene suficiente soporte de liquidez.",
      "Derivatives proxy is unavailable or conflicting while risk is elevated.":
        "El contexto de derivados no está disponible o muestra conflicto mientras el riesgo es elevado.",
      "Intraday context needs stronger liquidity, momentum, and risk control before a setup is usable.":
        "El contexto intradía necesita más liquidez, impulso y control de riesgo antes de ser usable.",
      "Risk is not controlled enough for a defensive setup while market pressure is elevated.":
        "El riesgo no está lo bastante controlado para una configuración defensiva mientras la presión del mercado es elevada.",
      "Market structure is unclear, so waiting for a stronger selected-timeframe close is preferred.":
        "La estructura de mercado no está clara; es mejor esperar un cierre más fuerte en la temporalidad seleccionada.",
      "Entry price is too far from current price for a clean risk setup.":
        "El precio de entrada está demasiado lejos del precio actual para una configuración limpia de riesgo.",
      "Intraday timeframes are more speculative and need stronger confirmation.":
        "Las temporalidades intradía son más especulativas y necesitan más confirmación.",
      "Liquidity proxy is weak, so forced strategy signals are unreliable.":
        "La estimación de liquidez es débil, por eso las señales forzadas son poco confiables.",
      "Meme assets can move quickly; keep position risk small and wait for stronger confirmation.":
        "Los meme assets pueden moverse rápido; mantén bajo el riesgo y espera más confirmación.",
      "Breakout + Retest needs stronger momentum, volume, and a clear retest or breakout area.":
        "Ruptura + retesteo necesita más impulso, volumen y una zona clara de ruptura o retesteo.",
      "Trend Confirmation needs price above support and RSI that is not extremely overheated.":
        "Confirmación de tendencia necesita precio sobre soporte y un RSI que no esté extremadamente sobrecalentado.",
      "Defensive Rebound only fits when risk is controlled and price is near support.":
        "Rebote defensivo solo encaja cuando el riesgo está controlado y el precio está cerca de soporte.",
      "Auto mode sees a possible setup, but Risk Check is still valid for conservative traders.":
        "El modo Auto ve una posible configuración, pero Revisión de riesgo sigue siendo válida para perfiles conservadores.",
      "Risk or market structure is unclear for this selected strategy.":
        "El riesgo o la estructura de mercado no están claros para esta estrategia seleccionada.",
      "Risk or market structure is unclear for this strategy timeframe.":
        "El riesgo o la estructura de mercado no están claros para esta temporalidad de estrategia.",
      "Check whether price is losing stop, support, trailing-exit protection, or risk context before deciding to reduce or exit.":
        "Revisa si el precio está perdiendo el stop, el soporte, la protección de salida dinámica o el contexto de riesgo antes de decidir reducir o salir.",
      "Review whether holding remains valid, whether to reduce risk, or whether trailing-exit protection should lead.":
        "Revisa si mantener sigue siendo válido, si conviene reducir riesgo o si la protección de salida dinámica debe guiar la decisión.",
      "Wait for price to hold above the breakout area after a retest.":
        "Espera que el precio se mantenga sobre la zona de ruptura después de un retesteo.",
      "Wait for the selected timeframe to close above support or the trend filter.":
        "Espera un cierre de la temporalidad seleccionada sobre soporte o sobre el filtro de tendencia.",
      "Wait for stabilization near support and avoid averaging down without confirmation.":
        "Espera estabilización cerca del soporte y evita promediar a la baja sin confirmación.",
      "Wait for risk, liquidity, and market structure to improve before taking a new setup.":
        "Espera a que mejoren el riesgo, la liquidez y la estructura de mercado antes de buscar una nueva configuración.",
      "Exit review means checking whether risk controls or market structure argue for reducing exposure. It is not an execution command.":
        "La revisión de salida evalúa si los controles de riesgo o la estructura de mercado justifican reducir exposición. No es una orden de ejecución.",
      "Open-position management focuses on holding, reducing, waiting, or using trailing exits instead of adding risk automatically.":
        "La gestión de posición abierta se enfoca en mantener, reducir, esperar o usar salidas dinámicas en vez de agregar riesgo automáticamente.",
      "No-trade means protecting capital when the setup is not clear enough.":
        "No operar significa proteger capital cuando la configuración no está suficientemente clara.",
      "PositionSight compares the selected setup against trend, risk, liquidity, and momentum context before recommending it.":
        "PositionSight compara la configuración seleccionada contra tendencia, riesgo, liquidez e impulso antes de recomendarla.",
      "Not enough historical candles to calculate ema20.":
        "Historial insuficiente para calcular MA 20.",
      "Not enough historical candles to calculate ema50.":
        "Historial insuficiente para calcular MA 50.",
      "Not enough historical candles to calculate ema200.":
        "Historial insuficiente para calcular MA 200.",
      "Not enough historical candles to calculate rsi14.":
        "Historial insuficiente para calcular RSI 14.",
      "Not enough historical candles to calculate atr14.":
        "Historial insuficiente para calcular ATR 14.",
      "Not enough historical candles to calculate averageVolume.":
        "Historial insuficiente para calcular volumen promedio.",
      "Not enough historical candles to calculate support.":
        "Historial insuficiente para calcular soporte.",
      "Not enough historical candles to calculate resistance.":
        "Historial insuficiente para calcular resistencia.",
      "ATR is unavailable or estimated, so percent-based stop fallback is used.":
        "ATR no está disponible o es estimado, así que se usa el respaldo de stop por porcentaje.",
      "ATR-based stop would be at or below zero, so stop loss was clamped to a safe positive level.":
        "El stop basado en ATR quedaría en cero o menos, así que se ajustó a un nivel positivo seguro.",
      "Current price is below the stop. Review exit/risk immediately; this is not a fresh entry setup.":
        "El precio actual está por debajo del stop. Revisa salida/riesgo inmediatamente; esto no es una entrada nueva.",
      "Validate a planned long entry against risk, stop distance, trend, liquidity, and confirmation.":
        "Valida una entrada larga planeada contra riesgo, distancia al stop, tendencia, liquidez y confirmación.",
      "Manage the existing long position; do not add exposure while price is below the stop.":
        "Gestiona la posición larga existente; no agregues exposición mientras el precio esté debajo del stop.",
      "Manage an existing long position with hold, reduce, wait, or trailing-exit conditions.":
        "Gestiona una posición larga existente con condiciones de mantener, reducir, esperar o salida dinámica.",
      "Review whether the existing long position should be reduced or exited.":
        "Revisa si la posición larga existente debe reducirse o cerrarse.",
      "Wait for the selected timeframe to confirm the setup before adding exposure.":
        "Espera que la temporalidad seleccionada confirme la configuración antes de agregar exposición.",
      "Confirm whether the stop breach persists on the selected timeframe before deciding reduce or exit.":
        "Confirma si la pérdida del stop persiste en la temporalidad seleccionada antes de decidir reducir o salir.",
      "Review support, stop distance, and trailing-exit behavior before increasing or reducing exposure.":
        "Revisa soporte, distancia al stop y comportamiento de salida dinámica antes de aumentar o reducir exposición.",
      "Check stop, support, trailing-exit protection, and market context before deciding to reduce or exit.":
        "Revisa stop, soporte, protección de salida dinámica y contexto de mercado antes de decidir reducir o salir.",
      "Analyze entry mode sizes a possible new long position from capital, defined risk, and stop distance.":
        "El modo Analizar entrada dimensiona una posible nueva posición larga desde capital, riesgo definido y distancia al stop.",
      "Open-position management uses your existing holdings. It does not calculate a fresh buy or add exposure automatically.":
        "La gestión de posición abierta usa tus tenencias existentes. No calcula una compra nueva ni agrega exposición automáticamente.",
      "Exit review is a long-position risk review. It helps decide hold, reduce, or exit; it is not short selling.":
        "La revisión de salida es una revisión de riesgo de una posición larga. Ayuda a decidir mantener, reducir o salir; no es venta en corto.",
      "A breached stop means the position is no longer healthy under this risk model. This is not a fresh entry setup.":
        "Un stop perdido significa que la posición ya no está sana bajo este modelo de riesgo. Esto no es una configuración de entrada nueva.",
      "Sell review means protecting an existing long position. It does not open a short position or execute a sale.":
        "La revisión de venta significa proteger una posición larga existente. No abre una posición corta ni ejecuta una venta.",
      "Simple deterministic backtest v1; not a professional trading simulator.":
        "Prueba v1 simple y determinística; no es un simulador profesional de operaciones.",
      "No live execution, no wallet connection, and no exchange order placement.":
        "Sin ejecución en vivo, sin conexión de billetera y sin colocación de órdenes en mercados.",
      "Uses CoinMarketCap historical OHLCV candles when available; execution order inside each candle is simplified.":
        "Usa velas OHLCV históricas de CoinMarketCap cuando están disponibles; el orden de ejecución dentro de cada vela se simplifica.",
      "Historical OHLCV is unavailable on the current response or plan; candles are estimated from live quote context.":
        "OHLCV histórico no está disponible con la respuesta o plan actual; las velas se estiman desde el contexto de cotización en vivo.",
      "No history response was available in the UI; a small demo dataset was generated for illustration only.":
        "No hubo respuesta de historial disponible en la UI; se generó un conjunto de datos demo pequeño solo para ilustración.",
      "Backtest used CoinMarketCap historical OHLCV candles.":
        "La prueba usó velas OHLCV históricas de CoinMarketCap.",
      "Backtest used estimated candles from live quote context because historical OHLCV was unavailable.":
        "La prueba usó velas estimadas desde el contexto de cotización porque OHLCV histórico no estaba disponible.",
      "Backtest used a documented demo dataset because no history candles were available.":
        "La prueba usó datos demo documentados porque no había velas históricas disponibles.",
      "Strategy type is no_trade, so the backtest records capital-protection behavior instead of opening a new position.":
        "El tipo de estrategia es no operar, así que la prueba registra protección de capital en vez de abrir una posición nueva.",
      "Manage-open-position mode assumes the long position is already open.":
        "El modo de gestión de posición abierta asume que la posición larga ya está abierta.",
      "Exit-review mode checks reduce/exit behavior for an existing long position; it does not simulate short selling.":
        "El modo de revisión de salida evalúa reducir o salir de una posición larga existente; no simula venta en corto.",
    },
    decisionCopy: {
      autoWhy: "Auto recomendado eligió el mejor ajuste para el contexto actual:",
      manualGood: "La estrategia seleccionada encaja con el contexto actual de mercado.",
      manualCaution: "La estrategia seleccionada se está evaluando, pero necesita más confirmación antes de estar limpia.",
      manualNoTrade:
        "La estrategia seleccionada se está evaluando, pero el motor de riesgo actualmente recomienda condiciones de no operar.",
    },
    intentDecisionCopy: {
      analyze_entry: {
        prefix: "Análisis de entrada:",
        nextConfirmation: "",
        beginnerExplanation: "",
      },
      manage_open_position: {
        prefix: "Gestión de posición abierta:",
        nextConfirmation: "Observa si mantener sigue siendo válido, si reducir riesgo es más limpio o si la salida dinámica debe guiar la siguiente decisión.",
        beginnerExplanation: "Esta vista sirve para gestionar una posición existente. No coloca órdenes ni te indica agregar exposición automáticamente.",
      },
      exit_review: {
        prefix: "Revisión de salida:",
        nextConfirmation: "Revisa stop, salida dinámica, pérdida de soporte, riesgo y contexto de mercado antes de decidir si reducir o salir es más limpio.",
        beginnerExplanation: "La revisión de salida se enfoca en reducir riesgo o salir de una posición cuando la configuración se debilita. No ejecuta una venta.",
      },
    },
    nextConfirmationMessages: {
      trend_following_pullback: "Espera un cierre de la temporalidad seleccionada sobre soporte o el filtro de tendencia.",
      breakout_with_volume: "Espera que el precio se mantenga sobre la zona de ruptura después de un retesteo.",
      defensive_mean_reversion: "Espera estabilización cerca del soporte y evita promediar sin confirmación.",
      no_trade: "Espera a que mejoren riesgo, liquidez y estructura de mercado antes de buscar una nueva configuración.",
    },
    beginnerVerdictMessages: {
      good: "Esta configuración es el ajuste más limpio por ahora, pero los límites de riesgo siguen siendo importantes.",
      needs_confirmation: "Esta configuración no está rechazada, pero un principiante debería esperar más confirmación.",
      poor_fit: "Esta configuración no encaja de forma limpia. Trátala como investigación, no como señal de acción.",
      no_trade_recommended: "No operar significa proteger capital cuando la configuración no está suficientemente clara.",
    },
    tooltips: {
      tokenList: "Modo Principiante muestra una lista más corta; Avanzado muestra más tokens soportados por el hackathon.",
      eligibleToken:
        "Elige el criptoactivo elegible que quieres analizar.",
      positionIntent:
        "Elige si quieres analizar una posible entrada, gestionar una posición existente o revisar condiciones de salida y reducción.",
      entryPrice: "El precio donde compraste, o el precio donde estás considerando entrar.",
      positionSize: "Cantidad calculada de tokens para esta configuración de riesgo.",
      totalCapital: "Tu base de capital para calcular el tamaño de posición según riesgo.",
      calculatedPositionSize: "Tamaño de solo lectura calculado con capital, riesgo, precio de entrada, ATR y distancia al stop.",
      currentPositionSize: "Cuántos tokens o monedas mantienes actualmente en la posición larga existente.",
      strategyTimeframe:
        "Elige la temporalidad para evaluar la estrategia. Temporalidades cortas son más especulativas y requieren más confirmación; temporalidades altas son mejores para decisiones más pacientes.",
      strategyMode:
        "Auto deja que PositionSight elija la estrategia más adecuada. Manual te permite probar una estrategia específica y ver si encaja.",
      maxRiskPercentage: "El porcentaje máximo del precio de entrada que estás dispuesto a arriesgar si la configuración falla.",
    },
    strategyModeLabels: {
      auto: "Auto recomendado",
      trend_confirmation: "Confirmación de tendencia",
      breakout_retest: "Ruptura + retesteo",
      defensive_rebound: "Rebote defensivo",
      risk_check: "Revisión de riesgo / No operar",
    },
    strategyTypeLabels: {
      trend_following_pullback: "Confirmación de tendencia",
      breakout_with_volume: "Ruptura + retesteo",
      defensive_mean_reversion: "Rebote defensivo",
      no_trade: "Revisión de riesgo / No operar",
    },
    timeframeLabels: {
      "15m": "15m",
      "30m": "30m",
      "1h": "1h",
      "1d": "1d",
      "1w": "1sem",
      "1mo": "1mes",
    },
    strategyExplanations: {
      auto: {
        simple:
          "Deja que PositionSight elija la estrategia que mejor encaja según contexto de mercado, riesgo, tendencia, liquidez e impulso.",
        bestUsedWhen: "Ideal para principiantes o cuando quieres una recomendación centrada en riesgo.",
        avoidWhen: "Evítalo si quieres probar manualmente una idea de estrategia específica.",
        checks: "Revisa todas las estrategias disponibles y puede elegir no operar cuando el riesgo es malo.",
        beginnerNote: "Empieza aquí si no sabes qué configuración encaja con el contexto actual.",
      },
      trend_confirmation: {
        simple: "Busca un setup donde el mercado muestra suficiente fuerza para continuar después de confirmar.",
        bestUsedWhen: "Úsalo cuando el precio está sobre soporte, la tendencia está sana y el riesgo está controlado.",
        avoidWhen: "Evítalo cuando el precio está demasiado extendido o sentimiento/liquidez son débiles.",
        checks: "Revisa tendencia, soporte, MA estimada, RSI estimado y riesgo.",
        beginnerNote: "Este modo espera evidencia en vez de adivinar el fondo.",
      },
      breakout_retest: {
        simple: "Busca un movimiento fuerte confirmado por volumen y espera que la zona de ruptura se mantenga.",
        bestUsedWhen: "Úsalo cuando el precio rompe resistencia con volumen y liquidez.",
        avoidWhen: "Evítalo cuando el movimiento está demasiado extendido o la ruptura no está confirmada.",
        checks: "Revisa cambio porcentual, volumen, liquidez, resistencia y sentimiento.",
        beginnerNote: "Una ruptura es más fuerte cuando el mercado demuestra que la vieja resistencia puede sostenerse como soporte.",
      },
      defensive_rebound: {
        simple: "Se usa cuando una posición está bajo presión pero podría estabilizarse cerca de soporte.",
        bestUsedWhen: "Úsalo cuando el riesgo está controlado y el precio está cerca de soporte.",
        avoidWhen: "Evítalo cuando la tendencia es bajista, la liquidez es débil o estás promediando a ciegas.",
        checks: "Revisa soporte, RSI estimado, riesgo, liquidez e invalidación.",
        beginnerNote: "Es defensivo. No es permiso para seguir agregando a una posición perdedora.",
      },
      risk_check: {
        simple: "Te protege de setups poco claros o demasiado riesgosos.",
        bestUsedWhen: "Úsalo cuando la entrada está lejos, el riesgo es alto, la liquidez es débil o las señales se contradicen.",
        avoidWhen: "Evítalo solo cuando tienes un setup claro y con riesgo controlado para probar.",
        checks: "Revisa distancia de entrada, riesgo, tendencia, liquidez, sentimiento y señales contradictorias.",
        beginnerNote: "A veces la mejor operación es no operar.",
      },
    },
  },
} as const;
