import type { MarketQuote } from "@/types/strategy";

const mockQuotes: Record<string, Omit<MarketQuote, "lastUpdated" | "source">> = {
  BTC: {
    symbol: "BTC",
    price: 68150.2,
    percentChange24h: 1.82,
    volume24h: 34850000000,
    marketCap: 1342000000000,
  },
  ETH: {
    symbol: "ETH",
    price: 3550.74,
    percentChange24h: 0.94,
    volume24h: 16840000000,
    marketCap: 426900000000,
  },
  BNB: {
    symbol: "BNB",
    price: 612.36,
    percentChange24h: -0.48,
    volume24h: 1680000000,
    marketCap: 94000000000,
  },
  SOL: {
    symbol: "SOL",
    price: 151.82,
    percentChange24h: 3.21,
    volume24h: 4140000000,
    marketCap: 70300000000,
  },
  ARB: {
    symbol: "ARB",
    price: 1.08,
    percentChange24h: -1.12,
    volume24h: 340000000,
    marketCap: 3200000000,
  },
  MATIC: {
    symbol: "MATIC",
    price: 0.72,
    percentChange24h: 0.36,
    volume24h: 287000000,
    marketCap: 7130000000,
  },
  LINK: {
    symbol: "LINK",
    price: 17.44,
    percentChange24h: 2.14,
    volume24h: 658000000,
    marketCap: 10200000000,
  },
  AVAX: {
    symbol: "AVAX",
    price: 35.62,
    percentChange24h: -2.78,
    volume24h: 525000000,
    marketCap: 13900000000,
  },
  UNI: {
    symbol: "UNI",
    price: 9.38,
    percentChange24h: 1.33,
    volume24h: 174000000,
    marketCap: 5600000000,
  },
  DOGE: {
    symbol: "DOGE",
    price: 0.148,
    percentChange24h: 4.56,
    volume24h: 1260000000,
    marketCap: 21400000000,
  },
  SHIB: {
    symbol: "SHIB",
    price: 0.000024,
    percentChange24h: -0.82,
    volume24h: 412000000,
    marketCap: 14100000000,
  },
  NEAR: {
    symbol: "NEAR",
    price: 6.2,
    percentChange24h: 2.68,
    volume24h: 381000000,
    marketCap: 6700000000,
  },
};

export function getMockQuote(symbol: string): MarketQuote | undefined {
  const quote = mockQuotes[symbol.toUpperCase()];

  if (!quote) {
    return undefined;
  }

  return {
    ...quote,
    lastUpdated: new Date().toISOString(),
    source: "mock",
  };
}
