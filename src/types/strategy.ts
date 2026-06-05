export type Timeframe = "15m" | "1h" | "4h" | "1d";

export type StrategyType =
  | "trend_following_pullback"
  | "breakout_with_volume"
  | "defensive_mean_reversion"
  | "no_trade";

export type EligibleToken = {
  id: number;
  symbol: string;
  name: string;
  category: "Layer 1" | "Layer 2" | "DeFi" | "AI" | "Meme" | "Exchange";
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

export type PositionInput = {
  symbol: string;
  entryPrice: number;
  positionSize: number;
  timeframe: Timeframe;
  maxRiskPercentage: number;
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
