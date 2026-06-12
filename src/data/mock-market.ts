import { eligibleTokenUniverse } from "@/data/eligible-tokens";
import type { EligibleToken, MarketContext, MarketQuote } from "@/types/strategy";

type MockSeed = {
  price: number;
  percentChange24h: number;
  volume24h: number;
  marketCap?: number;
  ema20?: number;
  ema50?: number;
  ema200?: number;
  rsi14?: number;
  atr14?: number;
  support?: number;
  resistance?: number;
  trendState?: MarketContext["technicals"]["trendState"];
  closePosition?: MarketContext["technicals"]["closePosition"];
  sentimentScore?: number;
  sentimentLabel?: MarketContext["sentiment"]["label"];
  newsBias?: string;
  communityBias?: string;
  bidAskSpreadPercent?: number;
  buyPressure?: number;
  sellPressure?: number;
  liquidityScore?: number;
  fundingBias?: MarketContext["derivatives"]["fundingBias"];
  openInterestChange24h?: number;
  longShortBias?: MarketContext["derivatives"]["longShortBias"];
};

const scenarioSeeds: Record<string, MockSeed> = {
  AVAX: {
    price: 35.62,
    percentChange24h: -2.78,
    volume24h: 525_000_000,
    marketCap: 13_900_000_000,
    ema20: 36.1,
    ema50: 34.6,
    ema200: 31.4,
    rsi14: 41,
    atr14: 2.15,
    support: 33.8,
    resistance: 38.4,
    trendState: "neutral",
    closePosition: "above_support",
    sentimentScore: -8,
    sentimentLabel: "neutral",
    newsBias: "Mixed but still holding daily support.",
    communityBias: "Cautious after a pullback.",
    bidAskSpreadPercent: 0.08,
    buyPressure: 54,
    sellPressure: 46,
    liquidityScore: 78,
    fundingBias: "neutral",
    openInterestChange24h: -1.4,
    longShortBias: "neutral",
  },
  LINK: {
    price: 17.44,
    percentChange24h: 2.14,
    volume24h: 658_000_000,
    marketCap: 10_200_000_000,
    ema20: 16.9,
    ema50: 16.2,
    ema200: 14.7,
    rsi14: 63,
    atr14: 0.92,
    support: 16.35,
    resistance: 18.2,
    trendState: "bullish",
    closePosition: "near_resistance",
    sentimentScore: 18,
    sentimentLabel: "bullish",
    newsBias: "Constructive infrastructure narrative.",
    communityBias: "Positive but approaching resistance.",
    bidAskSpreadPercent: 0.05,
    buyPressure: 58,
    sellPressure: 42,
    liquidityScore: 83,
    fundingBias: "positive",
    openInterestChange24h: 4.2,
    longShortBias: "long",
  },
  ETH: {
    price: 3550.74,
    percentChange24h: 0.94,
    volume24h: 16_840_000_000,
    marketCap: 426_900_000_000,
    ema20: 3490,
    ema50: 3385,
    ema200: 3050,
    rsi14: 57,
    atr14: 142,
    support: 3360,
    resistance: 3680,
    trendState: "bullish",
    closePosition: "above_support",
    sentimentScore: 24,
    sentimentLabel: "bullish",
    newsBias: "Broad market leadership remains constructive.",
    communityBias: "Steady demand with moderate leverage.",
    bidAskSpreadPercent: 0.02,
    buyPressure: 56,
    sellPressure: 44,
    liquidityScore: 95,
    fundingBias: "neutral",
    openInterestChange24h: 1.8,
    longShortBias: "neutral",
  },
  AAVE: {
    price: 287.42,
    percentChange24h: 1.74,
    volume24h: 386_000_000,
    marketCap: 4_340_000_000,
    ema20: 280,
    ema50: 263,
    ema200: 226,
    rsi14: 59,
    atr14: 18.4,
    support: 268,
    resistance: 302,
    trendState: "bullish",
    closePosition: "above_support",
    sentimentScore: 16,
    sentimentLabel: "bullish",
    newsBias: "DeFi strength remains supportive.",
    communityBias: "Constructive but not euphoric.",
    bidAskSpreadPercent: 0.07,
    buyPressure: 55,
    sellPressure: 45,
    liquidityScore: 75,
    fundingBias: "neutral",
    openInterestChange24h: 2.7,
    longShortBias: "neutral",
  },
  CAKE: {
    price: 2.91,
    percentChange24h: 4.12,
    volume24h: 274_000_000,
    marketCap: 848_000_000,
    ema20: 2.72,
    ema50: 2.6,
    ema200: 2.18,
    rsi14: 66,
    atr14: 0.22,
    support: 2.7,
    resistance: 2.95,
    trendState: "bullish",
    closePosition: "breakout",
    sentimentScore: 29,
    sentimentLabel: "bullish",
    newsBias: "DEX activity narrative improving.",
    communityBias: "Momentum traders are active.",
    bidAskSpreadPercent: 0.11,
    buyPressure: 66,
    sellPressure: 34,
    liquidityScore: 72,
    fundingBias: "positive",
    openInterestChange24h: 8.6,
    longShortBias: "long",
  },
  FET: {
    price: 1.42,
    percentChange24h: 3.72,
    volume24h: 382_000_000,
    marketCap: 3_600_000_000,
    ema20: 1.32,
    ema50: 1.26,
    ema200: 1.04,
    rsi14: 64,
    atr14: 0.1,
    support: 1.31,
    resistance: 1.46,
    trendState: "bullish",
    closePosition: "breakout",
    sentimentScore: 34,
    sentimentLabel: "bullish",
    newsBias: "AI token narrative is supportive.",
    communityBias: "Positive and momentum-oriented.",
    bidAskSpreadPercent: 0.1,
    buyPressure: 64,
    sellPressure: 36,
    liquidityScore: 70,
    fundingBias: "positive",
    openInterestChange24h: 9.2,
    longShortBias: "long",
  },
  DOGE: {
    price: 0.148,
    percentChange24h: 4.56,
    volume24h: 1_260_000_000,
    marketCap: 21_400_000_000,
    ema20: 0.141,
    ema50: 0.137,
    ema200: 0.122,
    rsi14: 72,
    atr14: 0.012,
    support: 0.136,
    resistance: 0.153,
    trendState: "bullish",
    closePosition: "near_resistance",
    sentimentScore: 21,
    sentimentLabel: "bullish",
    newsBias: "Meme momentum is active but fragile.",
    communityBias: "High attention and high emotion.",
    bidAskSpreadPercent: 0.16,
    buyPressure: 61,
    sellPressure: 39,
    liquidityScore: 69,
    fundingBias: "positive",
    openInterestChange24h: 13.5,
    longShortBias: "long",
  },
  SHIB: {
    price: 0.000024,
    percentChange24h: -0.82,
    volume24h: 412_000_000,
    marketCap: 14_100_000_000,
    ema20: 0.0000248,
    ema50: 0.0000254,
    ema200: 0.0000261,
    rsi14: 38,
    atr14: 0.0000022,
    support: 0.0000229,
    resistance: 0.0000265,
    trendState: "bearish",
    closePosition: "above_support",
    sentimentScore: -18,
    sentimentLabel: "bearish",
    newsBias: "Weak momentum after attention faded.",
    communityBias: "Speculative interest remains but conviction is low.",
    bidAskSpreadPercent: 0.22,
    buyPressure: 43,
    sellPressure: 57,
    liquidityScore: 54,
    fundingBias: "unavailable",
    openInterestChange24h: -4.8,
    longShortBias: "unavailable",
  },
  UNI: {
    price: 9.38,
    percentChange24h: 1.33,
    volume24h: 174_000_000,
    marketCap: 5_600_000_000,
  },
  ATOM: {
    price: 6.84,
    percentChange24h: -0.62,
    volume24h: 164_000_000,
    marketCap: 2_670_000_000,
  },
  TWT: {
    price: 1.13,
    percentChange24h: 0.78,
    volume24h: 27_000_000,
    marketCap: 471_000_000,
    liquidityScore: 58,
    fundingBias: "unavailable",
    longShortBias: "unavailable",
  },
};

