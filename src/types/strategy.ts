export type StrategyTimeframe = "15m" | "30m" | "1h" | "1d" | "1w" | "1mo";
export type TimeframeCategory = "intraday" | "daily" | "weekly" | "monthly";
export type AggregationHint = "weekly" | "monthly";

export type StrategyType =
  | "trend_following_pullback"
  | "breakout_with_volume"
  | "defensive_mean_reversion"
  | "no_trade";

export type StrategyMode =
  | "auto"
  | "trend_confirmation"
  | "breakout_retest"
  | "defensive_rebound"
  | "risk_check";

export type PositionIntent = "analyze_entry" | "manage_open_position" | "exit_review";
export type IntentAction =
  | "evaluate_entry"
  | "wait_for_confirmation"
  | "hold_with_trailing_exit"
  | "reduce_risk"
  | "exit_or_reduce"
  | "stop_breached"
  | "no_trade";
export type IntentVerdict =
  | "entry_validation"
  | "hold"
  | "reduce_risk"
  | "exit_review_required"
  | "wait"
  | "no_trade";
export type StopStatus = "above_stop" | "near_stop" | "stop_breached";
export type SizingMode = "calculated_new_entry" | "existing_position";
export type ChartMode = "entry_validation" | "position_management" | "exit_review";

export type StrategyFit = "good" | "caution" | "poor";
export type RiskVerdict = "good" | "needs_confirmation" | "poor_fit" | "no_trade_recommended";
export type RiskBadge = "low" | "medium" | "high" | "no_trade";

export type TokenCategory =
  | "Main Assets"
  | "Stablecoins / Collateral"
  | "DeFi / Infrastructure / AI"
  | "Memecoins / Web3 Culture";

export type EligibleToken = {
  id: number;
  cmcId?: number;
  symbol: string;
  name: string;
  category: TokenCategory;
  beginner?: boolean;
};

export type MarketQuote = {
  symbol: string;
  price: number;
  percentChange24h: number;
  volume24h: number;
  marketCap?: number;
  lastUpdated: string;
  source: "mock" | "coinmarketcap";
};

export type OhlcvCandle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type HistorySource = "coinmarketcap" | "estimated";
export type BacktestSource = "historical_cmc" | "demo_dataset" | "estimated_from_live_quote";
export type BacktestWinLossResult = "win" | "loss" | "flat" | "not_triggered";

export type TechnicalIndicators = {
  ema20: number | null;
  ema50: number | null;
  ema200: number | null;
  ma20?: number | null;
  ma50?: number | null;
  ma200?: number | null;
  rsi14: number | null;
  atr14: number | null;
  averageVolume: number | null;
  support: number | null;
  resistance: number | null;
};

export type HistoryResponse = {
  symbol: string;
  source: HistorySource;
  timeframe: StrategyTimeframe;
  candles: OhlcvCandle[];
  indicators: TechnicalIndicators;
  diagnostics?: {
    hasCmcApiKey: boolean;
    cmcId?: number;
    cmcStatus?: number;
    parsedLiveHistory?: boolean;
    fallbackReason?: string;
  };
  warnings: string[];
};

export type MarketContext = {
  symbol: string;
  source: "mock" | "coinmarketcap";
  warnings?: string[];
  diagnostics?: {
    hasCmcApiKey: boolean;
    cmcRequestMode: "id" | "symbol";
    cmcId?: number;
    cmcStatus?: number;
    cmcErrorCode?: string | number;
    cmcErrorMessage?: string;
    parserError?: string;
    parsedLiveQuote?: boolean;
  };
  quote: {
    price: number;
    percentChange24h: number;
    volume24h: number;
    marketCap?: number;
    lastUpdated: string;
  };
  technicals: {
    ema20: number;
    ema50: number;
    ema200: number;
    rsi14: number;
    atr14: number;
    averageVolume?: number;
    support: number;
    resistance: number;
    historySource?: HistorySource;
    historyCandlesUsed?: number;
    indicatorWarnings?: string[];
    trendState: "bullish" | "neutral" | "bearish";
    closePosition:
      | "above_support"
      | "below_support"
      | "near_resistance"
      | "breakout"
      | "breakdown"
      | "range";
  };
  sentiment: {
    score: number;
    label: "bullish" | "neutral" | "bearish";
    newsBias: string;
    communityBias: string;
  };
  orderBook: {
    bidAskSpreadPercent: number;
    buyPressure: number;
    sellPressure: number;
    liquidityScore: number;
  };
  derivatives: {
    fundingBias: "positive" | "neutral" | "negative" | "unavailable";
    openInterestChange24h: number;
    longShortBias: "long" | "neutral" | "short" | "unavailable";
  };
};

