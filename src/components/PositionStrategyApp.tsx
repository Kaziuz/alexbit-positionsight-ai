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
  HistoryResponse,
  PositionIntent,
  PositionInput,
  RiskVerdict,
  StrategyDecision,
  StrategyMode,
  StrategyTimeframe,
  TokenCategory,
} from "@/types/strategy";
import { MetricTile } from "./MetricTile";
import { PricePositionChart } from "./PricePositionChart";

const minRiskPercentage = 0.5;
const maxRiskPercentage = 6;
const recommendedRiskPercentage = 1;
const defaultTotalCapital = 1000;
const atrStopMultiple = 1.75;

const strategyModes: StrategyMode[] = ["auto", "trend_confirmation", "breakout_retest", "defensive_rebound", "risk_check"];
const positionIntents: PositionIntent[] = ["analyze_entry", "manage_open_position", "exit_review"];

const initialPosition: PositionInput = {
  symbol: "AVAX",
  entryPrice: 34,
  positionSize: 0,
  totalCapital: defaultTotalCapital,
  strategyTimeframe: "1d",
  timeframeCategory: "daily",
  analysisInterval: "1d",
  maxRiskPercentage: recommendedRiskPercentage,
  positionIntent: "analyze_entry",
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
  const baseWhyThisStrategy =
    decision.selectedBy === "auto"
      ? `${t.decisionCopy.autoWhy} ${evaluatedLabel}.`
      : decision.noTradeRecommended
        ? t.decisionCopy.manualNoTrade
        : decision.fit === "good"
          ? t.decisionCopy.manualGood
          : t.decisionCopy.manualCaution;
  const intentCopy = t.intentDecisionCopy[decision.positionIntent];

  return {
    whyThisStrategy: `${intentCopy.prefix} ${baseWhyThisStrategy}`,
    nextConfirmation:
      translateMessage(decision.nextConfirmation, t) ||
      intentCopy.nextConfirmation ||
      t.nextConfirmationMessages[decision.evaluatedStrategyType],
    beginnerExplanation:
      translateMessage(decision.beginnerExplanation, t) ||
      intentCopy.beginnerExplanation ||
      t.beginnerVerdictMessages[decision.finalRiskVerdict],
  };
}

function roundCalculatedSize(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  if (value >= 1000) {
    return Number(value.toFixed(2));
  }

  if (value >= 1) {
    return Number(value.toFixed(4));
  }

  return Number(value.toFixed(8));
}

