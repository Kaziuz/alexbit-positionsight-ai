"use client";

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
import type { TooltipContentProps } from "recharts/types/component/Tooltip";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { formatCurrency, formatPercentage } from "@/lib/format";
import { translations, type Language } from "@/lib/i18n";
import type { MarketQuote, PositionInput, StrategySpec, StrategyTimeframe } from "@/types/strategy";

type PricePositionChartProps = {
  position: PositionInput;
  quote: MarketQuote;
  strategy: StrategySpec;
  language: Language;
};

type ChartPointType = "historical_ohlcv" | "historical_estimate" | "live_quote" | "strategy_projection";

type MarkerRole = "entry" | "current" | "stop" | "takeProfit" | "estimatedPath";

type ProjectionPoint = {
  x: number;
  timeLabel: string;
  rawTime?: string;
  price: number;
  pointType: ChartPointType;
  markerRole?: MarkerRole;
};

type ChartLabels = {
  stop: string;
  entry: string;
  current: string;
  takeProfit: string;
  price: string;
  asset: string;
  timeframe: string;
  point: string;
  time: string;
  close: string;
  distanceFromEntry: string;
  source: string;
  estimatedProjection: string;
  estimatedPath: string;
  pointType: string;
  pointTypes: Record<ChartPointType, string>;
  sources: Record<"coinmarketcap" | "estimated", string>;
  timeLabels: Record<StrategyTimeframe, readonly string[]>;
};

type TimeframeTick = {
  x: number;
  label: string;
};

type StrategyLevel = {
  key: MarkerRole;
  label: string;
  value: number;
  color: string;
  className: string;
  markerX: number;
  source: string;
  meaning: string;
};

const fallbackTimeZone = "UTC";

