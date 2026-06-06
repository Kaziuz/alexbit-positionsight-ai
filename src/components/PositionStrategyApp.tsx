"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Braces,
  Download,
  Info,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { beginnerTokenSet, eligibleTokenUniverse, eligibleTokensByCategory } from "@/data/eligible-tokens";
import { formatCompact, formatCurrency, formatPercentage } from "@/lib/format";
import { parseLocalizedNumberInput } from "@/lib/number-input";
import { createStrategyExport } from "@/lib/strategy-export";
import { generateStrategyDecision } from "@/lib/strategy-engine";
import type {
  MarketContext,
  MarketQuote,
  PositionInput,
  StrategyDecision,
  StrategyMode,
  Timeframe,
} from "@/types/strategy";
import { MetricTile } from "./MetricTile";
import { PricePositionChart } from "./PricePositionChart";

const timeframes: Timeframe[] = ["15m", "1h", "4h", "1d"];
const minRiskPercentage = 1;
const maxRiskPercentage = 6;

const strategyModes: Array<{ value: StrategyMode; label: string }> = [
  { value: "auto", label: "Auto Recommended" },
  { value: "trend_confirmation", label: "Trend Confirmation" },
  { value: "breakout_retest", label: "Breakout + Retest" },
  { value: "defensive_rebound", label: "Defensive Rebound" },
  { value: "risk_check", label: "Risk Check / No-Trade" },
];

const initialPosition: PositionInput = {
  symbol: "AVAX",
  entryPrice: 34,
  positionSize: 2,
  timeframe: "4h",
  maxRiskPercentage: 3,
  strategyMode: "auto",
};

function clampRiskPercentage(value: number) {
  return Math.min(Math.max(value, minRiskPercentage), maxRiskPercentage);
}

function getStrategyLabel(strategyType: StrategyDecision["spec"]["strategyType"]) {
  const labels = {
    trend_following_pullback: "Trend Confirmation",
    breakout_with_volume: "Breakout + Retest",
    defensive_mean_reversion: "Defensive Rebound",
    no_trade: "Risk Check / No-Trade",
  };

  return labels[strategyType];
}

function getQuoteFromContext(context: MarketContext): MarketQuote {
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

function getFitTone(fit: StrategyDecision["fit"]) {
  if (fit === "good") {
    return "positive";
  }

  if (fit === "poor") {
    return "negative";
  }

  return "warning";
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={text}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:bg-slate-100 focus:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      <span className="pointer-events-none absolute left-1/2 top-6 z-20 hidden w-64 -translate-x-1/2 rounded-md border border-slate-200 bg-white p-3 text-xs font-normal leading-5 text-slate-700 shadow-soft group-hover:block group-focus-within:block">
        {text}
      </span>
    </span>
  );
}

function LabelWithInfo({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <InfoTooltip text={tooltip} />
    </span>
  );
}

