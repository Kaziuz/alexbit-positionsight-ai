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
import { languageLabels, translations, type Language } from "@/lib/i18n";
import { parseLocalizedNumberInput } from "@/lib/number-input";
import { createStrategyExport } from "@/lib/strategy-export";
import { generateStrategyDecision } from "@/lib/strategy-engine";
import { getTimeframeCategory, strategyTimeframes } from "@/lib/strategy-timeframe";
import type {
  MarketContext,
  MarketQuote,
  PositionInput,
  RiskVerdict,
  StrategyDecision,
  StrategyMode,
  StrategyTimeframe,
  TokenCategory,
} from "@/types/strategy";
import { MetricTile } from "./MetricTile";
import { PricePositionChart } from "./PricePositionChart";

const minRiskPercentage = 1;
const maxRiskPercentage = 6;

const strategyModes: StrategyMode[] = ["auto", "trend_confirmation", "breakout_retest", "defensive_rebound", "risk_check"];

const initialPosition: PositionInput = {
  symbol: "AVAX",
  entryPrice: 34,
  positionSize: 2,
  strategyTimeframe: "1d",
  timeframeCategory: "daily",
  analysisInterval: "1d",
  maxRiskPercentage: 3,
  strategyMode: "auto",
};

function clampRiskPercentage(value: number) {
  return Math.min(Math.max(value, minRiskPercentage), maxRiskPercentage);
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

function getRiskVerdictTone(verdict: RiskVerdict) {
  if (verdict === "good") {
    return "positive";
  }

  if (verdict === "needs_confirmation") {
    return "warning";
  }

  return "negative";
}

type TranslationSet = (typeof translations)[Language];

function translateMessage(message: string | undefined, t: TranslationSet) {
  if (!message) {
    return "";
  }

  return t.messageTranslations[message as keyof typeof t.messageTranslations] ?? message;
}

function getLocalizedDecisionText(decision: StrategyDecision, t: TranslationSet) {
  const evaluatedLabel = t.strategyTypeLabels[decision.evaluatedStrategyType];
  const whyThisStrategy =
    decision.selectedBy === "auto"
      ? `${t.decisionCopy.autoWhy} ${evaluatedLabel}.`
      : decision.noTradeRecommended
        ? t.decisionCopy.manualNoTrade
        : decision.fit === "good"
          ? t.decisionCopy.manualGood
          : t.decisionCopy.manualCaution;

  return {
    whyThisStrategy,
    nextConfirmation: t.nextConfirmationMessages[decision.evaluatedStrategyType],
    beginnerExplanation: t.beginnerVerdictMessages[decision.finalRiskVerdict],
  };
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
  const [language, setLanguage] = useState<Language>("en");
  const [expandedStrategyMode, setExpandedStrategyMode] = useState<StrategyMode | null>("auto");
  const [marketContext, setMarketContext] = useState<MarketContext | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);
  const t = translations[language];

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
      messages.push(entryPriceInput.trim() ? t.useValidDecimals : t.entryPriceGreaterThanZero);
    } else if (parsedEntryPrice.value <= 0) {
      messages.push(t.entryPriceGreaterThanZero);
    }

    if (!parsedPositionSize.ok) {
      messages.push(positionSizeInput.trim() ? t.useValidDecimals : t.positionSizeGreaterThanZero);
    } else if (parsedPositionSize.value <= 0) {
      messages.push(t.positionSizeGreaterThanZero);
    }

    if (
      !Number.isFinite(position.maxRiskPercentage) ||
      position.maxRiskPercentage < minRiskPercentage ||
      position.maxRiskPercentage > maxRiskPercentage
    ) {
      messages.push(`${t.maxRiskRange} ${minRiskPercentage}% and ${maxRiskPercentage}%.`);
    }

    return messages;
  }, [entryPriceInput, parsedEntryPrice, parsedPositionSize, position.maxRiskPercentage, positionSizeInput, t]);
  const isPositionValid = validationMessages.length === 0;
  const entryDistanceWarning =
    quote && normalizedPosition
      ? Math.abs((quote.price - normalizedPosition.entryPrice) / normalizedPosition.entryPrice) > 0.5
      : false;
  const warningMessages = [
    ...(entryDistanceWarning
      ? [t.entryDistanceWarning]
      : []),
    ...(marketContext?.warnings ?? []).map((warning) => translateMessage(warning, t)),
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
  const decisionText = strategyDecision ? getLocalizedDecisionText(strategyDecision, t) : null;
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
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-7 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-800">
            <Activity className="h-3.5 w-3.5" />
            {t.badge}
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-ink sm:text-4xl">
            PositionSight AI
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{t.subtitle}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1 text-sm shadow-soft">
            <span className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t.language}</span>
            {(["en", "es"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setLanguage(option)}
                className={`h-8 rounded-md px-3 text-sm font-semibold transition ${
                  language === option ? "bg-sky-700 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {languageLabels[option]}
              </button>
            ))}
          </div>
        </div>
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 xl:max-w-[920px] xl:grid-cols-6">
          <MetricTile label={t.currentPrice} value={quote ? formatCurrency(quote.price, pricePrecision) : "--"} />
          <MetricTile
            label={t.move24h}
            value={quote ? formatPercentage(quote.percentChange24h) : "--"}
            tone={quote && quote.percentChange24h < 0 ? "negative" : "positive"}
          />
          <MetricTile label={t.volume24h} value={quote ? formatCompact(quote.volume24h) : "--"} />
          <MetricTile label={t.marketCap} value={quote?.marketCap ? formatCompact(quote.marketCap) : t.unavailable} />
          <MetricTile label={t.source} value={!quote || quote.source === "mock" ? t.mockDataFallback : t.cmcLiveQuote} />
          <MetricTile
            label={t.pnl}
            value={quote && isPositionValid ? `${formatPercentage(pnlPercentage)} ${formatCurrency(pnlAmount)}` : "--"}
            tone={pnlAmount < 0 ? "negative" : "positive"}
          />
        </div>
      </header>

      <section className="grid gap-7 xl:grid-cols-[420px_minmax(0,1fr)]">
        <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 text-lg font-semibold text-ink">
            <WalletCards className="h-5 w-5 text-sky-700" />
            {t.positionInput}
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <LabelWithInfo
                label={t.tokenList}
                tooltip={t.tooltips.tokenList}
              />
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
                  {(["beginner", "advanced"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => updateTokenMode(mode)}
                    className={`h-9 rounded-md text-sm font-semibold transition ${
                      tokenMode === mode ? "bg-white text-sky-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {mode === "beginner" ? t.beginner : t.advanced}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <LabelWithInfo
                label={t.eligibleToken}
                tooltip={t.tooltips.eligibleToken}
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
                      <optgroup
                        key={category}
                        label={t.tokenCategoryLabels[category as TokenCategory]}
                      >
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
                label={t.entryPrice}
                tooltip={t.tooltips.entryPrice}
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
                label={t.positionSize}
                tooltip={t.tooltips.positionSize}
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
                label={t.strategyTimeframe}
                tooltip={t.tooltips.strategyTimeframe}
              />
              <div className="mt-2 grid grid-cols-3 gap-2">
                {strategyTimeframes.map((strategyTimeframe: StrategyTimeframe) => (
                  <button
                    key={strategyTimeframe}
                    type="button"
                    onClick={() =>
                      setPosition((current) => ({
                        ...current,
                        strategyTimeframe,
                        timeframeCategory: getTimeframeCategory(strategyTimeframe),
                        analysisInterval: strategyTimeframe,
                      }))
                    }
                    className={`h-10 rounded-md border text-sm font-semibold transition ${
                      position.strategyTimeframe === strategyTimeframe
                        ? "border-sky-700 bg-sky-700 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {t.timeframeLabels[strategyTimeframe]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <LabelWithInfo
                label={t.strategyMode}
                tooltip={t.tooltips.strategyMode}
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">{t.strategyPrinciples}</p>
              <div className="mt-3 grid gap-2">
                {strategyModes.map((mode) => (
                  <div key={mode} className="rounded-md border border-slate-200 bg-white">
                    <div className="flex items-stretch">
                      <button
                        type="button"
                        onClick={() => setPosition((current) => ({ ...current, strategyMode: mode }))}
                        className={`min-h-10 flex-1 rounded-l-md px-3 py-2 text-left text-sm font-semibold transition ${
                          (position.strategyMode ?? "auto") === mode
                            ? "bg-sky-50 text-sky-800"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {t.strategyModeLabels[mode]}
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedStrategyMode((current) => (current === mode ? null : mode))}
                        className="inline-flex w-28 items-center justify-center border-l border-slate-200 px-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                        aria-expanded={expandedStrategyMode === mode}
                      >
                        {expandedStrategyMode === mode ? t.hideExplanation : t.whatIsThis}
                      </button>
                    </div>
                    {expandedStrategyMode === mode ? (
                      <div className="border-t border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-700">
                        <div>
                          <span className="font-semibold text-slate-950">{t.simpleExplanation}:</span>{" "}
                          {t.strategyExplanations[mode].simple}
                        </div>
                        <div className="mt-2">
                          <span className="font-semibold text-slate-950">{t.bestUsedWhen}:</span>{" "}
                          {t.strategyExplanations[mode].bestUsedWhen}
                        </div>
                        <div className="mt-2">
                          <span className="font-semibold text-slate-950">{t.avoidWhen}:</span>{" "}
                          {t.strategyExplanations[mode].avoidWhen}
                        </div>
                        <div className="mt-2">
                          <span className="font-semibold text-slate-950">{t.systemChecks}:</span>{" "}
                          {t.strategyExplanations[mode].checks}
                        </div>
                        <div className="mt-2">
                          <span className="font-semibold text-slate-950">{t.beginnerNote}</span>{" "}
                          {t.strategyExplanations[mode].beginnerNote}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
                <span className="inline-flex items-center gap-1.5">
                  <span>{t.maxRiskPercentage}</span>
                  <InfoTooltip text={t.tooltips.maxRiskPercentage} />
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
                {t.demoRange}: {minRiskPercentage}% {t.and} {maxRiskPercentage}% {t.perStrategy}
              </span>
            </label>
          </div>

          {validationMessages.length > 0 ? (
            <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <div className="font-semibold">{t.checkInputs}</div>
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
                  <div className="font-semibold">{t.positionWarning}</div>
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
              {t.tokenCategory}: {t.tokenCategoryLabels[selectedToken.category]}. {t.tokenCategoryNote}
            </div>
          </div>
        </form>

        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-lg font-semibold text-ink">
                <BarChart3 className="h-5 w-5 text-positive" />
                {t.entryVsCurrentPrice}
              </div>
              <div className="text-sm text-slate-500">
                {isLoadingContext ? t.loadingMarketContext : contextError ?? t.marketContextReady}
              </div>
            </div>

            {quote && strategy ? (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricTile label={t.currentPrice} value={formatCurrency(quote.price, pricePrecision)} />
                  <MetricTile
                    label={t.entryPrice}
                    value={normalizedPosition ? formatCurrency(normalizedPosition.entryPrice, pricePrecision) : "--"}
                  />
                  <MetricTile label={t.positionValue} value={formatCurrency(positionValue)} />
                  <MetricTile label={t.marketCap} value={quote.marketCap ? formatCompact(quote.marketCap) : t.unavailable} />
                </div>
                <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3">
                  {normalizedPosition ? (
                    <PricePositionChart
                      position={normalizedPosition}
                      quote={quote}
                      strategy={strategy}
                      language={language}
                    />
                  ) : null}
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {contextError ? translateMessage(contextError, t) : validationMessages[0] ?? t.loadingMockMarketContext}
              </div>
            )}
          </section>

          {marketContext ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-lg font-semibold text-ink">{t.marketContext}</div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {marketContext.source === "coinmarketcap"
                    ? t.estimatedContextFields
                    : t.mockDataFallback}
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <MetricTile label={t.trend} value={t.trendStateLabels[marketContext.technicals.trendState]} />
                <MetricTile label="RSI 14" value={marketContext.technicals.rsi14.toFixed(0)} />
                <MetricTile label="ATR 14" value={formatCurrency(marketContext.technicals.atr14, pricePrecision)} />
                <MetricTile
                  label={t.sentiment}
                  value={`${t.sentimentLabels[marketContext.sentiment.label]} (${marketContext.sentiment.score})`}
                />
                <MetricTile label={t.liquidity} value={`${marketContext.orderBook.liquidityScore}/100`} />
                <MetricTile label={t.derivatives} value={t.derivativesLabels[marketContext.derivatives.longShortBias]} />
              </div>
              {marketContext.warnings?.length ? (
                <div className="mt-4 rounded-md border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
                  <div className="font-semibold">{t.dataNote}</div>
                  <ul className="mt-1 list-disc space-y-1 pl-4">
                    {marketContext.warnings.map((warning, index) => (
                      <li key={`${warning}-${index}`}>{translateMessage(warning, t)}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          {strategyDecision && strategy && quote ? (
            <section className="grid gap-7 2xl:grid-cols-[minmax(420px,0.86fr)_minmax(0,1.14fr)]">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
                <div className="flex items-center gap-2 text-lg font-semibold text-ink">
                  <ShieldCheck className="h-5 w-5 text-sky-700" />
                  {t.strategySignal}
                </div>
                <div className="mt-4 rounded-md border border-slate-200 bg-panel p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t.strategyEvaluated}
                  </div>
                  <div className="mt-1 text-xl font-semibold text-slate-950">
                    {t.strategyTypeLabels[strategyDecision.evaluatedStrategyType]}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
                  <MetricTile
                    label={t.riskVerdict}
                    value={t.riskVerdictLabels[strategyDecision.finalRiskVerdict]}
                    tone={getRiskVerdictTone(strategyDecision.finalRiskVerdict)}
                  />
                  <MetricTile
                    label={t.fit}
                    value={t.fitLabels[strategyDecision.fit]}
                    tone={getFitTone(strategyDecision.fit)}
                  />
                  <MetricTile label={t.selectedBy} value={strategyDecision.selectedBy === "auto" ? t.auto : t.user} />
                  <MetricTile label={t.estimatedRisk} value={formatCurrency(strategy.riskRules.estimatedRiskAmount)} />
                  <MetricTile
                    label={t.dataSource}
                    value={strategy.dataUsed.source === "mock" ? t.mockDataFallback : t.coinMarketCapLiveQuote}
                  />
                </div>

                <div className="mt-4 rounded-md border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                  <div className="font-semibold text-slate-950">{t.whyThisStrategy}</div>
                  <p className="mt-1">{decisionText?.whyThisStrategy}</p>
                  <p className="mt-3">
                    <span className="font-semibold text-slate-950">{t.nextConfirmation}</span>{" "}
                    {decisionText?.nextConfirmation}
                  </p>
                  <p className="mt-3">
                    <span className="font-semibold text-slate-950">{t.beginnerNote}</span>{" "}
                    {decisionText?.beginnerExplanation}
                  </p>
                </div>

                {strategyDecision.noTradeReason ? (
                  <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <div className="font-semibold">{t.noTradeReason}</div>
                        <div>{translateMessage(strategyDecision.noTradeReason, t)}</div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {strategyDecision.warnings.length > 0 ? (
                  <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                    <div className="font-semibold">{t.warnings}</div>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {strategyDecision.warnings.map((warning) => (
                        <li key={warning}>{translateMessage(warning, t)}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <MetricTile label={t.stopLoss} value={formatCurrency(strategy.stopLoss, pricePrecision)} tone="negative" />
                  <MetricTile label={t.takeProfit} value={formatCurrency(strategy.takeProfit, pricePrecision)} tone="positive" />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-lg font-semibold text-ink">
                    <Braces className="h-5 w-5 text-slate-700" />
                    {t.backtestReadyJson}
                  </div>
                  <button
                    type="button"
                    disabled={!strategyJson}
                    onClick={() => {
                      const blob = new Blob([strategyJson], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const anchor = document.createElement("a");
                      anchor.href = url;
                      anchor.download = `positionsight-${position.symbol}-${position.strategyTimeframe}-${strategy.strategyType}.json`;
                      anchor.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    {t.exportJson}
                  </button>
                </div>
                <pre className="mt-4 max-h-[640px] overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
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
