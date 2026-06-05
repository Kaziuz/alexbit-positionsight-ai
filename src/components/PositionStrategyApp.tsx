"use client";

import { Activity, BarChart3, Braces, Download, ShieldCheck, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { eligibleTokens } from "@/data/eligible-tokens";
import { formatCompact, formatCurrency, formatPercentage } from "@/lib/format";
import { generateStrategySpec } from "@/lib/strategy-engine";
import type { MarketQuote, PositionInput, StrategySpec, Timeframe } from "@/types/strategy";
import { MetricTile } from "./MetricTile";
import { PricePositionChart } from "./PricePositionChart";

const timeframes: Timeframe[] = ["15m", "1h", "4h", "1d"];

const initialPosition: PositionInput = {
  symbol: "AVAX",
  entryPrice: 34,
  positionSize: 2,
  timeframe: "4h",
  maxRiskPercentage: 3,
};

function parsePositiveNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getStrategyLabel(strategyType: StrategySpec["strategyType"]) {
  return strategyType
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function PositionStrategyApp() {
  const [position, setPosition] = useState<PositionInput>(initialPosition);
  const [quote, setQuote] = useState<MarketQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function fetchQuote() {
      setIsLoadingQuote(true);
      setQuoteError(null);

      try {
        const response = await fetch(`/api/market?symbol=${position.symbol}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Market quote is unavailable.");
        }

        const data = (await response.json()) as MarketQuote;

        if (isActive) {
          setQuote(data);
        }
      } catch (error) {
        if (isActive) {
          setQuoteError(error instanceof Error ? error.message : "Market quote is unavailable.");
          setQuote(null);
        }
      } finally {
        if (isActive) {
          setIsLoadingQuote(false);
        }
      }
    }

    fetchQuote();

    return () => {
      isActive = false;
    };
  }, [position.symbol]);

  const strategy = useMemo(() => {
    if (!quote) {
      return null;
    }

    return generateStrategySpec(position, quote);
  }, [position, quote]);

  const selectedToken = eligibleTokens.find((token) => token.symbol === position.symbol) ?? eligibleTokens[0];
  const pnlPercentage = quote ? ((quote.price - position.entryPrice) / position.entryPrice) * 100 : 0;
  const pnlAmount = quote ? (quote.price - position.entryPrice) * position.positionSize : 0;
  const positionValue = quote ? quote.price * position.positionSize : 0;
  const strategyJson = strategy ? JSON.stringify(strategy, null, 2) : "";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-800">
            <Activity className="h-3.5 w-3.5" />
            CoinMarketCap Strategy Skill MVP
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-ink sm:text-4xl">
            PositionSight AI
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Visual position intelligence for eligible crypto assets, with mock market data today
            and a server-only CoinMarketCap integration path next.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[540px]">
          <MetricTile label="Selected asset" value={`${selectedToken.symbol} / USD`} />
          <MetricTile
            label="Source"
            value={!quote || quote.source === "mock" ? "Mock data" : "CMC"}
          />
          <MetricTile
            label="24h move"
            value={quote ? formatPercentage(quote.percentChange24h) : "--"}
            tone={quote && quote.percentChange24h < 0 ? "negative" : "positive"}
          />
          <MetricTile
            label="P/L"
            value={quote ? `${formatPercentage(pnlPercentage)} ${formatCurrency(pnlAmount)}` : "--"}
            tone={pnlAmount < 0 ? "negative" : "positive"}
          />
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 text-lg font-semibold text-ink">
            <WalletCards className="h-5 w-5 text-sky-700" />
            Position input
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Eligible token</span>
              <select
                value={position.symbol}
                onChange={(event) =>
                  setPosition((current) => ({
                    ...current,
                    symbol: event.target.value,
                  }))
                }
                className="mt-1 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              >
                {eligibleTokens.map((token) => (
                  <option key={token.id} value={token.symbol}>
                    {token.symbol} - {token.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Entry price</span>
              <input
                type="number"
                min="0"
                step="any"
                value={position.entryPrice}
                onChange={(event) =>
                  setPosition((current) => ({
                    ...current,
                    entryPrice: parsePositiveNumber(event.target.value, current.entryPrice),
                  }))
                }
                className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Position size</span>
              <input
                type="number"
                min="0"
                step="any"
                value={position.positionSize}
                onChange={(event) =>
                  setPosition((current) => ({
                    ...current,
                    positionSize: parsePositiveNumber(event.target.value, current.positionSize),
                  }))
                }
                className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <div>
              <span className="text-sm font-medium text-slate-700">Timeframe</span>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {timeframes.map((timeframe) => (
                  <button
                    key={timeframe}
                    type="button"
                    onClick={() => setPosition((current) => ({ ...current, timeframe }))}
                    className={`h-10 rounded-md border text-sm font-semibold transition ${
                      position.timeframe === timeframe
                        ? "border-sky-700 bg-sky-700 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {timeframe}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="flex items-center justify-between text-sm font-medium text-slate-700">
                <span>Max risk percentage</span>
                <span className="font-semibold text-slate-950">{position.maxRiskPercentage}%</span>
              </span>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={position.maxRiskPercentage}
                onChange={(event) =>
                  setPosition((current) => ({
                    ...current,
                    maxRiskPercentage: Number(event.target.value),
                  }))
                }
                className="mt-3 w-full accent-sky-700"
              />
            </label>
          </div>

          <div className="mt-5 rounded-md border border-slate-200 bg-panel p-4 text-sm text-slate-600">
            <div className="font-semibold text-slate-900">{selectedToken.name}</div>
            <div className="mt-1">
              Category: {selectedToken.category}. Current MVP uses deterministic mock quotes for
              local demo reliability.
            </div>
          </div>
        </form>

        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-lg font-semibold text-ink">
                <BarChart3 className="h-5 w-5 text-positive" />
                Entry vs current price
              </div>
              <div className="text-sm text-slate-500">
                {isLoadingQuote ? "Loading mock quote..." : quoteError ?? "Quote ready"}
              </div>
            </div>

            {quote && strategy ? (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricTile label="Current price" value={formatCurrency(quote.price, quote.price < 1 ? 6 : 2)} />
                  <MetricTile label="Entry price" value={formatCurrency(position.entryPrice, quote.price < 1 ? 6 : 2)} />
                  <MetricTile label="Position value" value={formatCurrency(positionValue)} />
                  <MetricTile
                    label="Market cap"
                    value={quote.marketCap ? formatCompact(quote.marketCap) : "Unavailable"}
                  />
                </div>
                <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <PricePositionChart position={position} quote={quote} strategy={strategy} />
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {quoteError ?? "Loading mock market data."}
              </div>
            )}
          </section>

          {strategy && quote ? (
            <section className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
                <div className="flex items-center gap-2 text-lg font-semibold text-ink">
                  <ShieldCheck className="h-5 w-5 text-sky-700" />
                  Strategy signal
                </div>
                <div className="mt-4 rounded-md border border-slate-200 bg-panel p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Strategy type
                  </div>
                  <div className="mt-1 text-xl font-semibold text-slate-950">
                    {getStrategyLabel(strategy.strategyType)}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <MetricTile label="Stop loss" value={formatCurrency(strategy.stopLoss, quote.price < 1 ? 6 : 2)} tone="negative" />
                  <MetricTile label="Take profit" value={formatCurrency(strategy.takeProfit, quote.price < 1 ? 6 : 2)} tone="positive" />
                  <MetricTile
                    label="Estimated risk"
                    value={formatCurrency(strategy.riskRules.estimatedRiskAmount)}
                    tone={strategy.strategyType === "no_trade" ? "warning" : "default"}
                  />
                </div>
                <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-950">Entry condition:</span>{" "}
                    {strategy.entryCondition}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-950">Exit condition:</span>{" "}
                    {strategy.exitCondition}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-lg font-semibold text-ink">
                    <Braces className="h-5 w-5 text-slate-700" />
                    Backtest-ready JSON
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([strategyJson], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const anchor = document.createElement("a");
                      anchor.href = url;
                      anchor.download = `${position.symbol.toLowerCase()}-${position.timeframe}-strategy.json`;
                      anchor.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    <Download className="h-4 w-4" />
                    Export JSON
                  </button>
                </div>
                <pre className="mt-4 max-h-[390px] overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                  {strategyJson}
                </pre>
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}