export function PositionStrategyApp() {
  const [position, setPosition] = useState<PositionInput>(initialPosition);
  const [entryPriceInput, setEntryPriceInput] = useState(String(initialPosition.entryPrice));
  const [positionSizeInput, setPositionSizeInput] = useState(String(initialPosition.positionSize));
  const [tokenMode, setTokenMode] = useState<"beginner" | "advanced">("beginner");
  const [marketContext, setMarketContext] = useState<MarketContext | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);

  const availableTokens = tokenMode === "beginner" ? beginnerTokenSet : eligibleTokenUniverse;
  const selectedToken =
    eligibleTokenUniverse.find((token) => token.symbol === position.symbol) ?? eligibleTokenUniverse[0];
  const quote = marketContext ? getQuoteFromContext(marketContext) : null;
  const parsedEntryPrice = useMemo(() => parseLocalizedNumberInput(entryPriceInput), [entryPriceInput]);
  const parsedPositionSize = useMemo(() => parseLocalizedNumberInput(positionSizeInput), [positionSizeInput]);
  const normalizedPosition = useMemo<PositionInput | null>(() => {
    if (!parsedEntryPrice.ok || !parsedPositionSize.ok) {
      return null;
    }

    return {
      ...position,
      entryPrice: parsedEntryPrice.value,
      positionSize: parsedPositionSize.value,
    };
  }, [parsedEntryPrice, parsedPositionSize, position]);

  const validationMessages = useMemo(() => {
    const messages: string[] = [];

    if (!parsedEntryPrice.ok) {
      messages.push(entryPriceInput.trim() ? parsedEntryPrice.error : "Entry price must be greater than 0.");
    } else if (parsedEntryPrice.value <= 0) {
      messages.push("Entry price must be greater than 0.");
    }

    if (!parsedPositionSize.ok) {
      messages.push(positionSizeInput.trim() ? parsedPositionSize.error : "Position size must be greater than 0.");
    } else if (parsedPositionSize.value <= 0) {
      messages.push("Position size must be greater than 0.");
    }

    if (
      !Number.isFinite(position.maxRiskPercentage) ||
      position.maxRiskPercentage < minRiskPercentage ||
      position.maxRiskPercentage > maxRiskPercentage
    ) {
      messages.push(`Max risk must stay between ${minRiskPercentage}% and ${maxRiskPercentage}%.`);
    }

    return messages;
  }, [entryPriceInput, parsedEntryPrice, parsedPositionSize, position.maxRiskPercentage, positionSizeInput]);
  const isPositionValid = validationMessages.length === 0;
  const entryDistanceWarning =
    quote && normalizedPosition
      ? Math.abs((quote.price - normalizedPosition.entryPrice) / normalizedPosition.entryPrice) > 0.5
      : false;
  const warningMessages = [
    ...(entryDistanceWarning
      ? ["Entry price is very far from current price. This may be an old position or a typo."]
      : []),
    ...(marketContext?.warnings ?? []),
  ];

  useEffect(() => {
    let isActive = true;

    async function fetchContext() {
      setIsLoadingContext(true);
      setContextError(null);

      try {
        const response = await fetch(`/api/market?symbol=${position.symbol}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Mock market context is unavailable.");
        }

        const data = (await response.json()) as MarketContext;

        if (isActive) {
          setMarketContext(data);
        }
      } catch (error) {
        if (isActive) {
          setContextError(error instanceof Error ? error.message : "Mock market context is unavailable.");
          setMarketContext(null);
        }
      } finally {
        if (isActive) {
          setIsLoadingContext(false);
        }
      }
    }

    fetchContext();

    return () => {
      isActive = false;
    };
  }, [position.symbol]);

  const strategyDecision = useMemo(() => {
    if (!marketContext || !normalizedPosition || !isPositionValid) {
      return null;
    }

    return generateStrategyDecision(normalizedPosition, marketContext, normalizedPosition.strategyMode ?? "auto");
  }, [isPositionValid, marketContext, normalizedPosition]);

  const strategy = strategyDecision?.spec ?? null;
  const pnlPercentage =
    quote && normalizedPosition && isPositionValid
      ? ((quote.price - normalizedPosition.entryPrice) / normalizedPosition.entryPrice) * 100
      : 0;
  const pnlAmount =
    quote && normalizedPosition && isPositionValid
      ? (quote.price - normalizedPosition.entryPrice) * normalizedPosition.positionSize
      : 0;
  const positionValue =
    quote && normalizedPosition && normalizedPosition.positionSize > 0 ? quote.price * normalizedPosition.positionSize : 0;
  const pricePrecision = quote && quote.price < 1 ? 6 : 2;
  const exportPayload =
    strategyDecision && marketContext && normalizedPosition
      ? createStrategyExport(normalizedPosition, strategyDecision, marketContext)
      : null;
  const strategyJson = exportPayload ? JSON.stringify(exportPayload, null, 2) : "";

  function updateTokenMode(nextMode: "beginner" | "advanced") {
    setTokenMode(nextMode);

    if (nextMode === "beginner" && !beginnerTokenSet.some((token) => token.symbol === position.symbol)) {
      setPosition((current) => ({ ...current, symbol: "AVAX" }));
    }
  }

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
            Beginner-friendly crypto position intelligence with mock CMC-ready market context,
            visual risk levels, and backtest-ready strategy exports.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:w-[860px] xl:grid-cols-6">
          <MetricTile label="Current price" value={quote ? formatCurrency(quote.price, pricePrecision) : "--"} />
          <MetricTile
            label="24h move"
            value={quote ? formatPercentage(quote.percentChange24h) : "--"}
            tone={quote && quote.percentChange24h < 0 ? "negative" : "positive"}
          />
          <MetricTile label="Volume 24h" value={quote ? formatCompact(quote.volume24h) : "--"} />
          <MetricTile label="Market cap" value={quote?.marketCap ? formatCompact(quote.marketCap) : "Unavailable"} />
          <MetricTile label="Source" value={!quote || quote.source === "mock" ? "Mock data fallback" : "CMC live quote"} />
          <MetricTile
            label="P/L"
            value={quote && isPositionValid ? `${formatPercentage(pnlPercentage)} ${formatCurrency(pnlAmount)}` : "--"}
            tone={pnlAmount < 0 ? "negative" : "positive"}
          />
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[390px_minmax(0,1fr)]">
        <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 text-lg font-semibold text-ink">
            <WalletCards className="h-5 w-5 text-sky-700" />
            Position input
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <LabelWithInfo
                label="Token list"
                tooltip="Beginner mode shows a shorter list; Advanced mode shows more hackathon-supported tokens."
              />
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
                {(["beginner", "advanced"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => updateTokenMode(mode)}
                    className={`h-9 rounded-md text-sm font-semibold capitalize transition ${
                      tokenMode === mode ? "bg-white text-sky-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <LabelWithInfo
                label="Eligible token"
                tooltip="Choose the crypto asset you want to analyze. Beginner mode shows a shorter list; Advanced mode shows more hackathon-supported tokens."
              />
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
                {tokenMode === "beginner"
                  ? availableTokens.map((token) => (
                      <option key={token.id} value={token.symbol}>
                        {token.symbol} - {token.name}
                      </option>
                    ))
                  : Object.entries(eligibleTokensByCategory).map(([category, tokens]) => (
                      <optgroup key={category} label={category}>
                        {tokens.map((token) => (
                          <option key={token.id} value={token.symbol}>
                            {token.symbol} - {token.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
              </select>
            </label>

            <label className="block">
              <LabelWithInfo
                label="Entry price"
                tooltip="The price where you bought, or the price where you are considering entering."
              />
              <input
                type="text"
                inputMode="decimal"
                value={entryPriceInput}
                onChange={(event) => setEntryPriceInput(event.target.value)}
                className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <label className="block">
              <LabelWithInfo
                label="Position size"
                tooltip="How many tokens or coins you hold or plan to buy. This is used to estimate risk."
              />
              <input
                type="text"
                inputMode="decimal"
                value={positionSizeInput}
                onChange={(event) => setPositionSizeInput(event.target.value)}
                className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <div>
              <LabelWithInfo
                label="Timeframe"
                tooltip="The chart context used for the strategy. Higher timeframes like 4h or 1d are usually more stable than 15m."
              />
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

            <div>
              <LabelWithInfo
                label="Strategy mode"
                tooltip="Auto lets PositionSight choose the most appropriate strategy. Manual mode lets you test a specific strategy and see whether it fits."
              />
              <div className="mt-2 grid gap-2">
                {strategyModes.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setPosition((current) => ({ ...current, strategyMode: mode.value }))}
                    className={`min-h-10 rounded-md border px-3 py-2 text-left text-sm font-semibold transition ${
                      (position.strategyMode ?? "auto") === mode.value
                        ? "border-sky-700 bg-sky-50 text-sky-800"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
                <span className="inline-flex items-center gap-1.5">
                  <span>Max risk percentage</span>
                  <InfoTooltip text="The maximum percentage of the entry price you are willing to risk if the setup fails." />
                </span>
                <span className="font-semibold text-slate-950">{position.maxRiskPercentage}%</span>
              </span>
              <input
                type="range"
                min={minRiskPercentage}
                max={maxRiskPercentage}
                step="0.5"
                value={position.maxRiskPercentage}
                onChange={(event) =>
                  setPosition((current) => ({
                    ...current,
                    maxRiskPercentage: clampRiskPercentage(Number(event.target.value)),
                  }))
                }
                className="mt-3 w-full accent-sky-700"
              />
              <span className="mt-1 block text-xs text-slate-500">
                Demo range: {minRiskPercentage}% to {maxRiskPercentage}% per strategy.
              </span>
            </label>
          </div>

          {validationMessages.length > 0 ? (
            <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <div className="font-semibold">Check position inputs</div>
                  <ul className="mt-1 list-disc space-y-1 pl-4">
                    {validationMessages.map((message, index) => (
                      <li key={`${message}-${index}`}>{message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}

          {warningMessages.length > 0 ? (
            <div className="mt-5 rounded-md border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <div className="font-semibold">Position warning</div>
                  <ul className="mt-1 list-disc space-y-1 pl-4">
                    {warningMessages.map((message, index) => (
                      <li key={`${message}-${index}`}>{message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-5 rounded-md border border-slate-200 bg-panel p-4 text-sm text-slate-600">
            <div className="font-semibold text-slate-900">{selectedToken.name}</div>
            <div className="mt-1">
              Category: {selectedToken.category}. Current MVP uses mock/proxy context for demo reliability.
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
                {isLoadingContext ? "Loading market context..." : contextError ?? "Market context ready"}
              </div>
            </div>

            {quote && strategy ? (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricTile label="Current price" value={formatCurrency(quote.price, pricePrecision)} />
                  <MetricTile
                    label="Entry price"
                    value={normalizedPosition ? formatCurrency(normalizedPosition.entryPrice, pricePrecision) : "--"}
                  />
                  <MetricTile label="Position value" value={formatCurrency(positionValue)} />
                  <MetricTile label="Market cap" value={quote.marketCap ? formatCompact(quote.marketCap) : "Unavailable"} />
                </div>
                <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3">
                  {normalizedPosition ? (
                    <PricePositionChart position={normalizedPosition} quote={quote} strategy={strategy} />
                  ) : null}
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {contextError ?? validationMessages[0] ?? "Loading mock market context."}
              </div>
            )}
          </section>

          {marketContext ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-lg font-semibold text-ink">Market context</div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {marketContext.source === "coinmarketcap"
                    ? "CoinMarketCap live quote; proxy context fields"
                    : "Mock data fallback"}
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <MetricTile label="Trend" value={marketContext.technicals.trendState} />
                <MetricTile label="RSI 14" value={marketContext.technicals.rsi14.toFixed(0)} />
                <MetricTile label="ATR 14" value={formatCurrency(marketContext.technicals.atr14, pricePrecision)} />
                <MetricTile label="Sentiment" value={`${marketContext.sentiment.label} (${marketContext.sentiment.score})`} />
                <MetricTile label="Liquidity" value={`${marketContext.orderBook.liquidityScore}/100`} />
                <MetricTile label="Derivatives" value={marketContext.derivatives.longShortBias} />
              </div>
              {marketContext.warnings?.length ? (
                <div className="mt-4 rounded-md border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
                  <div className="font-semibold">Data note</div>
                  <ul className="mt-1 list-disc space-y-1 pl-4">
                    {marketContext.warnings.map((warning, index) => (
                      <li key={`${warning}-${index}`}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          {strategyDecision && strategy && quote ? (
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

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <MetricTile label="Fit" value={strategyDecision.fit} tone={getFitTone(strategyDecision.fit)} />
                  <MetricTile label="Selected by" value={strategyDecision.selectedBy === "auto" ? "Auto" : "User"} />
                  <MetricTile label="Estimated risk" value={formatCurrency(strategy.riskRules.estimatedRiskAmount)} />
                  <MetricTile
                    label="Data source"
                    value={strategy.dataUsed.source === "mock" ? "Mock data fallback" : "CoinMarketCap live quote"}
                  />
                </div>

                <div className="mt-4 rounded-md border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                  <div className="font-semibold text-slate-950">Why this strategy?</div>
                  <p className="mt-1">{strategyDecision.whyThisStrategy}</p>
                  <p className="mt-3">
                    <span className="font-semibold text-slate-950">Next confirmation:</span>{" "}
                    {strategyDecision.nextConfirmation}
                  </p>
                  <p className="mt-3">
                    <span className="font-semibold text-slate-950">Beginner note:</span>{" "}
                    {strategyDecision.beginnerExplanation}
                  </p>
                </div>

                {strategy.riskRules.noTradeReason ? (
                  <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <div className="font-semibold">No-trade reason</div>
                        <div>{strategy.riskRules.noTradeReason}</div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {strategyDecision.warnings.length > 0 ? (
                  <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                    <div className="font-semibold">Warnings</div>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {strategyDecision.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <MetricTile label="Stop loss" value={formatCurrency(strategy.stopLoss, pricePrecision)} tone="negative" />
                  <MetricTile label="Take profit" value={formatCurrency(strategy.takeProfit, pricePrecision)} tone="positive" />
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
                    disabled={!strategyJson}
                    onClick={() => {
                      const blob = new Blob([strategyJson], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const anchor = document.createElement("a");
                      anchor.href = url;
                      anchor.download = `positionsight-${position.symbol}-${position.timeframe}-${strategy.strategyType}.json`;
                      anchor.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    Export JSON
                  </button>
                </div>
                <pre className="mt-4 max-h-[520px] overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
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