export type PositionInput = {
  symbol: string;
  entryPrice: number;
  positionSize: number;
  totalCapital: number;
  strategyTimeframe: StrategyTimeframe;
  timeframeCategory: TimeframeCategory;
  analysisInterval: StrategyTimeframe;
  maxRiskPercentage: number;
  positionIntent: PositionIntent;
  strategyMode?: StrategyMode;
};

export type StrategySpec = {
  asset: string;
  strategyTimeframe: StrategyTimeframe;
  timeframeCategory: TimeframeCategory;
  analysisInterval: StrategyTimeframe;
  strategyType: StrategyType;
  entryCondition: string;
  exitCondition: string;
  stopLoss: number;
  takeProfit: number;
  invalidationLevel: number;
  riskRules: {
    positionIntent: PositionIntent;
    intentAction?: IntentAction;
    intentVerdict?: IntentVerdict;
    riskBadge?: RiskBadge;
    stopStatus?: StopStatus;
    shouldAddExposure?: boolean;
    shouldReduceExposure?: boolean;
    shouldExitPosition?: boolean;
    allowShort?: false;
    sizingMode?: SizingMode;
    chartMode?: ChartMode;
    maxRiskPercentage: number;
    positionSize: number;
    totalCapital?: number;
    calculatedPositionSize?: number;
    positionSizingMethod?: "atr_volatility" | "percent_fallback";
    stopDistance?: number;
    atrMultiple?: number;
    estimatedRiskAmount: number;
    noTradeReason?: string;
    warnings?: string[];
  };
  dataUsed: {
    entryPrice: number;
    currentPrice: number;
    percentChange24h: number;
    volume24h: number;
    marketCap?: number;
    source: MarketQuote["source"];
    lastUpdated: string;
  };
};

export type StrategyDecision = {
  spec: StrategySpec;
  positionIntent: PositionIntent;
  intentAction: IntentAction;
  intentVerdict: IntentVerdict;
  riskBadge: RiskBadge;
  stopStatus: StopStatus;
  shouldAddExposure: boolean;
  shouldReduceExposure: boolean;
  shouldExitPosition: boolean;
  allowShort: false;
  sizingMode: SizingMode;
  chartMode: ChartMode;
  suggestedAction: string;
  decisionCondition: string;
  selectedMode: StrategyMode;
  selectedStrategyMode: StrategyMode;
  evaluatedStrategyType: StrategyType;
  finalRiskVerdict: RiskVerdict;
  noTradeRecommended: boolean;
  noTradeReason?: string;
  selectedBy: "auto" | "user";
  fit: StrategyFit;
  whyThisStrategy: string;
  warnings: string[];
  nextConfirmation: string;
  beginnerExplanation: string;
};

export type BacktestSignal = "LONG" | "HOLD" | "REDUCE" | "EXIT" | "ABSTAIN" | "CONDITIONAL_LONG";

export type BacktestSpec = {
  positionIntent: PositionIntent;
  intentAction?: IntentAction;
  intentVerdict?: IntentVerdict;
  riskBadge?: RiskBadge;
  stopStatus?: StopStatus;
  shouldAddExposure?: boolean;
  shouldReduceExposure?: boolean;
  shouldExitPosition?: boolean;
  allowShort?: false;
  sellReviewMeaning?: string;
  sizingMode?: SizingMode;
  positionSizingMode?: SizingMode;
  chartMode?: ChartMode;
  strategyType: StrategyType;
  strategyTimeframe: StrategyTimeframe;
  timeframeCategory: TimeframeCategory;
  analysisInterval: StrategyTimeframe;
  aggregationHint?: AggregationHint;
  warning?: string;
  signal: BacktestSignal;
  shouldOpenPosition: boolean;
  entryRule: Record<string, unknown>;
  exitRule: Record<string, unknown>;
  stopRule: Record<string, unknown>;
  takeProfitRule: Record<string, unknown>;
  trailingExit?: {
    enabled: true;
    method: "atr_ma_trailing";
    initialReference: number;
    atrMultiple: number;
  };
  invalidationRule: Record<string, unknown>;
  positionSizing: Record<string, unknown>;
  riskManagement: Record<string, unknown>;
};

export type BacktestResult = {
  backtestSource: BacktestSource;
  candlesUsed: number;
  startDate?: string;
  endDate?: string;
  entryTriggered: boolean;
  exitTriggered: boolean;
  stopHit: boolean;
  trailingExitHit: boolean;
  finalPrice: number;
  grossReturnPercentage: number;
  estimatedPnL: number;
  maxDrawdownPercentage: number;
  winLossResult: BacktestWinLossResult;
  notes: string[];
  limitations: string[];
};

export type AiExplanationResult = {
  summary: string;
  whatTheSystemSaw: string[];
  whyThisDecision: string[];
  riskExplanation: string;
  whatToWatchNext: string[];
  limitations: string[];
  notFinancialAdvice: string;
};

