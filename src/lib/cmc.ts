import { getMockMarketContext } from "@/data/mock-market";
import type { MarketContext } from "@/types/strategy";

type FetchCmcLatestQuoteInput = {
  symbol: string;
  cmcId?: number;
};

type CmcDiagnostics = NonNullable<MarketContext["diagnostics"]>;

type CmcQuoteUsd = {
  name?: string;
  symbol?: string;
  currency?: string;
  price?: number;
  volume_24h?: number;
  volume24h?: number;
  percent_change_24h?: number;
  percentChange24h?: number;
  market_cap?: number;
  marketCap?: number;
  last_updated?: string;
  lastUpdated?: string;
};

type CmcAssetQuote = {
  id?: number;
  symbol?: string;
  last_updated?: string;
  lastUpdated?: string;
  quote?:
    | {
        USD?: CmcQuoteUsd;
      }
    | CmcQuoteUsd[];
  quotes?: CmcQuoteUsd[];
};

type CmcQuotesLatestResponse = {
  data?: Record<string, CmcAssetQuote> | CmcAssetQuote[];
  status?: {
    error_code?: string | number;
    error_message?: string;
  };
};

export class CmcQuoteError extends Error {
  diagnostics: CmcDiagnostics;

  constructor(message: string, diagnostics: CmcDiagnostics) {
    super(message);
    this.name = "CmcQuoteError";
    this.diagnostics = diagnostics;
  }
}

function getCmcBaseUrl() {
  return (process.env.CMC_API_BASE_URL || "https://pro-api.coinmarketcap.com").replace(/\/$/, "");
}

function isUsdQuote(quote: CmcQuoteUsd) {
  return [quote.name, quote.symbol, quote.currency].some((value) => value?.toUpperCase() === "USD");
}

function getUsdQuote(asset: CmcAssetQuote | undefined): CmcQuoteUsd | undefined {
  if (!asset) {
    return undefined;
  }

  if (Array.isArray(asset.quote)) {
    return asset.quote.find(isUsdQuote) ?? asset.quote[0];
  }

  if (asset.quote?.USD) {
    return asset.quote.USD;
  }

  if (Array.isArray(asset.quotes)) {
    return asset.quotes.find(isUsdQuote) ?? asset.quotes[0];
  }

  return undefined;
}

function hasUsableUsdQuote(asset: CmcAssetQuote | undefined): asset is CmcAssetQuote {
  return Boolean(getUsdQuote(asset));
}

function getQuoteCandidates(data: CmcQuotesLatestResponse["data"], symbol: string, cmcId?: number) {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    const exactMatch = data.find((item) => (cmcId ? item.id === cmcId : item.symbol?.toUpperCase() === symbol.toUpperCase()));
    return [exactMatch, ...data].filter(Boolean) as CmcAssetQuote[];
  }

  const candidates: Array<CmcAssetQuote | undefined> = [];

  if (cmcId && data[String(cmcId)]) {
    candidates.push(data[String(cmcId)]);
  }

  if (data[symbol.toUpperCase()]) {
    candidates.push(data[symbol.toUpperCase()]);
  }

  candidates.push(...Object.values(data));

  return candidates.filter(Boolean) as CmcAssetQuote[];
}

function getFirstAsset(data: CmcQuotesLatestResponse["data"], symbol: string, cmcId?: number) {
  return getQuoteCandidates(data, symbol, cmcId).find(hasUsableUsdQuote);
}

function assertFiniteNumber(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`CoinMarketCap response is missing ${fieldName}.`);
  }

  return value;
}

function firstDefined<T>(...values: Array<T | undefined>) {
  return values.find((value) => value !== undefined);
}

function isCmcErrorCode(value: unknown) {
  return value !== undefined && value !== null && String(value) !== "0";
}

function createNeutralProxyContext(symbol: string, quote: MarketContext["quote"]): MarketContext {
  const price = quote.price;

  return {
    symbol,
    source: "coinmarketcap",
    warnings: [
      "CoinMarketCap latest quote is live. Some advanced context fields are estimated until historical OHLCV is added.",
    ],
    quote,
    technicals: {
      ema20: price,
      ema50: price,
      ema200: price,
      rsi14: 50,
      atr14: price * 0.04,
      support: price * 0.94,
      resistance: price * 1.06,
      trendState: "neutral",
      closePosition: "range",
    },
    sentiment: {
      score: 0,
      label: "neutral",
      newsBias: "Unavailable from latest quote endpoint; treated as a neutral estimate.",
      communityBias: "Unavailable from latest quote endpoint; treated as a neutral estimate.",
    },
    orderBook: {
      bidAskSpreadPercent: 0,
      buyPressure: 50,
      sellPressure: 50,
      liquidityScore: 60,
    },
    derivatives: {
      fundingBias: "unavailable",
      openInterestChange24h: 0,
      longShortBias: "unavailable",
    },
  };
}