const defaultPrices: Record<string, number> = {
  BNB: 610,
  XRP: 2.18,
  TRX: 0.28,
  ADA: 0.71,
  BCH: 485,
  LTC: 88,
  DOT: 6.24,
  ETC: 24.6,
  TON: 5.38,
  USDT: 1,
  USDC: 1,
  DAI: 1,
  TUSD: 1,
  FDUSD: 1,
  USDD: 1,
  USD1: 1,
  USDe: 1,
  STABLE: 1,
  XAUt: 2340,
  INJ: 28.16,
  LDO: 2.04,
  PENDLE: 5.42,
  STG: 0.42,
  FIL: 4.72,
  ZRO: 3.58,
  DEXE: 12.8,
  ZEC: 31.2,
  BTT: 0.0000012,
  NFT: 0.00000042,
  M: 0.98,
  WLFI: 0.12,
  BONK: 0.000026,
  FLOKI: 0.00018,
  PENGU: 0.031,
  LUNC: 0.000094,
};

function fallbackSeed(token: EligibleToken): MockSeed {
  const price = defaultPrices[token.symbol] ?? Math.max(0.05, (token.id % 500) / 10);
  const stable = token.category === "Stablecoins / Collateral";
  const percentChange24h = stable ? 0.02 : ((token.id % 9) - 4) * 0.42;
  const volume24h = stable ? 125_000_000 : 40_000_000 + (token.id % 20) * 18_000_000;
  const marketCap = stable ? 900_000_000 + (token.id % 50) * 25_000_000 : 250_000_000 + (token.id % 100) * 80_000_000;

  return {
    price,
    percentChange24h,
    volume24h,
    marketCap,
    trendState: stable ? "neutral" : percentChange24h > 0.8 ? "bullish" : percentChange24h < -0.8 ? "bearish" : "neutral",
    closePosition: stable ? "range" : percentChange24h > 1 ? "above_support" : percentChange24h < -1 ? "below_support" : "range",
    sentimentScore: stable ? 0 : Math.round(percentChange24h * 7),
    sentimentLabel: stable ? "neutral" : percentChange24h > 0.8 ? "bullish" : percentChange24h < -0.8 ? "bearish" : "neutral",
    newsBias: stable
      ? "Collateral estimate; directional signal is intentionally muted."
      : "Generic estimated context for advanced universe testing.",
    communityBias: stable ? "Stablecoin context; not a momentum asset." : "Moderate attention with no strong conviction signal.",
    liquidityScore: stable ? 82 : 52 + (token.id % 30),
    fundingBias: stable ? "unavailable" : "neutral",
    longShortBias: stable ? "unavailable" : "neutral",
  };
}