export type AiExplanationSource = "provider" | "deterministic_fallback" | "not_generated";

export type AiExplanationMetadata = {
  enabled: boolean;
  source: AiExplanationSource;
  provider: string | null;
  model: string | null;
  explanation: AiExplanationResult | null;
  guardrails: {
    doesNotOverrideEngine: true;
    noFinancialAdvice: true;
    noTradeExecution: true;
  };
};

export type ScannerResult = {
  symbol: string;
  name: string;
  price: number;
  percentChange24h: number;
  trendState: MarketContext["technicals"]["trendState"];
  rsi14: number | null;
  maAlignment: "bullish" | "mixed" | "bearish" | "unavailable";
  riskBadge: RiskBadge;
  intentAction: IntentAction;
  stopStatus: StopStatus;
  dataSource: {
    quote: MarketContext["source"];
    history: HistorySource | "unavailable";
    backtest: BacktestSource;
  };
  reason: string;
  strategyDecision: Omit<StrategyDecision, "spec">;
  strategySpec: StrategySpec;
  backtestResult: BacktestResult;
};

export type StrategyExport = {
  schemaVersion: "1.0.0";
  skill: {
    name: "positionsight-ai";
    track: "strategy_skills";
    artifactType: "backtestable_strategy_spec";
  };
  inputSchema: {
    required: Array<keyof PositionInput>;
    properties: Record<string, Record<string, unknown>>;
  };
  dataProvenance: {
    source: MarketContext["source"];
    latestQuoteSource?: MarketContext["source"];
    historySource?: HistorySource;
    isLive: boolean;
    intendedLiveSource: "CoinMarketCap";
    generatedAt: string;
  };
  historySource?: HistorySource;
  indicatorSource?: "coinmarketcap_ohlcv" | "estimated_candles";
  chartSeriesType: "estimated_from_live_quote_context" | "historical_ohlcv";
  advancedContextType: "estimated_until_ohlcv";
  dataRequirements: {
    requiredSeries: ["open", "high", "low", "close", "volume"];
    interval: StrategyTimeframe;
    aggregationHint?: AggregationHint;
    minimumHistoryDays: 200;
    lookbackPeriods: 200;
    requiredIndicators: ["ma20", "ma50", "ma200", "rsi14", "atr14", "support", "resistance"];
  };
  totalCapital?: number;
  calculatedPositionSize?: number;
  positionIntent: PositionIntent;
  intentAction?: IntentAction;
  intentVerdict?: IntentVerdict;
  riskBadge?: RiskBadge;
  riskVerdict?: RiskVerdict;
  strategyTimeframe?: StrategyTimeframe;
  timeframeCategory?: TimeframeCategory;
  analysisInterval?: StrategyTimeframe;
  stopStatus?: StopStatus;
  positionSizingMode?: SizingMode;
  existingPositionSize?: number;
  shouldAddExposure?: boolean;
  shouldReduceExposure?: boolean;
  shouldExitPosition?: boolean;
  allowShort?: false;
  sellReviewMeaning?: string;
  sizingMode?: SizingMode;
  chartMode?: ChartMode;
  trailingExit?: {
    enabled: true;
    method: "atr_ma_trailing";
    initialReference: number;
    atrMultiple: number;
  };
  selectedStrategyMode: StrategyMode;
  evaluatedStrategyType: StrategyType;
  finalRiskVerdict: RiskVerdict;
  noTradeRecommended: boolean;
  noTradeReason?: string;
  backtestSpec: BacktestSpec;
  backtestResult?: BacktestResult;
  backtestSource?: BacktestSource;
  candlesUsed?: number;
  executionAssumptions: {
    initialCapital: 10000;
    feesBps: 10;
    slippageBps: 5;
    allowShort: false;
    allowLeverage: false;
    orderType: "market_on_next_close";
  };
  evaluationMetrics: [
    "total_return",
    "max_drawdown",
    "win_rate",
    "profit_factor",
    "sharpe_ratio",
    "number_of_trades",
  ];
  validation: {
    backtestReady: true;
    limitations: string[];
  };
  aiExplanation?: AiExplanationMetadata;
  scannerResults?: ScannerResult[];
  strategySpec: StrategySpec;
  strategyDecision: Omit<StrategyDecision, "spec">;
  marketContext: MarketContext;
  history?: {
    source: HistorySource;
    candlesUsed: number;
    indicatorSource: "coinmarketcap_ohlcv" | "estimated_candles";
    indicators: TechnicalIndicators & {
      ma20?: number | null;
      ma50?: number | null;
      ma200?: number | null;
    };
    warnings: string[];
  };
  explanation: string;
  warnings: string[];
};
