"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Braces,
  Download,
  Info,
  Play,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { beginnerTokenSet, eligibleTokenUniverse } from "@/data/eligible-tokens";
import { isPositionSightStrategyExport, runSimpleBacktest } from "@/lib/backtest";
import { formatCompact, formatCurrency, formatPercentage } from "@/lib/format";
import { languageLabels, translations, type Language } from "@/lib/i18n";
import { parseLocalizedNumberInput } from "@/lib/number-input";
import { createStrategyExport } from "@/lib/strategy-export";
import { generateStrategyDecision } from "@/lib/strategy-engine";
import { getTimeframeCategory, strategyTimeframes } from "@/lib/strategy-timeframe";
import type {
  AiExplanationMetadata,
  AiExplanationResult,
  AiExplanationSource,
  EligibleToken,
  MarketContext,
  MarketQuote,
  HistoryResponse,
  PaperBacktestResult,
  PositionIntent,
  PositionInput,
  RiskBadge,
  RiskVerdict,
  ScannerResult,
  StrategyDecision,
  StrategyMode,
  StrategyTimeframe,
} from "@/types/strategy";
import { MetricTile } from "./MetricTile";
import { PricePositionChart } from "./PricePositionChart";

const minRiskPercentage = 0.5;
const maxRiskPercentage = 10;
const recommendedRiskPercentage = 1;
const defaultTotalCapital = 1000;
const atrStopMultiple = 1.75;

const strategyModes: StrategyMode[] = ["auto", "trend_confirmation", "breakout_retest", "defensive_rebound", "risk_check"];
const positionIntents: PositionIntent[] = ["analyze_entry", "manage_open_position", "exit_review"];
const scannerMaxOptions = [5, 10, 20, 30, 40, 50] as const;

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

function getRiskBadgeTone(badge: RiskBadge) {
  if (badge === "low") {
    return "positive";
  }

  if (badge === "medium") {
    return "warning";
  }

  return "negative";
}

type TrendIconState = "bullish" | "bearish" | "neutral" | "mixed" | "unavailable";
type TranslationSet = (typeof translations)[Language];
type ScannerUniverse = "beginner" | "advanced" | "all";
type ScannerScope = "current" | "specific" | "group";
type MainTab = "strategy_builder" | "paper_backtest";
type PaperBacktestChartView = "line" | "candles";
type ExplainApiResponse = {
  source: Exclude<AiExplanationSource, "not_generated">;
  provider: string;
  model: string | null;
  explanation: AiExplanationResult;
  warnings: string[];
};

function translateMessage(message: string | undefined, t: TranslationSet) {
  if (!message) {
    return "";
  }

  const isSpanish = t.language === "Idioma";

  if (isSpanish) {
    const strategyLabelTranslations: Record<string, string> = {
      "trend confirmation": "confirmación de tendencia",
      "breakout and retest": "ruptura y retesteo",
      "defensive rebound": "rebote defensivo",
      "risk check / no-trade": "revisión de riesgo / no operar",
      "trend following pullback": "confirmación de tendencia",
      "breakout with volume": "ruptura con volumen",
      "defensive mean reversion": "rebote defensivo",
      "no trade": "no operar",
    };

    const autoSelectedMatch = message.match(/^Auto Recommended selected this because the strongest fit is (.+)\.$/);

    if (autoSelectedMatch) {
      const strategyLabel = strategyLabelTranslations[autoSelectedMatch[1]] ?? autoSelectedMatch[1];

      return `Auto recomendado eligió esto porque el mejor ajuste es ${strategyLabel}.`;
    }

    const selectedModeMatch = message.match(/^The selected (.+) mode matches the current market context\.$/);

    if (selectedModeMatch) {
      const strategyLabel = strategyLabelTranslations[selectedModeMatch[1]] ?? selectedModeMatch[1];

      return `El modo ${strategyLabel} seleccionado encaja con el contexto actual de mercado.`;
    }

    const autoPrefersMatch = message.match(/^Auto mode prefers (.+), while the selected mode needs more confirmation\.$/);

    if (autoPrefersMatch) {
      const strategyLabel = strategyLabelTranslations[autoPrefersMatch[1]] ?? autoPrefersMatch[1];

      return `El modo Auto prefiere ${strategyLabel}, mientras el modo seleccionado necesita más confirmación.`;
    }
  }

  return t.messageTranslations[message as keyof typeof t.messageTranslations] ?? message;
}

function getTrendIconLabel(state: TrendIconState, t: TranslationSet) {
  if (state === "bullish") {
    return t.trendIconLabels.bullish;
  }

  if (state === "bearish") {
    return t.trendIconLabels.bearish;
  }

  return t.trendIconLabels.neutral;
}