function getBaseDate(lastUpdated: string) {
  const parsed = new Date(lastUpdated);

  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function addTime(baseDate: Date, amount: number, unit: "minute" | "hour" | "day" | "week" | "month") {
  const date = new Date(baseDate.getTime());

  if (unit === "minute") {
    date.setMinutes(date.getMinutes() + amount);
  } else if (unit === "hour") {
    date.setHours(date.getHours() + amount);
  } else if (unit === "day") {
    date.setDate(date.getDate() + amount);
  } else if (unit === "week") {
    date.setDate(date.getDate() + amount * 7);
  } else {
    date.setMonth(date.getMonth() + amount);
  }

  return date;
}

function getTimeframeTickDates(baseDate: Date, timeframe: StrategyTimeframe) {
  if (timeframe === "15m") {
    return [-45, -30, 0, 15, 30].map((amount) => addTime(baseDate, amount, "minute"));
  }

  if (timeframe === "30m") {
    return [-90, -60, 0, 30, 60].map((amount) => addTime(baseDate, amount, "minute"));
  }

  if (timeframe === "1h") {
    return [-3, -2, 0, 1, 2].map((amount) => addTime(baseDate, amount, "hour"));
  }

  if (timeframe === "1w") {
    return [-4, -2, 0, 1, 2].map((amount) => addTime(baseDate, amount, "week"));
  }

  if (timeframe === "1mo") {
    return [-3, -1, 0, 1, 2].map((amount) => addTime(baseDate, amount, "month"));
  }

  return [-3, -1, 0, 1, 2].map((amount) => addTime(baseDate, amount, "day"));
}

function getTimeframeTicks(
  baseDate: Date,
  timeframe: StrategyTimeframe,
  labels: ChartLabels,
): TimeframeTick[] {
  return getTimeframeTickDates(baseDate, timeframe).map((date, index) => ({
    x: date.getTime(),
    label: labels.timeLabels[timeframe][index] ?? "",
  }));
}

function getProjectionData(
  position: PositionInput,
  quote: MarketQuote,
  strategy: StrategySpec,
  labels: ChartLabels,
  baseDate: Date,
) {
  const baseRange = Math.max(
    Math.abs(strategy.takeProfit - position.entryPrice),
    Math.abs(position.entryPrice - strategy.stopLoss),
    quote.price * 0.015,
  );

  const midpoint = (position.entryPrice + quote.price) / 2;
  const makePoint = (
    timeframe: StrategyTimeframe,
    index: number,
    price: number,
    pointType: ChartPointType,
    markerRole?: ProjectionPoint["markerRole"],
  ): ProjectionPoint => ({
    x: getTimeframeTickDates(baseDate, timeframe)[index]?.getTime() ?? baseDate.getTime(),
    timeLabel:
      labels.timeLabels[timeframe][index] ??
      labels.timeLabels[timeframe][labels.timeLabels[timeframe].length - 1] ??
      "",
    rawTime: getTimeframeTickDates(baseDate, timeframe)[index]?.toISOString(),
    price,
    pointType,
    markerRole,
  });

  const projectionByTimeframe = {
    "15m": [
      makePoint("15m", 0, position.entryPrice, "historical_estimate", "entry"),
      makePoint("15m", 1, position.entryPrice - baseRange * 0.45, "historical_estimate"),
      makePoint("15m", 2, quote.price, "live_quote", "current"),
      makePoint("15m", 3, quote.price + baseRange * 0.36, "strategy_projection"),
      makePoint("15m", 4, quote.price - baseRange * 0.22, "strategy_projection"),
    ],
    "30m": [
      makePoint("30m", 0, position.entryPrice, "historical_estimate", "entry"),
      makePoint("30m", 1, midpoint - baseRange * 0.28, "historical_estimate"),
      makePoint("30m", 2, quote.price, "live_quote", "current"),
      makePoint("30m", 3, quote.price + baseRange * 0.25, "strategy_projection"),
      makePoint("30m", 4, strategy.takeProfit, "strategy_projection", "takeProfit"),
    ],
    "1h": [
      makePoint("1h", 0, position.entryPrice, "historical_estimate", "entry"),
      makePoint("1h", 1, midpoint - baseRange * 0.16, "historical_estimate"),
      makePoint("1h", 2, quote.price, "live_quote", "current"),
      makePoint("1h", 3, quote.price + baseRange * 0.18, "strategy_projection"),
      makePoint("1h", 4, strategy.takeProfit, "strategy_projection", "takeProfit"),
    ],
    "1d": [
      makePoint("1d", 0, position.entryPrice, "historical_estimate", "entry"),
      makePoint("1d", 1, midpoint, "historical_estimate"),
      makePoint("1d", 2, quote.price, "live_quote", "current"),
      makePoint("1d", 3, quote.price + baseRange * 0.12, "strategy_projection"),
      makePoint("1d", 4, strategy.takeProfit, "strategy_projection", "takeProfit"),
    ],
    "1w": [
      makePoint("1w", 0, position.entryPrice, "historical_estimate", "entry"),
      makePoint("1w", 1, midpoint, "historical_estimate"),
      makePoint("1w", 2, quote.price, "live_quote", "current"),
      makePoint("1w", 3, quote.price + baseRange * 0.18, "strategy_projection"),
      makePoint("1w", 4, strategy.takeProfit, "strategy_projection", "takeProfit"),
    ],
    "1mo": [
      makePoint("1mo", 0, position.entryPrice, "historical_estimate", "entry"),
      makePoint("1mo", 1, midpoint, "historical_estimate"),
      makePoint("1mo", 2, quote.price, "live_quote", "current"),
      makePoint("1mo", 3, quote.price + baseRange * 0.24, "strategy_projection"),
      makePoint("1mo", 4, strategy.takeProfit, "strategy_projection", "takeProfit"),
    ],
  } satisfies Record<PositionInput["strategyTimeframe"], ProjectionPoint[]>;

  return projectionByTimeframe[position.strategyTimeframe];
}

function formatLocalTimeLabel(
  time: string,
  timeframe: StrategyTimeframe,
  language: Language,
  timeZone: string,
) {
  const date = new Date(time);

  if (Number.isNaN(date.getTime())) {
    return time;
  }

  if (timeframe === "15m" || timeframe === "30m" || timeframe === "1h") {
    return new Intl.DateTimeFormat(language === "es" ? "es" : "en", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    }).format(date);
  }

  return new Intl.DateTimeFormat(language === "es" ? "es" : "en", {
    month: "short",
    day: "numeric",
    timeZone,
  }).format(date);
}

