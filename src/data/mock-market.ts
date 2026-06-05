import type { MarketQuote } from "@/types/strategy";

const mockQuotes: Record<string, Omit<MarketQuote, "lastUpdated" | "source">> = {
  ETH: {
    symbol: "ETH",
    price: 3550.74,
    percentChange24h: 0.94,
    volume24h: 16840000000,
    marketCap: 426900000000,
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
  AAVE: {
    symbol: "AAVE",
    price: 287.42,
    percentChange24h: 1.74,
    volume24h: 386000000,
    marketCap: 4340000000,
  },
  ATOM: {
    symbol: "ATOM",
    price: 6.84,
    percentChange24h: -0.62,
    volume24h: 164000000,
    marketCap: 2670000000,
  },
  FIL: {
    symbol: "FIL",
    price: 4.72,
    percentChange24h: -1.48,
    volume24h: 214000000,
    marketCap: 2960000000,
  },
  INJ: {
    symbol: "INJ",
    price: 28.16,
    percentChange24h: 3.35,
    volume24h: 228000000,
    marketCap: 2770000000,
  },
  CAKE: {
    symbol: "CAKE",
    price: 2.91,
    percentChange24h: 2.06,
    volume24h: 74000000,
    marketCap: 848000000,
  },
  TWT: {
    symbol: "TWT",
    price: 1.13,
    percentChange24h: 0.78,
    volume24h: 27000000,
    marketCap: 471000000,
  },
  FET: {
    symbol: "FET",
    price: 1.42,
    percentChange24h: 2.91,
    volume24h: 182000000,
    marketCap: 3600000000,
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
