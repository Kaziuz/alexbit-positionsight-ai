import { NextResponse } from "next/server";
import { isPositionSightStrategyExport, runPaperBacktest } from "@/lib/backtest";
import type { PaperBacktestCandle, StrategyExport, StrategyTimeframe } from "@/types/strategy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const binanceMarketDataEndpoint = "https://data-api.binance.vision/api/v3/klines";

const symbolToUsdtPair: Record<string, string> = {
  ADA: "ADAUSDT",
  AVAX: "AVAXUSDT",
  ETH: "ETHUSDT",
  BNB: "BNBUSDT",
  LINK: "LINKUSDT",
  CAKE: "CAKEUSDT",
  TWT: "TWTUSDT",
  AAVE: "AAVEUSDT",
  UNI: "UNIUSDT",
  ATOM: "ATOMUSDT",
  FIL: "FILUSDT",
  TRX: "TRXUSDT",
  XRP: "XRPUSDT",
  BCH: "BCHUSDT",
  LTC: "LTCUSDT",
  DOT: "DOTUSDT",
};

const timeframeToBinanceInterval: Record<StrategyTimeframe, string> = {
  "15m": "15m",
  "30m": "30m",
  "1h": "1h",
  "1d": "1d",
  "1w": "1w",
  "1mo": "1M",
};

function getKlineLimit(timeframe: StrategyTimeframe) {
  if (timeframe === "15m" || timeframe === "30m" || timeframe === "1h") {
    return 300;
  }

  if (timeframe === "1d") {
    return 240;
  }

  return 160;
}

function parseNumber(value: unknown) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function parseBinanceKlines(payload: unknown): PaperBacktestCandle[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item): PaperBacktestCandle | null => {
      if (!Array.isArray(item) || item.length < 7) {
        return null;
      }

      const openTime = new Date(parseNumber(item[0]));
      const closeTime = new Date(parseNumber(item[6]));

      if (Number.isNaN(openTime.getTime()) || Number.isNaN(closeTime.getTime())) {
        return null;
      }

      return {
        openTime: openTime.toISOString(),
        open: parseNumber(item[1]),
        high: parseNumber(item[2]),
        low: parseNumber(item[3]),
        close: parseNumber(item[4]),
        volume: parseNumber(item[5]),
        closeTime: closeTime.toISOString(),
      };
    })
    .filter((candle): candle is PaperBacktestCandle => candle !== null && candle.high > 0 && candle.low > 0);
}

async function readStrategyExport(request: Request): Promise<unknown> {
  const body = await request.json();

  if (typeof body === "string") {
    return JSON.parse(body);
  }

  if (body && typeof body === "object" && "strategyJson" in body && typeof body.strategyJson === "string") {
    return JSON.parse(body.strategyJson);
  }

  if (body && typeof body === "object" && "strategy" in body) {
    return body.strategy;
  }

  return body;
}

async function getBinanceCandles(strategyExport: StrategyExport, pairUsed: string) {
  const timeframe = strategyExport.strategyTimeframe ?? strategyExport.strategySpec.strategyTimeframe;
  const interval = timeframeToBinanceInterval[timeframe];
  const limit = getKlineLimit(timeframe);
  const params = new URLSearchParams({
    symbol: pairUsed,
    interval,
    limit: String(limit),
  });
  const response = await fetch(`${binanceMarketDataEndpoint}?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Binance public klines returned ${response.status}.`);
  }

  return parseBinanceKlines(await response.json());
}

export async function POST(request: Request) {
  let strategyExport: unknown;

  try {
    strategyExport = await readStrategyExport(request);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isPositionSightStrategyExport(strategyExport)) {
    return NextResponse.json(
      { error: "This does not look like a valid PositionSight strategy JSON." },
      { status: 400 },
    );
  }

  const symbol = strategyExport.symbol?.toUpperCase() ?? strategyExport.strategySpec.asset.toUpperCase();
  const mappedPair = symbolToUsdtPair[symbol];

  if (!mappedPair) {
    const result = runPaperBacktest({
      strategyExport,
      dataSource: "demo_fallback",
      pairUsed: "DEMO-USDT",
      fallbackReason: `No Binance USDT pair mapping is configured for ${symbol}.`,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  try {
    const candles = await getBinanceCandles(strategyExport, mappedPair);

    if (!candles.length) {
      throw new Error("Binance public klines returned no usable candles.");
    }

    const result = runPaperBacktest({
      strategyExport,
      candles,
      dataSource: "binance_public_klines",
      pairUsed: mappedPair,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const result = runPaperBacktest({
      strategyExport,
      dataSource: "demo_fallback",
      pairUsed: mappedPair,
      fallbackReason: error instanceof Error ? error.message : "Binance public klines were unavailable.",
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }
}