export function PricePositionChart({ position, quote, strategy, language }: PricePositionChartProps) {
  const [localTimeZone, setLocalTimeZone] = useState(fallbackTimeZone);
  const t = translations[language];
  const chartLabels = t.chartLabels;
  const pricePrecision = quote.price < 1 ? 6 : 2;
  const baseDate = useMemo(() => getBaseDate(quote.lastUpdated), [quote.lastUpdated]);
  const currentX = baseDate.getTime();
  const timeframeTicks = useMemo(
    () => getTimeframeTicks(baseDate, position.strategyTimeframe, chartLabels),
    [baseDate, chartLabels, position.strategyTimeframe],
  );
  const timeframeTickLabels = useMemo(
    () => new Map(timeframeTicks.map((tick) => [tick.x, tick.label])),
    [timeframeTicks],
  );
  const data = getProjectionData(position, quote, strategy, chartLabels, baseDate);
  const xTicks = timeframeTicks.map((tick) => tick.x);
  const priceValues = [
    ...data.map((item) => item.price),
    strategy.stopLoss,
    position.entryPrice,
    quote.price,
    strategy.takeProfit,
  ];
  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);
  const pricePadding = Math.max((maxPrice - minPrice) * 0.18, quote.price * 0.01);
  const dataMinX = Math.min(...data.map((item) => item.x), ...xTicks, currentX);
  const dataMaxX = Math.max(...data.map((item) => item.x), ...xTicks, currentX);
  const markerPositions = {
    stop: data[0]?.x ?? currentX,
    entry: data[1]?.x ?? currentX,
    current: data[2]?.x ?? currentX,
    takeProfit: data[data.length - 1]?.x ?? currentX,
  };
  const levels: StrategyLevel[] = [
    {
      key: "stop",
      label: chartLabels.stop,
      value: strategy.stopLoss,
      color: "#dc2626",
      className: "border-red-200 bg-red-50 text-red-700",
      markerX: markerPositions.stop,
      source: chartLabels.sourceLabels.strategyEngine,
      meaning: chartLabels.meanings.stop,
    },
    {
      key: "entry",
      label: chartLabels.entry,
      value: position.entryPrice,
      color: "#2563eb",
      className: "border-blue-200 bg-blue-50 text-blue-700",
      markerX: markerPositions.entry,
      source: chartLabels.sourceLabels.userInput,
      meaning: chartLabels.meanings.entry,
    },
    {
      key: "current",
      label: chartLabels.current,
      value: quote.price,
      color: "#f97316",
      className: "border-orange-200 bg-orange-50 text-orange-700",
      markerX: markerPositions.current,
      source: chartLabels.sourceLabels.coinMarketCapLiveQuote,
      meaning: chartLabels.meanings.current,
    },
    {
      key: "takeProfit",
      label: chartLabels.takeProfit,
      value: strategy.takeProfit,
      color: "#16a34a",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      markerX: markerPositions.takeProfit,
      source: chartLabels.sourceLabels.strategyEngine,
      meaning: chartLabels.meanings.takeProfit,
    },
  ];
  useEffect(() => {
    setLocalTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || fallbackTimeZone);
  }, []);

  function formatAxisTick(value: number) {
    const knownLabel = timeframeTickLabels.get(Number(value));

    if (knownLabel) {
      return knownLabel;
    }

    const pointLabel = data.find((item) => item.x === Number(value))?.timeLabel;

    if (pointLabel) {
      return pointLabel;
    }

    return formatLocalTimeLabel(
      new Date(Number(value)).toISOString(),
      position.strategyTimeframe,
      language,
      localTimeZone,
    );
  }

  const markerPoints: ProjectionPoint[] = levels.map((level) => ({
    x: level.markerX,
    timeLabel: formatAxisTick(level.markerX),
    rawTime: new Date(level.markerX).toISOString(),
    price: level.value,
    pointType: level.key === "current" ? "live_quote" : "strategy_projection",
    markerRole: level.key,
  }));

  function getMarkerLevel(role: MarkerRole | undefined) {
    return levels.find((level) => level.key === role);
  }

  function CustomTooltip({ active, payload }: Partial<TooltipContentProps<ValueType, NameType>>) {
    const point = payload?.[0]?.payload as ProjectionPoint | undefined;

    if (!active || !point) {
      return null;
    }

    const markerLevel = getMarkerLevel(point.markerRole);
    const distanceFromEntry = ((point.price - position.entryPrice) / position.entryPrice) * 100;
    const source = markerLevel?.source ?? chartLabels.sourceLabels.estimatedStrategyPath;
    const pointType = markerLevel?.label ?? chartLabels.estimatedPath;
    const meaning = markerLevel?.meaning ?? chartLabels.meanings.estimatedPath;

    return (
      <div className="min-w-56 rounded-md border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-700 shadow-soft">
        <div className="font-semibold text-slate-950">{position.symbol}</div>
        <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-3">
          <span className="text-slate-500">{chartLabels.asset}</span>
          <span className="text-right font-medium text-slate-900">{position.symbol}</span>
          <span className="text-slate-500">{chartLabels.timeframe}</span>
          <span className="text-right font-medium text-slate-900">{t.timeframeLabels[position.strategyTimeframe]}</span>
          <span className="text-slate-500">{chartLabels.point}</span>
          <span className="text-right font-medium text-slate-900">{pointType}</span>
          <span className="text-slate-500">{chartLabels.time}</span>
          <span className="text-right font-medium text-slate-900">{point.rawTime ? point.timeLabel : point.timeLabel}</span>
          <span className="text-slate-500">{chartLabels.close}</span>
          <span className="text-right font-medium text-slate-900">{formatCurrency(point.price, pricePrecision)}</span>
          <span className="text-slate-500">{chartLabels.distanceFromEntry}</span>
          <span className="text-right font-medium text-slate-900">{formatPercentage(distanceFromEntry)}</span>
          <span className="text-slate-500">{chartLabels.meaning}</span>
          <span className="text-right font-medium text-slate-900">{meaning}</span>
          <span className="text-slate-500">{chartLabels.source}</span>
          <span className="text-right font-medium text-slate-900">{source}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 18, bottom: 18, left: 6 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
            <XAxis
              dataKey="x"
              type="number"
              domain={[dataMinX, dataMaxX]}
              tick={{ fill: "#475569", fontSize: 12 }}
              tickFormatter={(value) => formatAxisTick(Number(value))}
              tickLine={false}
              ticks={xTicks}
            />
            <YAxis
              domain={[minPrice - pricePadding, maxPrice + pricePadding]}
              tick={{ fill: "#475569", fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(Number(value), quote.price < 1 ? 5 : 0)}
              width={76}
            />
            <Tooltip
              content={<CustomTooltip />}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                boxShadow: "0 14px 32px rgba(15, 23, 42, 0.12)",
              }}
            />
            {levels.map((level) => (
              <ReferenceLine
                key={level.key}
                y={level.value}
                stroke={level.color}
                strokeWidth={2}
                ifOverflow="extendDomain"
                opacity={0.82}
              />
            ))}
            {markerPoints.map((point) => {
              const markerLevel = getMarkerLevel(point.markerRole);

              return markerLevel ? (
                <ReferenceDot
                  key={`${markerLevel.key}-strategy-marker`}
                  x={point.x}
                  y={point.price}
                  r={6}
                  fill={markerLevel.color}
                  stroke="#ffffff"
                  strokeWidth={2}
                  ifOverflow="extendDomain"
                />
              ) : null;
            })}
            <Line
              data={markerPoints}
              type="linear"
              dataKey="price"
              stroke="transparent"
              dot={false}
              activeDot={(props) => {
                const point = props.payload as ProjectionPoint | undefined;
                const markerLevel = getMarkerLevel(point?.markerRole);

                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={7}
                    fill={markerLevel?.color ?? "#334155"}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                );
              }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#1e293b"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {levels.map((level) => (
          <div key={level.label} className={`rounded-md border px-3 py-2 ${level.className}`}>
            <div className="text-[11px] font-semibold uppercase tracking-wide">{level.label}</div>
            <div className="mt-0.5 text-sm font-semibold">{formatCurrency(level.value, pricePrecision)}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        {quote.source === "coinmarketcap" ? t.chartDataNotes.live : t.chartDataNotes.mock}
      </p>
    </div>
  );
}
