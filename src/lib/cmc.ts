import { getMockMarketContext } from "@/data/mock-market";
import { calculateTechnicalIndicators } from "@/lib/indicators";
import type { HistoryResponse, MarketContext, OhlcvCandle, StrategyTimeframe } from "@/types/strategy";

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
      "Latest quote is live from CoinMarketCap. Chart path and indicators are estimated until historical OHLCV is available on the current plan.",
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
      "Latest quote is live from CoinMarketCap. Chart path and indicators are estimated until historical OHLCV is available on the current plan.",
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

type FetchCmcOhlcvHistoricalParams = {
  symbol: string;
  cmcId?: number;
  timeframe: StrategyTimeframe;
  debug?: boolean;
};

type CmcHistoricalQuote = {
  time_open?: string;
  time_close?: string;
  timestamp?: string;
  quote?: {
    USD?: {
      open?: number;
      high?: number;
      low?: number;
      close?: number;
      volume?: number;
      timestamp?: string;
    };
  };
};

function getHistoryLookbackDays(timeframe: StrategyTimeframe) {
  if (timeframe === "15m" || timeframe === "30m" || timeframe === "1h") {
    return 30;
  }

  if (timeframe === "1w") {
    return 420;
  }

  if (timeframe === "1mo") {
    return 900;
  }

  return 260;
}

function getPreferredHistoryIntervals(timeframe: StrategyTimeframe) {
  if (timeframe === "15m" || timeframe === "30m" || timeframe === "1h") {
    return ["hourly", "daily"] as const;
  }

  return ["daily"] as const;
}

function parseHistoricalCandles(payload: unknown): OhlcvCandle[] {
  const root = payload as {
    data?: { quotes?: CmcHistoricalQuote[] } | Array<{ quotes?: CmcHistoricalQuote[] }>;
  };
  const data = Array.isArray(root.data) ? root.data[0] : root.data;
  const quotes = data?.quotes;

  if (!Array.isArray(quotes)) {
    return [];
  }

  return quotes
    .map((item) => {
      const usd = item.quote?.USD;

      if (!usd) {
        return null;
      }

      const open = usd.open;
      const high = usd.high;
      const low = usd.low;
      const close = usd.close;
      const volume = usd.volume;

      if (
        typeof open !== "number" ||
        typeof high !== "number" ||
        typeof low !== "number" ||
        typeof close !== "number" ||
        typeof volume !== "number" ||
        !Number.isFinite(open) ||
        !Number.isFinite(high) ||
        !Number.isFinite(low) ||
        !Number.isFinite(close) ||
        !Number.isFinite(volume)
      ) {
        return null;
      }

      return {
        time: usd.timestamp ?? item.time_close ?? item.timestamp ?? item.time_open ?? new Date().toISOString(),
        open,
        high,
        low,
        close,
        volume,
      };
    })
    .filter((item): item is OhlcvCandle => item !== null);
}

function createEstimatedHistory(params: FetchCmcOhlcvHistoricalParams, fallbackReason: string): HistoryResponse {
  const mockContext = getMockMarketContext(params.symbol);
  const quote = mockContext?.quote;
  const price = quote?.price ?? 1;
  const now = new Date();
  const candles: OhlcvCandle[] = Array.from({ length: 60 }, (_, index) => {
    const distanceFromNow = 59 - index;
    const time = new Date(now);

    if (params.timeframe === "15m") {
      time.setMinutes(now.getMinutes() - distanceFromNow * 15);
    } else if (params.timeframe === "30m") {
      time.setMinutes(now.getMinutes() - distanceFromNow * 30);
    } else if (params.timeframe === "1h") {
      time.setHours(now.getHours() - distanceFromNow);
    } else {
      time.setDate(now.getDate() - distanceFromNow);
    }

    const drift = (index - 30) / 1200;
    const wave = Math.sin(index / 4) * 0.018;
    const close = index === 59 ? price : price * (1 + drift + wave);
    const open = close * (1 - Math.sin(index / 3) * 0.006);
    const high = Math.max(open, close) * 1.012;
    const low = Math.min(open, close) * 0.988;
    const volume = Math.max((quote?.volume24h ?? 1_000_000) / 24, 1);

    return {
      time: time.toISOString(),
      open,
      high,
      low,
      close,
      volume,
    };
  });
  const indicatorResult = calculateTechnicalIndicators(candles);

  return {
    symbol: params.symbol,
    source: "estimated",
    timeframe: params.timeframe,
    candles,
    indicators: indicatorResult.indicators,
    diagnostics: params.debug
      ? {
          hasCmcApiKey: Boolean(process.env.CMC_API_KEY),
          cmcId: params.cmcId,
          parsedLiveHistory: false,
          fallbackReason,
        }
      : undefined,
    warnings: [
      "Historical OHLCV is unavailable with the current CoinMarketCap response or plan; chart path is estimated from live quote context.",
      ...indicatorResult.warnings,
    ],
  };
}

export async function fetchCmcOhlcvHistorical(
  params: FetchCmcOhlcvHistoricalParams,
): Promise<HistoryResponse> {
  const apiKey = process.env.CMC_API_KEY;
  const baseUrl = process.env.CMC_API_BASE_URL ?? "https://pro-api.coinmarketcap.com";
  const symbol = params.symbol.trim().toUpperCase();

  if (!apiKey) {
    return createEstimatedHistory({ ...params, symbol }, "CMC_API_KEY is not configured.");
  }

  const timeEnd = new Date();
  const timeStart = new Date(timeEnd);
  timeStart.setDate(timeEnd.getDate() - getHistoryLookbackDays(params.timeframe));

  for (const interval of getPreferredHistoryIntervals(params.timeframe)) {
    const searchParams = new URLSearchParams({
      convert: "USD",
      time_start: timeStart.toISOString(),
      time_end: timeEnd.toISOString(),
      interval,
    });

    if (params.cmcId) {
      searchParams.set("id", String(params.cmcId));
    } else {
      searchParams.set("symbol", symbol);
    }

    let response: Response;
    let payload: unknown;

    try {
      response = await fetch(`${baseUrl}/v2/cryptocurrency/ohlcv/historical?${searchParams.toString()}`, {
        cache: "no-store",
        headers: {
          "X-CMC_PRO_API_KEY": apiKey,
          Accept: "application/json",
        },
      });
      payload = (await response.json().catch(() => ({}))) as unknown;
    } catch {
      if (interval === "daily") {
        return createEstimatedHistory(
          { ...params, symbol },
          "CoinMarketCap historical OHLCV request failed before a response was returned.",
        );
      }

      continue;
    }

    if (!response.ok) {
      if (interval === "daily") {
        return createEstimatedHistory(
          { ...params, symbol },
          `CoinMarketCap historical OHLCV request failed with status ${response.status}.`,
        );
      }

      continue;
    }

    const candles = parseHistoricalCandles(payload);

    if (candles.length > 0) {
      const indicatorResult = calculateTechnicalIndicators(candles);

      return {
        symbol,
        source: "coinmarketcap",
        timeframe: params.timeframe,
        candles,
        indicators: indicatorResult.indicators,
        diagnostics: params.debug
          ? {
              hasCmcApiKey: true,
              cmcId: params.cmcId,
              cmcStatus: response.status,
              parsedLiveHistory: true,
            }
          : undefined,
        warnings: indicatorResult.warnings,
      };
    }
  }

  return createEstimatedHistory(
    { ...params, symbol },
    "CoinMarketCap historical OHLCV response did not include parseable candles.",
  );
}
