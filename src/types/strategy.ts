export type Timeframe = "15m" | "1h" | "4h" | "1d";

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

export type StrategyFit = "good" | "caution" | "poor";

export type TokenCategory =
  | "Main Assets"
  | "Stablecoins / Collateral"
  | "DeFi / Infrastructure / AI"
  | "Memecoins / Web3 Culture";

export type EligibleToken = {
  id: number;
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

export type MarketContext = {
  symbol: string;
  source: "mock" | "coinmarketcap";
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
    support: number;
    resistance: number;
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
  timeframe: Timeframe;
  maxRiskPercentage: number;
  strategyMode?: StrategyMode;
};

export type StrategySpec = {
  asset: string;
  timeframe: Timeframe;
  strategyType: StrategyType;
  entryCondition: string;
  exitCondition: string;
  stopLoss: number;
  takeProfit: number;
  invalidationLevel: number;
  riskRules: {
    maxRiskPercentage: number;
    positionSize: number;
    estimatedRiskAmount: number;
    noTradeReason?: string;
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
  selectedMode: StrategyMode;
  selectedBy: "auto" | "user";
  fit: StrategyFit;
  whyThisStrategy: string;
  warnings: string[];
  nextConfirmation: string;
  beginnerExplanation: string;
};

export type BacktestSignal = "LONG" | "REDUCE" | "EXIT" | "ABSTAIN" | "CONDITIONAL_LONG";

export type BacktestSpec = {
  strategyType: StrategyType;
  signal: BacktestSignal;
  shouldOpenPosition: boolean;
  entryRule: Record<string, unknown>;
  exitRule: Record<string, unknown>;
  stopRule: Record<string, unknown>;
  takeProfitRule: Record<string, unknown>;
  invalidationRule: Record<string, unknown>;
  positionSizing: Record<string, unknown>;
  riskManagement: Record<string, unknown>;
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
    isLive: boolean;
    intendedLiveSource: "CoinMarketCap";
    generatedAt: string;
  };
  dataRequirements: {
    requiredSeries: ["open", "high", "low", "close", "volume"];
    interval: Timeframe;
    lookbackPeriods: 200;
    requiredIndicators: ["ema20", "ema50", "ema200", "rsi14", "atr14", "support", "resistance"];
  };
  backtestSpec: BacktestSpec;
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
    limitations: ["mock data", "not financial advice", "no live execution"];
  };
  strategySpec: StrategySpec;
  strategyDecision: Omit<StrategyDecision, "spec">;
  marketContext: MarketContext;
  explanation: string;
  warnings: string[];
};
