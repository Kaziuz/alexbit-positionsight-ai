"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import { translations, type Language } from "@/lib/i18n";
import type { MarketQuote, PositionInput, StrategySpec, StrategyTimeframe } from "@/types/strategy";

type PricePositionChartProps = {
  position: PositionInput;
  quote: MarketQuote;
  strategy: StrategySpec;
  language: Language;
};

type ChartPointType = "historical_estimate" | "live_quote" | "strategy_projection";

type ProjectionPoint = {
  timeLabel: string;
  price: number;
  pointType: ChartPointType;
  markerRole?: "entry" | "current" | "take_profit";
};

type ChartLabels = {
  stop: string;
  invalidation: string;
  entry: string;
  current: string;
  takeProfit: string;
  price: string;
  estimatedProjection: string;
  pointType: string;
  pointTypes: Record<ChartPointType, string>;
  timeLabels: Record<StrategyTimeframe, readonly string[]>;
};

function getProjectionData(
  position: PositionInput,
  quote: MarketQuote,
  strategy: StrategySpec,
  labels: ChartLabels,
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
    timeLabel: labels.timeLabels[timeframe][index],
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
      makePoint("30m", 4, strategy.takeProfit, "strategy_projection", "take_profit"),
    ],
    "1h": [
      makePoint("1h", 0, position.entryPrice, "historical_estimate", "entry"),
      makePoint("1h", 1, midpoint - baseRange * 0.16, "historical_estimate"),
      makePoint("1h", 2, quote.price, "live_quote", "current"),
      makePoint("1h", 3, quote.price + baseRange * 0.18, "strategy_projection"),
      makePoint("1h", 4, strategy.takeProfit, "strategy_projection", "take_profit"),
    ],
    "1d": [
      makePoint("1d", 0, position.entryPrice, "historical_estimate", "entry"),
      makePoint("1d", 1, midpoint, "historical_estimate"),
      makePoint("1d", 2, quote.price, "live_quote", "current"),
      makePoint("1d", 3, quote.price + baseRange * 0.12, "strategy_projection"),
      makePoint("1d", 4, strategy.takeProfit, "strategy_projection", "take_profit"),
    ],
    "1w": [
      makePoint("1w", 0, position.entryPrice, "historical_estimate", "entry"),
      makePoint("1w", 1, midpoint, "historical_estimate"),
      makePoint("1w", 2, quote.price, "live_quote", "current"),
      makePoint("1w", 3, quote.price + baseRange * 0.18, "strategy_projection"),
      makePoint("1w", 4, strategy.takeProfit, "strategy_projection", "take_profit"),
    ],
    "1mo": [
      makePoint("1mo", 0, position.entryPrice, "historical_estimate", "entry"),
      makePoint("1mo", 1, midpoint, "historical_estimate"),
      makePoint("1mo", 2, quote.price, "live_quote", "current"),
      makePoint("1mo", 3, quote.price + baseRange * 0.24, "strategy_projection"),
      makePoint("1mo", 4, strategy.takeProfit, "strategy_projection", "take_profit"),
    ],
  } satisfies Record<PositionInput["strategyTimeframe"], ProjectionPoint[]>;

  return projectionByTimeframe[position.strategyTimeframe];
}

export function PricePositionChart({ position, quote, strategy, language }: PricePositionChartProps) {
  const t = translations[language];
  const chartLabels = t.chartLabels;
  const pricePrecision = quote.price < 1 ? 6 : 2;
  const data = getProjectionData(position, quote, strategy, chartLabels);
  const priceValues = [
    ...data.map((item) => item.price),
    strategy.stopLoss,
    strategy.invalidationLevel,
    position.entryPrice,
    quote.price,
    strategy.takeProfit,
  ];
  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);
  const pricePadding = Math.max((maxPrice - minPrice) * 0.18, quote.price * 0.01);
  const profitable = quote.price >= position.entryPrice;
  const levels = [
    { label: chartLabels.stop, value: strategy.stopLoss, className: "border-red-200 bg-red-50 text-red-700" },
    {
      label: chartLabels.invalidation,
      value: strategy.invalidationLevel,
      className: "border-amber-200 bg-amber-50 text-amber-800",
    },
    { label: chartLabels.entry, value: position.entryPrice, className: "border-blue-200 bg-blue-50 text-blue-700" },
    {
      label: chartLabels.current,
      value: quote.price,
      className: profitable
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-red-200 bg-red-50 text-red-700",
    },
    { label: chartLabels.takeProfit, value: strategy.takeProfit, className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  ];

  return (
    <div className="w-full min-w-0">
      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 18, bottom: 18, left: 6 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
            <XAxis dataKey="timeLabel" tick={{ fill: "#475569", fontSize: 12 }} tickLine={false} interval={0} />
            <YAxis
              domain={[minPrice - pricePadding, maxPrice + pricePadding]}
              tick={{ fill: "#475569", fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(Number(value), quote.price < 1 ? 5 : 0)}
              width={76}
            />
            <Tooltip
              formatter={(value, _name, item) => {
                const pointType = (item.payload as ProjectionPoint).pointType;

                return [
                  formatCurrency(Number(value), pricePrecision),
                  `${chartLabels.price} · ${chartLabels.pointTypes[pointType]}`,
                ];
              }}
              labelFormatter={(label) => `${label} · ${chartLabels.estimatedProjection}`}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                boxShadow: "0 14px 32px rgba(15, 23, 42, 0.12)",
              }}
            />
            <ReferenceLine y={strategy.stopLoss} stroke="#dc2626" strokeDasharray="5 5" />
            <ReferenceLine y={strategy.invalidationLevel} stroke="#b7791f" strokeDasharray="3 5" />
            <ReferenceLine y={position.entryPrice} stroke="#2563eb" strokeDasharray="5 5" />
            <ReferenceLine y={quote.price} stroke={profitable ? "#0f9f6e" : "#dc2626"} strokeDasharray="2 4" />
            <ReferenceLine y={strategy.takeProfit} stroke="#0f9f6e" strokeDasharray="5 5" />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#334155"
              strokeWidth={3}
              dot={{ r: 5, fill: "#ffffff", stroke: "#334155", strokeWidth: 2 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
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