function formatCalculatedSize(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0";
  }

  if (value >= 1000) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }

  if (value >= 1) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 4 });
  }

  return value.toLocaleString("en-US", { maximumFractionDigits: 8 });
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
  const [totalCapitalInput, setTotalCapitalInput] = useState(String(initialPosition.totalCapital));
  const [existingPositionSizeInput, setExistingPositionSizeInput] = useState("2");
  const [tokenMode, setTokenMode] = useState<"beginner" | "advanced">("beginner");
  const [language, setLanguage] = useState<Language>("en");
  const [expandedStrategyMode, setExpandedStrategyMode] = useState<StrategyMode | null>("auto");
  const [marketContext, setMarketContext] = useState<MarketContext | null>(null);
  const [historyResponse, setHistoryResponse] = useState<HistoryResponse | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);
  const t = translations[language];

  const availableTokens = tokenMode === "beginner" ? beginnerTokenSet : eligibleTokenUniverse;
  const selectedToken =
    eligibleTokenUniverse.find((token) => token.symbol === position.symbol) ?? eligibleTokenUniverse[0];
  const analysisContext = useMemo<MarketContext | null>(() => {
    if (!marketContext) {
      return null;
    }

    if (!historyResponse) {
      return marketContext;
    }

    const indicators = historyResponse.indicators;

    return {
      ...marketContext,
      technicals: {
        ...marketContext.technicals,
        ema20: indicators.ema20 ?? marketContext.technicals.ema20,
        ema50: indicators.ema50 ?? marketContext.technicals.ema50,
        ema200: indicators.ema200 ?? marketContext.technicals.ema200,
        rsi14: indicators.rsi14 ?? marketContext.technicals.rsi14,
        atr14: indicators.atr14 ?? marketContext.technicals.atr14,
        averageVolume: indicators.averageVolume ?? marketContext.technicals.averageVolume,
        support: indicators.support ?? marketContext.technicals.support,
        resistance: indicators.resistance ?? marketContext.technicals.resistance,
        historySource: historyResponse.source,
        historyCandlesUsed: historyResponse.candles.length,
        indicatorWarnings: historyResponse.warnings,
      },
    };
  }, [historyResponse, marketContext]);
  const quote = analysisContext ? getQuoteFromContext(analysisContext) : null;
  const parsedEntryPrice = useMemo(() => parseLocalizedNumberInput(entryPriceInput), [entryPriceInput]);
  const parsedTotalCapital = useMemo(() => parseLocalizedNumberInput(totalCapitalInput), [totalCapitalInput]);
  const parsedExistingPositionSize = useMemo(
    () => parseLocalizedNumberInput(existingPositionSizeInput),
    [existingPositionSizeInput],
  );
  const isEntryIntent = position.positionIntent === "analyze_entry";
  const positionSizing = useMemo(() => {
    if (!parsedEntryPrice.ok || parsedEntryPrice.value <= 0 || !parsedTotalCapital.ok || parsedTotalCapital.value <= 0) {
      return {
        positionSize: 0,
        stopLoss: 0,
        stopDistance: 0,
        riskAmount: 0,
        method: "percent_fallback" as const,
        warnings: [] as string[],
      };
    }

    const warnings: string[] = [];
    const riskAmount = parsedTotalCapital.value * (position.maxRiskPercentage / 100);
    const atr = analysisContext?.technicals.atr14;
    const hasUsableAtr = typeof atr === "number" && Number.isFinite(atr) && atr > 0;
    const fallbackStopDistance = parsedEntryPrice.value * (position.maxRiskPercentage / 100);
    let stopDistance = hasUsableAtr ? atr * atrStopMultiple : fallbackStopDistance;
    let method: "atr_volatility" | "percent_fallback" = hasUsableAtr ? "atr_volatility" : "percent_fallback";

    if (!hasUsableAtr) {
      warnings.push(t.atrFallbackWarning);
    } else if (analysisContext?.technicals.historySource === "estimated" || historyResponse?.source === "estimated") {
      warnings.push(t.positionSizeEstimatedWarning);
    }

    if (!Number.isFinite(stopDistance) || stopDistance <= 0) {
      stopDistance = fallbackStopDistance;
      method = "percent_fallback";
      warnings.push(t.positionSizeFallbackWarning);
    }

    let stopLoss = parsedEntryPrice.value - stopDistance;

    if (!Number.isFinite(stopLoss) || stopLoss <= 0) {
      stopLoss = Math.max(parsedEntryPrice.value * 0.01, 0.00000001);
      stopDistance = parsedEntryPrice.value - stopLoss;
      warnings.push(t.stopLossClampedWarning);
    }

    const rawPositionSize = stopDistance > 0 ? riskAmount / stopDistance : 0;
    const positionSize = roundCalculatedSize(rawPositionSize);

    if (!Number.isFinite(rawPositionSize) || rawPositionSize <= 0) {
      warnings.push(t.positionSizeInvalidWarning);
    }

    return {
      positionSize,
      stopLoss,
      stopDistance,
      riskAmount,
      method,
      warnings,
    };
  }, [
    analysisContext?.technicals.atr14,
    analysisContext?.technicals.historySource,
    historyResponse?.source,
    parsedEntryPrice,
    parsedTotalCapital,
    position.maxRiskPercentage,
    t,
  ]);
  const normalizedPosition = useMemo<PositionInput | null>(() => {
    if (!parsedEntryPrice.ok || !parsedTotalCapital.ok) {
      return null;
    }

    if (!isEntryIntent && (!parsedExistingPositionSize.ok || parsedExistingPositionSize.value <= 0)) {
      return null;
    }

    const normalizedPositionSize = isEntryIntent
      ? positionSizing.positionSize
      : parsedExistingPositionSize.ok
        ? parsedExistingPositionSize.value
        : 0;

    return {
      ...position,
      entryPrice: parsedEntryPrice.value,
      positionSize: normalizedPositionSize,
      totalCapital: parsedTotalCapital.value,
    };
  }, [isEntryIntent, parsedEntryPrice, parsedExistingPositionSize, parsedTotalCapital, position, positionSizing.positionSize]);

  const validationMessages = useMemo(() => {
    const messages: string[] = [];

    if (!parsedEntryPrice.ok) {
      messages.push(entryPriceInput.trim() ? t.useValidDecimals : t.entryPriceGreaterThanZero);
    } else if (parsedEntryPrice.value <= 0) {
      messages.push(t.entryPriceGreaterThanZero);
    }

    if (!parsedTotalCapital.ok) {
      messages.push(totalCapitalInput.trim() ? t.useValidDecimals : t.totalCapitalGreaterThanZero);
    } else if (parsedTotalCapital.value <= 0) {
      messages.push(t.totalCapitalGreaterThanZero);
    }

    if (isEntryIntent && positionSizing.positionSize <= 0) {
      messages.push(t.calculatedPositionSizeUnavailable);
    }

    if (!isEntryIntent) {
      if (!parsedExistingPositionSize.ok) {
        messages.push(existingPositionSizeInput.trim() ? t.useValidDecimals : t.positionSizeGreaterThanZero);
      } else if (parsedExistingPositionSize.value <= 0) {
        messages.push(t.positionSizeGreaterThanZero);
      }
    }

    if (
      !Number.isFinite(position.maxRiskPercentage) ||
      position.maxRiskPercentage < minRiskPercentage ||
      position.maxRiskPercentage > maxRiskPercentage
    ) {
      messages.push(`${t.maxRiskRange} ${minRiskPercentage}% ${t.and} ${maxRiskPercentage}%.`);
    }

    return messages;
  }, [
    entryPriceInput,
    existingPositionSizeInput,
    isEntryIntent,
    parsedEntryPrice,
    parsedExistingPositionSize,
    parsedTotalCapital,
    position.maxRiskPercentage,
    positionSizing.positionSize,
    t,
    totalCapitalInput,
  ]);
  const isPositionValid = validationMessages.length === 0;
  const entryDistanceWarning =
    quote && normalizedPosition
      ? Math.abs((quote.price - normalizedPosition.entryPrice) / normalizedPosition.entryPrice) > 0.5
      : false;
  const stopBreachWarning =
    quote && !isEntryIntent && positionSizing.stopLoss > 0 && quote.price <= positionSizing.stopLoss
      ? t.stopBreachWarning
      : null;
  const genericSourceNotes = new Set<string>([
    String(t.latestLiveHistoryEstimated),
    String(translateMessage(
      "Latest quote is live from CoinMarketCap. Chart path and indicators are estimated until historical OHLCV is available on the current plan.",
      t,
    )),
  ]);
  const warningMessages = [
    ...(entryDistanceWarning
      ? [t.entryDistanceWarning]
      : []),
    ...(stopBreachWarning ? [stopBreachWarning] : []),
    ...(getTimeframeCategory(position.strategyTimeframe) === "intraday" ? [t.intradayTradingWarning] : []),
    ...(position.maxRiskPercentage > recommendedRiskPercentage ? [t.riskAboveOneWarning] : []),
    ...positionSizing.warnings,
    ...(analysisContext?.warnings ?? []).map((warning) => translateMessage(warning, t)),
    ...(historyResponse?.warnings ?? []).map((warning) => translateMessage(warning, t)),
  ].filter((warning) => !genericSourceNotes.has(String(warning)));
  const dataNoteMainText =
    historyResponse?.source === "coinmarketcap" ? t.latestAndHistoryFromCmc : t.latestLiveHistoryEstimated;
  const dataNoteMainTextValue = String(dataNoteMainText);
  const dataNoteWarnings = [...(analysisContext?.warnings ?? []), ...(historyResponse?.warnings ?? [])]
    .map((warning) => String(translateMessage(warning, t)))
    .filter(
      (warning, index, warnings) =>
        warning !== dataNoteMainTextValue && !genericSourceNotes.has(warning) && warnings.indexOf(warning) === index,
    );

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

  useEffect(() => {
    let isActive = true;

    async function fetchHistory() {
      try {
        const response = await fetch(
          `/api/history?symbol=${position.symbol}&timeframe=${position.strategyTimeframe}`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Historical OHLCV is unavailable.");
        }

        const data = (await response.json()) as HistoryResponse;

        if (isActive) {
          setHistoryResponse(data);
        }
      } catch {
        if (isActive) {
          setHistoryResponse(null);
        }
      }
    }

    fetchHistory();

    return () => {
      isActive = false;
    };
  }, [position.strategyTimeframe, position.symbol]);

  const strategyDecision = useMemo(() => {
    if (!analysisContext || !normalizedPosition || !isPositionValid) {
      return null;
    }

    return generateStrategyDecision(normalizedPosition, analysisContext, normalizedPosition.strategyMode ?? "auto");
  }, [analysisContext, isPositionValid, normalizedPosition]);

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
    strategyDecision && analysisContext && normalizedPosition
      ? createStrategyExport(normalizedPosition, strategyDecision, analysisContext, historyResponse ?? undefined)
      : null;
  const strategyJson = exportPayload ? JSON.stringify(exportPayload, null, 2) : "";
  const headerMarketMetrics =
    analysisContext
      ? [
          { label: t.trend, value: t.trendStateLabels[analysisContext.technicals.trendState] },
          {
            label: "RSI 14",
            value: historyResponse?.indicators.rsi14 === null ? t.notEnoughHistory : analysisContext.technicals.rsi14.toFixed(0),
          },
          {
            label: "MA 20",
            value:
              historyResponse?.indicators.ema20 === null
                ? t.notEnoughHistory
                : formatCurrency(analysisContext.technicals.ema20, pricePrecision),
          },
          {
            label: "MA 50",
            value:
              historyResponse?.indicators.ema50 === null
                ? t.notEnoughHistory
                : formatCurrency(analysisContext.technicals.ema50, pricePrecision),
          },
          {
            label: "MA 200",
            value:
              historyResponse?.indicators.ema200 === null
                ? t.notEnoughHistory
                : formatCurrency(analysisContext.technicals.ema200, pricePrecision),
          },
          {
            label: "ATR 14",
            value:
              historyResponse?.indicators.atr14 === null
                ? t.notEnoughHistory
                : formatCurrency(analysisContext.technicals.atr14, pricePrecision),
          },
          {
            label: t.avgVolume,
            value:
              historyResponse?.indicators.averageVolume === null
                ? t.notEnoughHistory
                : formatCompact(analysisContext.technicals.averageVolume ?? analysisContext.quote.volume24h),
          },
          {
            label: t.support,
            value:
              historyResponse?.indicators.support === null
                ? t.notEnoughHistory
                : formatCurrency(analysisContext.technicals.support, pricePrecision),
          },
          {
            label: t.resistance,
            value:
              historyResponse?.indicators.resistance === null
                ? t.notEnoughHistory
                : formatCurrency(analysisContext.technicals.resistance, pricePrecision),
          },
        ]
      : [];
  const entryPriceLabel = t.intentEntryPriceLabels[position.positionIntent];
  const entryPriceTooltip = t.intentEntryPriceTooltips[position.positionIntent];
  const positionSizeLabel = isEntryIntent ? t.calculatedPositionSize : t.currentPositionSize;
  const positionSizeTooltip = isEntryIntent ? t.tooltips.calculatedPositionSize : t.tooltips.currentPositionSize;
  const positionSizeHelper = isEntryIntent ? t.calculatedPositionSizeHelper : t.currentPositionSizeHelper;
  const positionSizeValue = isEntryIntent
    ? formatCalculatedSize(positionSizing.positionSize)
    : existingPositionSizeInput;
  const positionRiskAmount =
    normalizedPosition && positionSizing.stopDistance > 0
      ? Math.abs(positionSizing.stopDistance * normalizedPosition.positionSize)
      : 0;

  function updateTokenMode(nextMode: "beginner" | "advanced") {
    setTokenMode(nextMode);

    if (nextMode === "beginner" && !beginnerTokenSet.some((token) => token.symbol === position.symbol)) {
      setPosition((current) => ({ ...current, symbol: "AVAX" }));
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-7 px-4 py-5 sm:px-6 lg:px-8">
      <header className="border-b border-slate-200 pb-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
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
        </div>
        {headerMarketMetrics.length ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-9">
            {headerMarketMetrics.map((metric) => (
              <div key={metric.label} className="min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{metric.label}</div>
                <div className="mt-0.5 truncate text-sm font-semibold text-slate-950">{metric.value}</div>
              </div>
            ))}
          </div>
        ) : null}
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

            <div>
              <LabelWithInfo
                label={t.positionIntent}
                tooltip={t.tooltips.positionIntent}
              />
              <div className="mt-2 grid gap-2">
                {positionIntents.map((intent) => (
                  <button
                    key={intent}
                    type="button"
                    onClick={() => setPosition((current) => ({ ...current, positionIntent: intent }))}
                    className={`min-h-10 rounded-md border px-3 py-2 text-left text-sm font-semibold transition ${
                      position.positionIntent === intent
                        ? "border-sky-700 bg-sky-700 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {t.positionIntentLabels[intent]}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <LabelWithInfo
                label={entryPriceLabel}
                tooltip={entryPriceTooltip}
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
                label={t.totalCapital}
                tooltip={t.tooltips.totalCapital}
              />
              <input
                type="text"
                inputMode="decimal"
                value={totalCapitalInput}
                onChange={(event) => setTotalCapitalInput(event.target.value)}
                className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <label className="block">
              <LabelWithInfo
                label={positionSizeLabel}
                tooltip={positionSizeTooltip}
              />
              <input
                type="text"
                inputMode="decimal"
                value={positionSizeValue}
                readOnly={isEntryIntent}
                onChange={(event) => setExistingPositionSizeInput(event.target.value)}
                className={`mt-1 h-11 w-full rounded-md border px-3 text-sm font-semibold text-slate-950 outline-none transition ${
                  isEntryIntent
                    ? "border-slate-200 bg-slate-50"
                    : "border-slate-300 bg-white focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                }`}
              />
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                {positionSizeHelper}
              </span>
              {!isEntryIntent ? (
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  {t.existingPositionRisk}: {formatCurrency(positionRiskAmount)}
                </span>
              ) : null}
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
                    label={entryPriceLabel}
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

          {analysisContext ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-lg font-semibold text-ink">{t.marketContext}</div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {analysisContext.source === "coinmarketcap"
                    ? t.estimatedContextFields
                    : t.mockDataFallback}
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricTile
                  label={t.historySource}
                  value={
                    historyResponse?.source === "coinmarketcap"
                      ? t.coinMarketCapHistoricalOhlcv
                      : t.estimatedHistory
                  }
                />
                <MetricTile
                  label={t.sentiment}
                  value={`${t.sentimentLabels[analysisContext.sentiment.label]} (${analysisContext.sentiment.score})`}
                />
                <MetricTile label={t.liquidity} value={`${analysisContext.orderBook.liquidityScore}/100`} />
                <MetricTile label={t.derivatives} value={t.derivativesLabels[analysisContext.derivatives.longShortBias]} />
              </div>
              <div className="mt-4 rounded-md border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
                <div className="font-semibold">{t.dataNote}</div>
                <p className="mt-1">{dataNoteMainText}</p>
                {dataNoteWarnings.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    {dataNoteWarnings.map((warning, index) => (
                      <li key={`${warning}-${index}`}>{warning}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
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
                    {t.selectedStrategy}
                  </div>
                  <div className="mt-1 text-xl font-semibold text-slate-950">
                    {t.strategyModeLabels[strategyDecision.selectedStrategyMode]}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
                  <MetricTile
                    label={t.positionIntent}
                    value={t.positionIntentLabels[strategyDecision.positionIntent]}
                  />
                  <MetricTile
                    label={t.intentAction}
                    value={t.intentActionLabels[strategyDecision.intentAction]}
                    tone={strategyDecision.shouldExitPosition || strategyDecision.shouldReduceExposure ? "warning" : "positive"}
                  />
                  <MetricTile
                    label={t.stopStatus}
                    value={t.stopStatusLabels[strategyDecision.stopStatus]}
                    tone={strategyDecision.stopStatus === "stop_breached" ? "negative" : strategyDecision.stopStatus === "near_stop" ? "warning" : "positive"}
                  />
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
                    label={t.addExposureAllowed}
                    value={strategyDecision.shouldAddExposure ? t.yes : t.no}
                    tone={strategyDecision.shouldAddExposure ? "positive" : "warning"}
                  />
                  <MetricTile
                    label={t.reduceOrExitRecommended}
                    value={strategyDecision.shouldReduceExposure || strategyDecision.shouldExitPosition ? t.yes : t.no}
                    tone={strategyDecision.shouldReduceExposure || strategyDecision.shouldExitPosition ? "negative" : "positive"}
                  />
                  <MetricTile
                    label={t.dataSource}
                    value={strategy.dataUsed.source === "mock" ? t.mockDataFallback : t.coinMarketCapLiveQuote}
                  />
                </div>

                <div className="mt-4 rounded-md border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                  <div className="font-semibold text-slate-950">{t.whyThisStrategy}</div>
                  <p className="mt-1">{decisionText?.whyThisStrategy}</p>
                  <p className="mt-3">
                    <span className="font-semibold text-slate-950">{t.suggestedAction}</span>{" "}
                    {t.intentSuggestedActionLabels[strategyDecision.intentAction]}
                  </p>
                  <p className="mt-3">
                    <span className="font-semibold text-slate-950">
                      {strategyDecision.positionIntent === "analyze_entry" ? t.entryCondition : t.decisionCondition}
                    </span>{" "}
                    {translateMessage(strategyDecision.decisionCondition, t) || strategy.entryCondition}
                  </p>
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
                  <MetricTile label={t.trailingExit} value={formatCurrency(strategy.takeProfit, pricePrecision)} tone="positive" />
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