function TrendIcon({ state, t }: { state: TrendIconState; t: TranslationSet }) {
  const label = getTrendIconLabel(state, t);
  const isBullish = state === "bullish";
  const isBearish = state === "bearish";
  const colorClass = isBullish ? "text-positive" : isBearish ? "text-negative" : "text-slate-500";
  const points = isBullish ? "3,15 8,10 12,12 21,3" : isBearish ? "3,5 8,10 12,8 21,17" : "3,10 21,10";

  return (
    <span
      aria-label={label}
      role="img"
      title={label}
      className={`inline-flex h-8 w-10 items-center justify-center rounded-md border border-slate-200 bg-white ${colorClass}`}
    >
      <svg aria-hidden="true" className="h-5 w-6" viewBox="0 0 24 20" fill="none">
        <polyline points={points} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        {isBullish ? (
          <polyline points="16,3 21,3 21,8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
        {isBearish ? (
          <polyline points="16,17 21,17 21,12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
      </svg>
    </span>
  );
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

function mergeHistoryIntoMarketContext(marketContext: MarketContext, historyResponse: HistoryResponse | null) {
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
  } satisfies MarketContext;
}

function getMaAlignment(context: MarketContext): ScannerResult["maAlignment"] {
  const { ema20, ema50, ema200 } = context.technicals;

  if (![ema20, ema50, ema200].every((value) => Number.isFinite(value))) {
    return "unavailable";
  }

  if (ema20 >= ema50 && ema50 >= ema200) {
    return "bullish";
  }

  if (ema20 <= ema50 && ema50 <= ema200) {
    return "bearish";
  }

  return "mixed";
}

function calculateScannerPositionSize(context: MarketContext, totalCapital: number, riskPercentage: number) {
  const entryPrice = context.quote.price;
  const riskAmount = totalCapital * (riskPercentage / 100);
  const atr = context.technicals.atr14;
  const stopDistance =
    typeof atr === "number" && Number.isFinite(atr) && atr > 0
      ? atr * atrStopMultiple
      : entryPrice * (riskPercentage / 100);

  return roundCalculatedSize(stopDistance > 0 ? riskAmount / stopDistance : 0);
}

function omitStrategySpec(decision: StrategyDecision): Omit<StrategyDecision, "spec"> {
  const decisionForExport: Partial<StrategyDecision> = { ...decision };

  delete decisionForExport.spec;

  return decisionForExport as Omit<StrategyDecision, "spec">;
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

function getLocalizedPaperBacktestMessage(result: PaperBacktestResult, t: TranslationSet) {
  if (!result.entryTriggered && result.result === "not_triggered") {
    return t.paperBacktestMessageLabels.entryNotTriggered;
  }

  if (!result.entryTriggered || result.result === "no_trade") {
    return t.paperBacktestMessageLabels.noPositionOpened;
  }

  if (result.stopHit) {
    return t.paperBacktestMessageLabels.stopHit;
  }

  if (result.dynamicExitHit) {
    return t.paperBacktestMessageLabels.dynamicExitHit;
  }

  return t.paperBacktestMessageLabels.markedToFinalClose;
}

function getAdjustedLevelLabels(levels: Array<{ key: string; label: string; color: string; y: number }>) {
  return [...levels]
    .sort((left, right) => left.y - right.y)
    .reduce<Array<{ key: string; label: string; color: string; y: number }>>((adjusted, level) => {
      const previous = adjusted.at(-1);
      const minGap = 18;
      const y = previous ? Math.max(level.y, previous.y + minGap) : level.y;

      adjusted.push({ ...level, y });

      return adjusted;
    }, []);
}

function PaperCandlestickChart({
  result,
  t,
  referenceLevels,
}: {
  result: PaperBacktestResult;
  t: TranslationSet;
  referenceLevels: Array<{ key: string; label: string; value: number; color: string }>;
}) {
  const candles = useMemo(() => {
    const maxCandles = 80;
    const step = Math.max(Math.ceil(result.candles.length / maxCandles), 1);

    return result.candles.filter((_, index) => index % step === 0 || index === result.candles.length - 1);
  }, [result.candles]);

  if (!candles.length) {
    return null;
  }

  const width = 920;
  const height = 320;
  const margin = { top: 18, right: 150, bottom: 34, left: 70 };
  const plotLeft = margin.left;
  const plotRight = width - margin.right;
  const plotTop = margin.top;
  const plotBottom = height - margin.bottom;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const rawMin = Math.min(...candles.map((candle) => candle.low), ...referenceLevels.map((level) => level.value));
  const rawMax = Math.max(...candles.map((candle) => candle.high), ...referenceLevels.map((level) => level.value));
  const padding = Math.max((rawMax - rawMin) * 0.08, rawMax * 0.002, 0.00000001);
  const minPrice = Math.max(rawMin - padding, 0.00000001);
  const maxPrice = rawMax + padding;
  const priceRange = Math.max(maxPrice - minPrice, 0.00000001);
  const xForIndex = (index: number) => plotLeft + (candles.length === 1 ? plotWidth / 2 : (index / (candles.length - 1)) * plotWidth);
  const yForPrice = (price: number) => plotBottom - ((price - minPrice) / priceRange) * plotHeight;
  const candleSlot = candles.length > 1 ? plotWidth / candles.length : plotWidth;
  const candleBodyWidth = Math.max(Math.min(candleSlot * 0.58, 9), 2);
  const yTicks = [maxPrice, (maxPrice + minPrice) / 2, minPrice];
  const xTickIndexes = [0, Math.floor((candles.length - 1) / 2), candles.length - 1].filter(
    (value, index, array) => array.indexOf(value) === index,
  );
  const adjustedLabels = getAdjustedLevelLabels(
    referenceLevels.map((level) => ({
      key: level.key,
      label: level.label,
      color: level.color,
      y: yForPrice(level.value),
    })),
  ).map((level) => ({
    ...level,
    y: Math.min(Math.max(level.y, plotTop + 8), plotBottom - 8),
  }));

  return (
    <svg className="h-full w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={t.paperBacktestChart}>
      <rect x="0" y="0" width={width} height={height} rx="8" fill="#f8fafc" />
      {yTicks.map((tick) => {
        const y = yForPrice(tick);

        return (
          <g key={tick}>
            <line x1={plotLeft} x2={plotRight} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
            <text x={plotLeft - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">
              {formatCurrency(tick, tick < 1 ? 5 : 2)}
            </text>
          </g>
        );
      })}
      <line x1={plotLeft} x2={plotLeft} y1={plotTop} y2={plotBottom} stroke="#cbd5e1" />
      <line x1={plotLeft} x2={plotRight} y1={plotBottom} y2={plotBottom} stroke="#cbd5e1" />

      {referenceLevels.map((level) => {
        const y = yForPrice(level.value);

        return (
          <line
            key={level.key}
            x1={plotLeft}
            x2={plotRight}
            y1={y}
            y2={y}
            stroke={level.color}
            strokeDasharray="5 5"
            strokeWidth="1.5"
          />
        );
      })}

      {candles.map((candle, index) => {
        const x = xForIndex(index);
        const openY = yForPrice(candle.open);
        const closeY = yForPrice(candle.close);
        const highY = yForPrice(candle.high);
        const lowY = yForPrice(candle.low);
        const isPositive = candle.close >= candle.open;
        const color = isPositive ? "#16a34a" : "#dc2626";
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.max(Math.abs(closeY - openY), 1.5);

        return (
          <g key={`${candle.openTime}-${index}`}>
            <line x1={x} x2={x} y1={highY} y2={lowY} stroke={color} strokeWidth="1.4" />
            <rect
              x={x - candleBodyWidth / 2}
              y={bodyTop}
              width={candleBodyWidth}
              height={bodyHeight}
              rx="1"
              fill={isPositive ? "#dcfce7" : "#fee2e2"}
              stroke={color}
              strokeWidth="1.2"
            />
          </g>
        );
      })}

      {xTickIndexes.map((index) => {
        const candle = candles[index];
        const x = xForIndex(index);

        return (
          <text key={candle.closeTime} x={x} y={height - 10} textAnchor="middle" fontSize="11" fill="#64748b">
            {new Date(candle.closeTime).toLocaleDateString(t.language === "Idioma" ? "es-ES" : "en-US", {
              month: "short",
              day: "numeric",
            })}
          </text>
        );
      })}

      {adjustedLabels.map((level) => (
        <g key={level.key}>
          <line x1={plotRight + 4} x2={plotRight + 14} y1={level.y} y2={level.y} stroke={level.color} strokeWidth="2" />
          <text x={plotRight + 18} y={level.y + 4} fontSize="11" fontWeight="600" fill={level.color}>
            {level.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function PaperBacktestChart({ result, t }: { result: PaperBacktestResult; t: TranslationSet }) {
  const [chartView, setChartView] = useState<PaperBacktestChartView>("line");
  const sampledCandles = useMemo(() => {
    const maxPoints = 120;
    const step = Math.max(Math.ceil(result.candles.length / maxPoints), 1);

    return result.candles
      .filter((_, index) => index % step === 0 || index === result.candles.length - 1)
      .map((candle) => ({
        time: new Date(candle.closeTime).getTime(),
        close: candle.close,
        label: new Date(candle.closeTime).toLocaleDateString(t.language === "Idioma" ? "es-ES" : "en-US", {
          month: "short",
          day: "numeric",
        }),
      }));
  }, [result.candles, t.language]);
  const entryEvent = result.events.find((event) => event.type === "entry");
  const stopEvent = result.events.find((event) => event.type === "stop");
  const dynamicExitEvent = result.events.find((event) => event.type === "dynamic_exit");
  const referenceLevels = [
    { key: "entry", label: t.entryPrice, value: result.entryPrice, color: "#0284c7" },
    { key: "stop", label: t.stopLoss, value: result.stopLoss, color: "#dc2626" },
    { key: "dynamicExit", label: t.dynamicExit, value: result.dynamicExit, color: "#16a34a" },
  ];

  if (!sampledCandles.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
          <span>{t.paperBacktestView}:</span>
          {([
            ["line", t.paperBacktestLineView],
            ["candles", t.paperBacktestCandlesView],
          ] as const).map(([view, label]) => (
            <button
              key={view}
              type="button"
              onClick={() => setChartView(view)}
              className={`h-8 rounded-md border px-3 text-xs font-semibold transition ${
                chartView === view
                  ? "border-sky-700 bg-sky-700 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {referenceLevels.map((level) => (
            <span key={level.key} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700">
              <span className="h-2 w-4 rounded-sm" style={{ backgroundColor: level.color }} />
              {level.label}
            </span>
          ))}
        </div>
      </div>

      <div className="h-[320px]" role="application" aria-label={t.paperBacktestChart}>
        {chartView === "line" ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sampledCandles} margin={{ top: 12, right: 18, bottom: 8, left: 2 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="time"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(value) =>
                  new Date(Number(value)).toLocaleDateString(t.language === "Idioma" ? "es-ES" : "en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={{ stroke: "#cbd5e1" }}
              />
              <YAxis
                width={72}
                tickFormatter={(value) => formatCurrency(Number(value), Number(value) < 1 ? 5 : 2)}
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={{ stroke: "#cbd5e1" }}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value), Number(value) < 1 ? 6 : 2), t.currentPrice]}
                labelFormatter={(value) =>
                  new Date(Number(value)).toLocaleString(t.language === "Idioma" ? "es-ES" : "en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }
              />
              {referenceLevels.map((level) => (
                <ReferenceLine key={level.key} y={level.value} stroke={level.color} strokeDasharray="5 5" />
              ))}
              <Line type="monotone" dataKey="close" dot={false} stroke="#334155" strokeWidth={2} isAnimationActive={false} />
              {entryEvent ? (
                <ReferenceDot x={new Date(entryEvent.time).getTime()} y={entryEvent.price} r={5} fill="#0284c7" stroke="#ffffff" />
              ) : null}
              {stopEvent ? (
                <ReferenceDot x={new Date(stopEvent.time).getTime()} y={stopEvent.price} r={5} fill="#dc2626" stroke="#ffffff" />
              ) : null}
              {dynamicExitEvent ? (
                <ReferenceDot x={new Date(dynamicExitEvent.time).getTime()} y={dynamicExitEvent.price} r={5} fill="#16a34a" stroke="#ffffff" />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <PaperCandlestickChart result={result} t={t} referenceLevels={referenceLevels} />
        )}
      </div>
    </div>
  );
}

export function PositionStrategyApp() {
  const [position, setPosition] = useState<PositionInput>(initialPosition);
  const [activeTab, setActiveTab] = useState<MainTab>("strategy_builder");
  const [entryPriceInput, setEntryPriceInput] = useState(String(initialPosition.entryPrice));
  const [totalCapitalInput, setTotalCapitalInput] = useState(String(initialPosition.totalCapital));
  const [existingPositionSizeInput, setExistingPositionSizeInput] = useState("2");
  const [language, setLanguage] = useState<Language>("en");
  const [localDateLabel, setLocalDateLabel] = useState("");
  const [expandedStrategyMode, setExpandedStrategyMode] = useState<StrategyMode | null>("auto");
  const [marketContext, setMarketContext] = useState<MarketContext | null>(null);
  const [historyResponse, setHistoryResponse] = useState<HistoryResponse | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);
  const [aiExplanationResponse, setAiExplanationResponse] = useState<ExplainApiResponse | null>(null);
  const [isExplanationLoading, setIsExplanationLoading] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);
  const [scannerUniverse, setScannerUniverse] = useState<ScannerUniverse>("beginner");
  const [scannerScope, setScannerScope] = useState<ScannerScope>("group");
  const [scannerSpecificSymbol, setScannerSpecificSymbol] = useState("ETH");
  const [scannerIntent, setScannerIntent] = useState<PositionIntent>("analyze_entry");
  const [scannerTimeframe, setScannerTimeframe] = useState<StrategyTimeframe>("1d");
  const [scannerMaxTokens, setScannerMaxTokens] = useState<(typeof scannerMaxOptions)[number]>(10);
  const [scannerResults, setScannerResults] = useState<ScannerResult[]>([]);
  const [isScannerLoading, setIsScannerLoading] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [lastExportedJson, setLastExportedJson] = useState("");
  const [paperJsonInput, setPaperJsonInput] = useState("");
  const [paperBacktestResult, setPaperBacktestResult] = useState<PaperBacktestResult | null>(null);
  const [paperBacktestError, setPaperBacktestError] = useState<string | null>(null);
  const [isPaperBacktestLoading, setIsPaperBacktestLoading] = useState(false);
  const t = translations[language];

  const selectedToken =
    eligibleTokenUniverse.find((token) => token.symbol === position.symbol) ?? eligibleTokenUniverse[0];
  const analysisContext = useMemo<MarketContext | null>(() => {
    if (!marketContext) {
      return null;
    }

    if (marketContext.symbol !== position.symbol) {
      return null;
    }

    const activeHistory =
      historyResponse?.symbol === marketContext.symbol && historyResponse.timeframe === position.strategyTimeframe
        ? historyResponse
        : null;

    return mergeHistoryIntoMarketContext(marketContext, activeHistory);
  }, [historyResponse, marketContext, position.strategyTimeframe, position.symbol]);
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
  const isIntradayTimeframe = getTimeframeCategory(position.strategyTimeframe) === "intraday";
  const isRiskAboveRecommended = position.maxRiskPercentage > recommendedRiskPercentage;

  useEffect(() => {
    setLocalDateLabel(
      new Intl.DateTimeFormat(language === "es" ? "es-ES" : "en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date()),
    );
  }, [language]);

  useEffect(() => {
    let isActive = true;

    async function fetchContext() {
      setIsLoadingContext(true);
      setContextError(null);
      setMarketContext(null);

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
      setIsLoadingHistory(true);
      setHistoryResponse(null);

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
      } finally {
        if (isActive) {
          setIsLoadingHistory(false);
        }
      }
    }

    fetchHistory();

    return () => {
      isActive = false;
    };
  }, [position.strategyTimeframe, position.symbol]);

  useEffect(() => {
    setAiExplanationResponse(null);
    setExplanationError(null);
  }, [
    position.symbol,
    position.positionIntent,
    position.strategyMode,
    position.strategyTimeframe,
    position.maxRiskPercentage,
    entryPriceInput,
    totalCapitalInput,
    existingPositionSizeInput,
  ]);

  const strategyDecision = useMemo(() => {
    if (!analysisContext || !normalizedPosition || !isPositionValid) {
      return null;
    }

    return generateStrategyDecision(normalizedPosition, analysisContext, normalizedPosition.strategyMode ?? "auto");
  }, [analysisContext, isPositionValid, normalizedPosition]);

  const strategy = strategyDecision?.spec ?? null;
  const decisionText = strategyDecision ? getLocalizedDecisionText(strategyDecision, t) : null;
  const backtestResult =
    strategyDecision && strategy && quote && normalizedPosition && !isLoadingHistory
      ? runSimpleBacktest({
          symbol: normalizedPosition.symbol,
          position: normalizedPosition,
          strategy,
          currentPrice: quote.price,
          strategyType: strategy.strategyType,
          history: historyResponse,
        })
      : null;
  const aiExplanationMetadata: AiExplanationMetadata = aiExplanationResponse
    ? {
        enabled: true,
        source: aiExplanationResponse.source,
        provider: aiExplanationResponse.provider,
        model: aiExplanationResponse.model,
        explanation: aiExplanationResponse.explanation,
        guardrails: {
          doesNotOverrideEngine: true,
          noFinancialAdvice: true,
          noTradeExecution: true,
        },
      }
    : {
        enabled: false,
        source: "not_generated",
        provider: null,
        model: null,
        explanation: null,
        guardrails: {
          doesNotOverrideEngine: true,
          noFinancialAdvice: true,
          noTradeExecution: true,
        },
      };
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
      ? createStrategyExport(
          normalizedPosition,
          strategyDecision,
          analysisContext,
          historyResponse ?? undefined,
          backtestResult ?? undefined,
          aiExplanationMetadata,
          scannerResults.length ? scannerResults : undefined,
        )
      : null;
  const strategyJson = exportPayload ? JSON.stringify(exportPayload, null, 2) : "";
  const headerMarketMetrics =
    analysisContext
      ? [
          { label: t.trend, value: <TrendIcon state={analysisContext.technicals.trendState} t={t} /> },
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

  const scannerTokenCandidates = useMemo(() => {
    if (scannerScope === "current") {
      return [selectedToken];
    }

    if (scannerScope === "specific") {
      return eligibleTokenUniverse.filter((token) => token.symbol === scannerSpecificSymbol);
    }

    if (scannerUniverse === "beginner") {
      return beginnerTokenSet;
    }

    if (scannerUniverse === "advanced") {
      return eligibleTokenUniverse.filter((token) => !token.beginner);
    }

    return eligibleTokenUniverse;
  }, [scannerScope, scannerSpecificSymbol, scannerUniverse, selectedToken]);

  async function generateExplanation() {
    if (!exportPayload) {
      return;
    }

    setIsExplanationLoading(true);
    setExplanationError(null);

    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          artifact: exportPayload,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error(t.explanationUnavailable);
      }

      const payload = (await response.json()) as ExplainApiResponse;
      setAiExplanationResponse(payload);
    } catch {
      setExplanationError(t.explanationUnavailable);
    } finally {
      setIsExplanationLoading(false);
    }
  }

  async function scanSingleToken(token: EligibleToken): Promise<ScannerResult | null> {
    const marketResponse = await fetch(`/api/market?symbol=${token.symbol}`, { cache: "no-store" });

    if (!marketResponse.ok) {
      return null;
    }

    const market = (await marketResponse.json()) as MarketContext;
    const historyResponseForToken = await fetch(
      `/api/history?symbol=${token.symbol}&timeframe=${scannerTimeframe}`,
      { cache: "no-store" },
    );
    const history = historyResponseForToken.ok ? ((await historyResponseForToken.json()) as HistoryResponse) : null;
    const context = mergeHistoryIntoMarketContext(market, history);
    const totalCapital = parsedTotalCapital.ok && parsedTotalCapital.value > 0 ? parsedTotalCapital.value : defaultTotalCapital;
    const positionSize =
      scannerIntent === "analyze_entry"
        ? calculateScannerPositionSize(context, totalCapital, position.maxRiskPercentage)
        : parsedExistingPositionSize.ok && parsedExistingPositionSize.value > 0
          ? parsedExistingPositionSize.value
          : 1;
    const scanPosition: PositionInput = {
      symbol: token.symbol,
      entryPrice: context.quote.price,
      positionSize: positionSize > 0 ? positionSize : 1,
      totalCapital,
      strategyTimeframe: scannerTimeframe,
      timeframeCategory: getTimeframeCategory(scannerTimeframe),
      analysisInterval: scannerTimeframe,
      maxRiskPercentage: position.maxRiskPercentage,
      positionIntent: scannerIntent,
      strategyMode: "auto",
    };
    const decision = generateStrategyDecision(scanPosition, context, "auto");
    const backtest = runSimpleBacktest({
      symbol: token.symbol,
      position: scanPosition,
      strategy: decision.spec,
      currentPrice: context.quote.price,
      strategyType: decision.spec.strategyType,
      history,
    });
    const decisionForExport = omitStrategySpec(decision);

    return {
      symbol: token.symbol,
      name: token.name,
      price: context.quote.price,
      percentChange24h: context.quote.percentChange24h,
      trendState: context.technicals.trendState,
      rsi14: context.technicals.rsi14,
      maAlignment: getMaAlignment(context),
      riskBadge: decision.riskBadge,
      intentAction: decision.intentAction,
      stopStatus: decision.stopStatus,
      dataSource: {
        quote: context.source,
        history: history?.source ?? "unavailable",
        backtest: backtest.backtestSource,
      },
      reason: decision.noTradeReason ?? decision.whyThisStrategy,
      strategyDecision: decisionForExport,
      strategySpec: decision.spec,
      backtestResult: backtest,
    };
  }

  async function scanTokens() {
    const tokensToScan = scannerTokenCandidates.slice(0, scannerMaxTokens);

    setIsScannerLoading(true);
    setScannerError(null);
    setScannerResults([]);

    try {
      const results: ScannerResult[] = [];

      for (let index = 0; index < tokensToScan.length; index += 3) {
        const batch = tokensToScan.slice(index, index + 3);
        const batchResults = await Promise.all(batch.map((token) => scanSingleToken(token)));

        results.push(...batchResults.filter((result): result is ScannerResult => result !== null));
        setScannerResults([...results]);
      }

      if (!results.length) {
        setScannerError(t.scannerNoResults);
      }
    } catch {
      setScannerError(t.scannerFailed);
    } finally {
      setIsScannerLoading(false);
    }
  }

  function loadScannerResult(result: ScannerResult) {
    setPosition((current) => ({
      ...current,
      symbol: result.symbol,
      positionIntent: scannerIntent,
      strategyTimeframe: scannerTimeframe,
      timeframeCategory: getTimeframeCategory(scannerTimeframe),
      analysisInterval: scannerTimeframe,
      maxRiskPercentage: position.maxRiskPercentage,
      strategyMode: "auto",
    }));
    setEntryPriceInput(String(result.price));

    if (scannerIntent !== "analyze_entry") {
      setExistingPositionSizeInput(String(result.strategySpec.riskRules.positionSize || 1));
    }
  }

  async function runPaperBacktestFromInput() {
    setPaperBacktestError(null);
    setPaperBacktestResult(null);

    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(paperJsonInput);
    } catch {
      setPaperBacktestError(t.invalidPositionSightJson);
      return;
    }

    if (!isPositionSightStrategyExport(parsedJson)) {
      setPaperBacktestError(t.invalidPositionSightJson);
      return;
    }

    setIsPaperBacktestLoading(true);

    try {
      const response = await fetch("/api/backtest/binance", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ strategy: parsedJson }),
      });

      if (!response.ok) {
        throw new Error(t.paperBacktestUnavailable);
      }

      const result = (await response.json()) as PaperBacktestResult;
      setPaperBacktestResult(result);
    } catch {
      setPaperBacktestError(t.paperBacktestUnavailable);
    } finally {
      setIsPaperBacktestLoading(false);
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
                <div className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500">{metric.label}</div>
                <div className="mt-0.5 min-h-5 break-words text-sm font-semibold leading-tight text-slate-950">{metric.value}</div>
              </div>
            ))}
          </div>
        ) : null}
      </header>

      <nav className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-1 shadow-soft" aria-label="PositionSight workflows">
        {([
          ["strategy_builder", t.strategyBuilderTab],
          ["paper_backtest", t.paperBacktestTab],
        ] as const).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`min-h-10 rounded-md px-4 text-sm font-semibold transition ${
              activeTab === tab ? "bg-sky-700 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            }`}
            aria-current={activeTab === tab ? "page" : undefined}
          >
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "strategy_builder" ? (
      <section className="grid gap-7 xl:grid-cols-[420px_minmax(0,1fr)]">
        <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2 text-lg font-semibold text-ink">
            <WalletCards className="h-5 w-5 text-sky-700" />
            {t.positionInput}
          </div>

          <div className="mt-5 space-y-5">
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
                {eligibleTokenUniverse.map((token) => (
                  <option key={token.id} value={token.symbol}>
                    {token.symbol} - {token.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block rounded-md border border-slate-200 bg-slate-50 p-3">
              <span className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <span>{t.maxRiskPercentage}</span>
                  <InfoTooltip text={t.tooltips.maxRiskPercentage} />
                </span>
                <span className="shrink-0 font-semibold text-slate-950">{position.maxRiskPercentage}%</span>
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
                {t.demoRange}: {minRiskPercentage}% {t.demoRangeSeparator} {maxRiskPercentage}% {t.perStrategy}
              </span>
              {isRiskAboveRecommended ? (
                <span className="mt-2 block rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs leading-5 text-amber-900">
                  {t.riskAboveOneWarning}
                </span>
              ) : null}
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
              {isIntradayTimeframe ? (
                <div className="mt-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                  {t.intradayTradingWarning}
                </div>
              ) : null}
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

            {strategyDecision && strategy && quote ? (
              <div className="rounded-md border border-slate-200 bg-panel p-4">
                <div className="text-base font-semibold text-slate-950">{t.strategyDetails}</div>

                <div className="mt-3 rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700">
                  <div className="font-semibold text-slate-950">{t.whyThisStrategy}</div>
                  <p className="mt-1">{t.intentPanelExplanations[strategyDecision.positionIntent]}</p>
                  <p className="mt-2">{decisionText?.whyThisStrategy}</p>
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
                  <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
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
                  <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                    <div className="font-semibold">{t.warnings}</div>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {strategyDecision.warnings.map((warning) => (
                        <li key={warning}>{translateMessage(warning, t)}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-base font-semibold text-slate-950">{t.strategyExplanation}</div>
                      <p className="mt-1 text-xs leading-5 text-slate-600">{t.aiExplanationNote}</p>
                    </div>
                    <button
                      type="button"
                      onClick={generateExplanation}
                      disabled={isExplanationLoading || !exportPayload}
                      className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isExplanationLoading ? t.generatingExplanation : t.generateExplanation}
                    </button>
                  </div>

                  {explanationError ? (
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      {explanationError}
                    </div>
                  ) : null}

                  {aiExplanationResponse ? (
                    <div className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
                      <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {aiExplanationResponse.source === "provider" ? t.providerConfigured : t.localDeterministicExplanation}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-950">{t.simpleExplanation}</div>
                        <p className="mt-1">{aiExplanationResponse.explanation.summary}</p>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-950">{t.whatTheSystemSaw}</div>
                        <ul className="mt-1 list-disc space-y-1 pl-4">
                          {aiExplanationResponse.explanation.whatTheSystemSaw.map((item) => (
                            <li key={item}>{translateMessage(item, t)}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-950">{t.whyThisDecision}</div>
                        <ul className="mt-1 list-disc space-y-1 pl-4">
                          {aiExplanationResponse.explanation.whyThisDecision.map((item) => (
                            <li key={item}>{translateMessage(item, t)}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-950">{t.riskExplanation}</div>
                        <p className="mt-1">{translateMessage(aiExplanationResponse.explanation.riskExplanation, t)}</p>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-950">{t.whatToWatchNext}</div>
                        <ul className="mt-1 list-disc space-y-1 pl-4">
                          {aiExplanationResponse.explanation.whatToWatchNext.map((item) => (
                            <li key={item}>{translateMessage(item, t)}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-950">{t.limitations}</div>
                        <ul className="mt-1 list-disc space-y-1 pl-4">
                          {aiExplanationResponse.explanation.limitations.map((item) => (
                            <li key={item}>{translateMessage(item, t)}</li>
                          ))}
                        </ul>
                      </div>
                      <p className="rounded-md border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600">
                        {aiExplanationResponse.explanation.notFinancialAdvice}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <MetricTile label={t.stopLoss} value={formatCurrency(strategy.stopLoss, pricePrecision)} tone="negative" />
                  <MetricTile label={t.trailingExit} value={formatCurrency(strategy.takeProfit, pricePrecision)} tone="positive" />
                </div>

                {backtestResult ? (
                  <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-base font-semibold text-slate-950">{t.simpleBacktest}</div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t.backtestSourceLabels[backtestResult.backtestSource]}
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <MetricTile label={t.backtestSource} value={t.backtestSourceLabels[backtestResult.backtestSource]} />
                      <MetricTile label={t.candlesUsed} value={String(backtestResult.candlesUsed)} />
                      <MetricTile label={t.entryTriggered} value={backtestResult.entryTriggered ? t.yes : t.no} />
                      <MetricTile label={t.stopHit} value={backtestResult.stopHit ? t.yes : t.no} tone={backtestResult.stopHit ? "negative" : "positive"} />
                      <MetricTile label={t.trailingExitHit} value={backtestResult.trailingExitHit ? t.yes : t.no} tone={backtestResult.trailingExitHit ? "positive" : "default"} />
                      <MetricTile label={t.backtestResult} value={t.winLossLabels[backtestResult.winLossResult]} tone={backtestResult.winLossResult === "win" ? "positive" : backtestResult.winLossResult === "loss" ? "negative" : "warning"} />
                      <MetricTile label={t.returnPercentage} value={formatPercentage(backtestResult.grossReturnPercentage)} tone={backtestResult.grossReturnPercentage >= 0 ? "positive" : "negative"} />
                      <MetricTile label={t.estimatedPnl} value={formatCurrency(backtestResult.estimatedPnL)} tone={backtestResult.estimatedPnL >= 0 ? "positive" : "negative"} />
                      <MetricTile label={t.maxDrawdown} value={formatPercentage(backtestResult.maxDrawdownPercentage)} tone={backtestResult.maxDrawdownPercentage < 0 ? "negative" : "default"} />
                    </div>
                    <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                      <div className="font-semibold text-slate-950">{t.limitations}</div>
                      <ul className="mt-1 list-disc space-y-1 pl-4">
                        {backtestResult.limitations.map((limitation) => (
                          <li key={limitation}>{translateMessage(limitation, t)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

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

        </form>

        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-lg font-semibold text-ink">
                <BarChart3 className="h-5 w-5 text-positive" />
                {t.entryVsCurrentPrice}
              </div>
              <div className="text-sm text-slate-500 sm:text-right">
                <div>{isLoadingContext ? t.loadingMarketContext : contextError ?? t.marketContextReady}</div>
                {localDateLabel ? (
                  <div className="mt-0.5 text-xs font-medium text-slate-500">
                    {t.localDate}: {localDateLabel}
                  </div>
                ) : null}
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
                      support={analysisContext?.technicals.support}
                      resistance={analysisContext?.technicals.resistance}
                      historySource={historyResponse?.source ?? analysisContext?.technicals.historySource}
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
                  value={
                    <span className="inline-flex items-center gap-2">
                      <TrendIcon state={analysisContext.sentiment.label} t={t} />
                      <span>({analysisContext.sentiment.score})</span>
                    </span>
                  }
                />
                <MetricTile label={t.liquidity} value={`${analysisContext.orderBook.liquidityScore}/100`} />
                <MetricTile label={t.derivatives} value={t.derivativesLabels[analysisContext.derivatives.longShortBias]} />
              </div>
            </section>
          ) : null}

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-lg font-semibold text-ink">
                  <Activity className="h-5 w-5 text-sky-700" />
                  {t.tokenScanner}
                </div>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{t.scannerSubtitle}</p>
              </div>
              <button
                type="button"
                onClick={scanTokens}
                disabled={isScannerLoading}
                className="inline-flex h-10 items-center justify-center rounded-md bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isScannerLoading ? t.scanningTokens : t.scanTokens}
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">{t.scannerScope}</span>
                <select
                  value={scannerScope}
                  onChange={(event) => setScannerScope(event.target.value as ScannerScope)}
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="current">{t.scannerScopeCurrent}</option>
                  <option value="specific">{t.scannerScopeSpecific}</option>
                  <option value="group">{t.scannerScopeGroup}</option>
                </select>
              </label>
              {scannerScope === "specific" ? (
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">{t.scannerSpecificToken}</span>
                  <select
                    value={scannerSpecificSymbol}
                    onChange={(event) => setScannerSpecificSymbol(event.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                  >
                    {eligibleTokenUniverse.map((token) => (
                      <option key={token.id} value={token.symbol}>
                        {token.symbol} - {token.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {scannerScope === "current" ? (
                <div className="block">
                  <span className="text-sm font-medium text-slate-700">{t.scannerCurrentToken}</span>
                  <div className="mt-1 flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-950">
                    {selectedToken.symbol} - {selectedToken.name}
                  </div>
                </div>
              ) : null}
              <label className="block">
                <span className="text-sm font-medium text-slate-700">{t.scannerUniverse}</span>
                <select
                  value={scannerUniverse}
                  onChange={(event) => setScannerUniverse(event.target.value as ScannerUniverse)}
                  disabled={scannerScope !== "group"}
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="beginner">{t.beginnerTokens}</option>
                  <option value="advanced">{t.advancedTokens}</option>
                  <option value="all">{t.allEligibleTokens}</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">{t.positionIntent}</span>
                <select
                  value={scannerIntent}
                  onChange={(event) => setScannerIntent(event.target.value as PositionIntent)}
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                >
                  {positionIntents.map((intent) => (
                    <option key={intent} value={intent}>
                      {t.positionIntentLabels[intent]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">{t.strategyTimeframe}</span>
                <select
                  value={scannerTimeframe}
                  onChange={(event) => setScannerTimeframe(event.target.value as StrategyTimeframe)}
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                >
                  {strategyTimeframes.map((timeframe) => (
                    <option key={timeframe} value={timeframe}>
                      {t.timeframeLabels[timeframe]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">{t.maxTokensToScan}</span>
                <select
                  value={scannerMaxTokens}
                  onChange={(event) => setScannerMaxTokens(Number(event.target.value) as (typeof scannerMaxOptions)[number])}
                  disabled={scannerScope !== "group"}
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                >
                  {scannerMaxOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {scannerError ? (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {scannerError}
              </div>
            ) : null}

            {scannerResults.length ? (
              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                {scannerResults.map((result) => (
                  <div key={result.symbol} className="rounded-lg border border-slate-200 bg-panel p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {t.possibleMovementToReview}
                        </div>
                        <div className="mt-1 text-lg font-semibold text-slate-950">
                          {result.symbol} - {result.name}
                        </div>
                        <p className="mt-1 text-sm leading-5 text-slate-600">{translateMessage(result.reason, t)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => loadScannerResult(result)}
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                      >
                        {t.loadInMainAnalysis}
                      </button>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <MetricTile label={t.currentPrice} value={formatCurrency(result.price, result.price < 1 ? 6 : 2)} />
                      <MetricTile
                        label={t.move24h}
                        value={formatPercentage(result.percentChange24h)}
                        tone={result.percentChange24h < 0 ? "negative" : "positive"}
                      />
                      <MetricTile label={t.trend} value={<TrendIcon state={result.trendState} t={t} />} />
                      <MetricTile label="RSI 14" value={result.rsi14 === null ? t.notEnoughHistory : result.rsi14.toFixed(0)} />
                      <MetricTile label={t.maAlignment} value={<TrendIcon state={result.maAlignment} t={t} />} />
                      <MetricTile
                        label={t.riskBadge}
                        value={t.riskBadgeLabels[result.riskBadge]}
                        tone={getRiskBadgeTone(result.riskBadge)}
                      />
                      <MetricTile label={t.intentAction} value={t.intentActionLabels[result.intentAction]} />
                      <MetricTile
                        label={t.stopStatus}
                        value={t.stopStatusLabels[result.stopStatus]}
                        tone={result.stopStatus === "stop_breached" ? "negative" : result.stopStatus === "near_stop" ? "warning" : "positive"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

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
                    label={t.riskBadge}
                    value={t.riskBadgeLabels[strategyDecision.riskBadge]}
                    tone={getRiskBadgeTone(strategyDecision.riskBadge)}
                  />
                  <MetricTile
                    label={t.strategyFit}
                    value={t.fitLabels[strategyDecision.fit]}
                    tone={getFitTone(strategyDecision.fit)}
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
                    label={t.positionSizeMode}
                    value={t.sizingModeLabels[strategyDecision.sizingMode]}
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
                      setLastExportedJson(strategyJson);
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
      ) : (
        <section className="grid gap-7 xl:grid-cols-[minmax(360px,0.8fr)_minmax(0,1.2fr)]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
              <BarChart3 className="h-5 w-5 text-sky-700" />
              {t.paperBacktestTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{t.paperBacktestIntro}</p>

            <label className="mt-5 block">
              <span className="text-sm font-medium text-slate-700">{t.pastedJsonLabel}</span>
              <textarea
                value={paperJsonInput}
                onChange={(event) => {
                  setPaperJsonInput(event.target.value);
                  setPaperBacktestError(null);
                }}
                className="mt-2 min-h-[420px] w-full rounded-md border border-slate-300 bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-100 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                spellCheck={false}
              />
            </label>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={runPaperBacktestFromInput}
                disabled={isPaperBacktestLoading || !paperJsonInput.trim()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Play className="h-4 w-4" />
                {isPaperBacktestLoading ? t.runningPaperBacktest : t.runPaperBacktest}
              </button>
              {lastExportedJson ? (
                <button
                  type="button"
                  onClick={() => {
                    setPaperJsonInput(lastExportedJson);
                    setPaperBacktestError(null);
                  }}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  {t.useLatestExportedJson}
                </button>
              ) : null}
            </div>

            {paperBacktestError ? (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                {paperBacktestError}
              </div>
            ) : null}

          </div>

          <div className="space-y-6">
            {paperBacktestResult ? (
              <>
                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div className="text-lg font-semibold text-ink">{t.paperBacktestTab}</div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t.paperBacktestSourceLabels[paperBacktestResult.dataSource]}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricTile label={t.symbol} value={paperBacktestResult.symbol} />
                    <MetricTile label={t.pairUsed} value={paperBacktestResult.pairUsed} />
                    <MetricTile label={t.strategyTimeframe} value={t.timeframeLabels[paperBacktestResult.timeframe]} />
                    <MetricTile label={t.dataSource} value={t.paperBacktestSourceLabels[paperBacktestResult.dataSource]} />
                    <MetricTile label={t.candlesUsed} value={String(paperBacktestResult.candlesUsed)} />
                    <MetricTile label={t.positionIntent} value={t.positionIntentLabels[paperBacktestResult.positionIntent]} />
                    <MetricTile
                      label={t.riskBadge}
                      value={t.riskBadgeLabels[paperBacktestResult.riskBadge]}
                      tone={getRiskBadgeTone(paperBacktestResult.riskBadge)}
                    />
                    <MetricTile label={t.entryPrice} value={formatCurrency(paperBacktestResult.entryPrice, paperBacktestResult.entryPrice < 1 ? 6 : 2)} />
                    <MetricTile label={t.stopLoss} value={formatCurrency(paperBacktestResult.stopLoss, paperBacktestResult.stopLoss < 1 ? 6 : 2)} tone="negative" />
                    <MetricTile label={t.dynamicExit} value={formatCurrency(paperBacktestResult.dynamicExit, paperBacktestResult.dynamicExit < 1 ? 6 : 2)} tone="positive" />
                    <MetricTile label={t.entryTriggered} value={paperBacktestResult.entryTriggered ? t.yes : t.no} />
                    <MetricTile label={t.stopHit} value={paperBacktestResult.stopHit ? t.yes : t.no} tone={paperBacktestResult.stopHit ? "negative" : "positive"} />
                    <MetricTile label={t.dynamicExitHit} value={paperBacktestResult.dynamicExitHit ? t.yes : t.no} tone={paperBacktestResult.dynamicExitHit ? "positive" : "default"} />
                    <MetricTile
                      label={t.backtestResult}
                      value={t.paperBacktestResultLabels[paperBacktestResult.result]}
                      tone={paperBacktestResult.result === "win" ? "positive" : paperBacktestResult.result === "loss" ? "negative" : "warning"}
                    />
                    <MetricTile
                      label={t.returnPercentage}
                      value={formatPercentage(paperBacktestResult.returnPercentage)}
                      tone={paperBacktestResult.returnPercentage >= 0 ? "positive" : "negative"}
                    />
                    <MetricTile
                      label={t.estimatedPnl}
                      value={formatCurrency(paperBacktestResult.estimatedPnL)}
                      tone={paperBacktestResult.estimatedPnL >= 0 ? "positive" : "negative"}
                    />
                    <MetricTile
                      label={t.maxDrawdown}
                      value={formatPercentage(paperBacktestResult.maxDrawdownPercentage)}
                      tone={paperBacktestResult.maxDrawdownPercentage < 0 ? "negative" : "default"}
                    />
                  </div>

                  <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                    <div className="font-semibold text-slate-950">{getLocalizedPaperBacktestMessage(paperBacktestResult, t)}</div>
                    <ul className="mt-2 list-disc space-y-1 pl-4">
                      <li>{t.paperBacktestSourceNoteLabels[paperBacktestResult.dataSource]}</li>
                      <li>{t.paperBacktestSafetyNote}</li>
                    </ul>
                  </div>
                </section>

                <PaperBacktestChart result={paperBacktestResult} t={t} />
              </>
            ) : (
              <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-soft">
                {t.noPaperResultsYet}
              </section>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