function normalizeCmcAsset(symbol: string, asset: CmcAssetQuote): MarketContext {
  const usdQuote = getUsdQuote(asset);

  if (!usdQuote) {
    throw new Error("CoinMarketCap response is missing USD quote data.");
  }

  const quote: MarketContext["quote"] = {
    price: assertFiniteNumber(usdQuote.price, "price"),
    percentChange24h: assertFiniteNumber(
      firstDefined(usdQuote.percent_change_24h, usdQuote.percentChange24h),
      "percent_change_24h",
    ),
    volume24h: assertFiniteNumber(firstDefined(usdQuote.volume_24h, usdQuote.volume24h), "volume_24h"),
    marketCap:
      typeof firstDefined(usdQuote.market_cap, usdQuote.marketCap) === "number" &&
      Number.isFinite(firstDefined(usdQuote.market_cap, usdQuote.marketCap))
        ? firstDefined(usdQuote.market_cap, usdQuote.marketCap)
        : undefined,
    lastUpdated: usdQuote.last_updated ?? usdQuote.lastUpdated ?? asset.last_updated ?? asset.lastUpdated ?? new Date().toISOString(),
  };
  const mockContext = getMockMarketContext(symbol);

  if (!mockContext) {
    return createNeutralProxyContext(symbol, quote);
  }

  return {
    ...mockContext,
    symbol: mockContext.symbol,
    source: "coinmarketcap",
    warnings: [
      "CoinMarketCap latest quote is live. Some advanced context fields are estimated until historical OHLCV is added.",
    ],
    quote,
  };
}

export async function fetchCmcLatestQuote(input: FetchCmcLatestQuoteInput): Promise<MarketContext> {
  const apiKey = process.env.CMC_API_KEY;
  const symbol = input.symbol.trim().toUpperCase();
  const diagnostics: CmcDiagnostics = {
    hasCmcApiKey: Boolean(apiKey),
    cmcRequestMode: input.cmcId ? "id" : "symbol",
    cmcId: input.cmcId,
  };

  if (!apiKey) {
    throw new CmcQuoteError("CMC_API_KEY is not configured.", {
      ...diagnostics,
      cmcErrorMessage: "CMC_API_KEY is not configured.",
    });
  }

  const url = new URL("/v3/cryptocurrency/quotes/latest", getCmcBaseUrl());

  if (input.cmcId) {
    url.searchParams.set("id", String(input.cmcId));
  } else {
    url.searchParams.set("symbol", symbol);
  }

  url.searchParams.set("convert", "USD");

  const response = await fetch(url, {
    headers: {
      "X-CMC_PRO_API_KEY": apiKey,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  diagnostics.cmcStatus = response.status;

  if (!response.ok) {
    let cmcErrorCode: string | number | undefined;
    let cmcErrorMessage: string | undefined;
    const errorText = await response.text();

    try {
      const errorPayload = JSON.parse(errorText) as CmcQuotesLatestResponse;
      cmcErrorCode = errorPayload.status?.error_code;
      cmcErrorMessage = errorPayload.status?.error_message;
    } catch {
      cmcErrorMessage = errorText.slice(0, 180);
    }

    throw new CmcQuoteError(`CoinMarketCap request failed with ${response.status}.`, {
      ...diagnostics,
      cmcErrorCode,
      cmcErrorMessage,
    });
  }

  const payload = (await response.json()) as CmcQuotesLatestResponse;
  const status = payload.status;

  if (isCmcErrorCode(status?.error_code)) {
    throw new CmcQuoteError(status?.error_message ?? "CoinMarketCap returned an error.", {
      ...diagnostics,
      cmcErrorCode: status?.error_code,
      cmcErrorMessage: status?.error_message,
    });
  }

  const asset = getFirstAsset(payload.data, symbol, input.cmcId);

  if (!asset) {
    throw new CmcQuoteError("CoinMarketCap response did not include a valid USD quote for the requested token.", {
      ...diagnostics,
      parserError: "No valid quote.USD object found in array, id-keyed object, or symbol-keyed object response.",
    });
  }

  try {
    return {
      ...normalizeCmcAsset(symbol, asset),
      diagnostics: {
        ...diagnostics,
        parsedLiveQuote: true,
      },
    };
  } catch (error) {
    throw new CmcQuoteError(error instanceof Error ? error.message : "Unable to parse CoinMarketCap quote.", {
      ...diagnostics,
      parserError: error instanceof Error ? error.message : "Unable to parse CoinMarketCap quote.",
    });
  }
}