function createContext(token: EligibleToken, seed: MockSeed): MarketContext {
  const trendState = seed.trendState ?? (seed.percentChange24h > 1 ? "bullish" : seed.percentChange24h < -1 ? "bearish" : "neutral");
  const sentimentLabel =
    seed.sentimentLabel ?? (seed.sentimentScore && seed.sentimentScore > 15 ? "bullish" : seed.sentimentScore && seed.sentimentScore < -15 ? "bearish" : "neutral");
  const ema20 = seed.ema20 ?? seed.price * (trendState === "bullish" ? 0.97 : trendState === "bearish" ? 1.03 : 1);
  const ema50 = seed.ema50 ?? seed.price * (trendState === "bullish" ? 0.94 : trendState === "bearish" ? 1.05 : 1.01);
  const ema200 = seed.ema200 ?? seed.price * (trendState === "bullish" ? 0.86 : trendState === "bearish" ? 1.08 : 0.98);

  return {
    symbol: token.symbol,
    source: "mock",
    quote: {
      price: seed.price,
      percentChange24h: seed.percentChange24h,
      volume24h: seed.volume24h,
      marketCap: seed.marketCap,
      lastUpdated: new Date().toISOString(),
    },
    technicals: {
      ema20,
      ema50,
      ema200,
      rsi14: seed.rsi14 ?? (trendState === "bullish" ? 58 : trendState === "bearish" ? 42 : 50),
      atr14: seed.atr14 ?? seed.price * 0.045,
      support: seed.support ?? seed.price * 0.94,
      resistance: seed.resistance ?? seed.price * 1.07,
      trendState,
      closePosition: seed.closePosition ?? "range",
    },
    sentiment: {
      score: seed.sentimentScore ?? 0,
      label: sentimentLabel,
      newsBias: seed.newsBias ?? "Estimated news bias; not live data.",
      communityBias: seed.communityBias ?? "Estimated community bias; not live data.",
    },
    orderBook: {
      bidAskSpreadPercent: seed.bidAskSpreadPercent ?? 0.14,
      buyPressure: seed.buyPressure ?? 50,
      sellPressure: seed.sellPressure ?? 50,
      liquidityScore: seed.liquidityScore ?? 60,
    },
    derivatives: {
      fundingBias: seed.fundingBias ?? "neutral",
      openInterestChange24h: seed.openInterestChange24h ?? 0,
      longShortBias: seed.longShortBias ?? "neutral",
    },
  };
}

export function getMockMarketContext(symbol: string): MarketContext | undefined {
  const normalizedSymbol = symbol.trim();
  const token = eligibleTokenUniverse.find((item) => item.symbol.toLowerCase() === normalizedSymbol.toLowerCase());

  if (!token) {
    return undefined;
  }

  return createContext(token, {
    ...fallbackSeed(token),
    ...scenarioSeeds[token.symbol],
  });
}

export function getMockQuote(symbol: string): MarketQuote | undefined {
  const context = getMockMarketContext(symbol);

  if (!context) {
    return undefined;
  }

  return {
    symbol: context.symbol,
    price: context.quote.price,
    percentChange24h: context.quote.percentChange24h,
    volume24h: context.quote.volume24h,
    marketCap: context.quote.marketCap,
    lastUpdated: context.quote.lastUpdated,
    source: context.source,
  };
}
