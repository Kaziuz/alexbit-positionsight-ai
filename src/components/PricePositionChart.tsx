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
import type { MarketQuote, PositionInput, StrategySpec } from "@/types/strategy";

type PricePositionChartProps = {
  position: PositionInput;
  quote: MarketQuote;
  strategy: StrategySpec;
};

export function PricePositionChart({ position, quote, strategy }: PricePositionChartProps) {
  const pricePrecision = quote.price < 1 ? 6 : 2;
  const data = [
    { label: "Stop", price: strategy.stopLoss },
    { label: "Invalidation", price: strategy.invalidationLevel },
    { label: "Entry", price: position.entryPrice },
    { label: "Current", price: quote.price },
    { label: "Take Profit", price: strategy.takeProfit },
  ];
  const priceValues = data.map((item) => item.price);
  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);
  const pricePadding = Math.max((maxPrice - minPrice) * 0.18, quote.price * 0.01);
  const profitable = quote.price >= position.entryPrice;
  const levels = [
    { label: "Stop loss", value: strategy.stopLoss, className: "border-red-200 bg-red-50 text-red-700" },
    {
      label: "Invalidation",
      value: strategy.invalidationLevel,
      className: "border-amber-200 bg-amber-50 text-amber-800",
    },
    { label: "Entry", value: position.entryPrice, className: "border-blue-200 bg-blue-50 text-blue-700" },
    {
      label: "Current",
      value: quote.price,
      className: profitable
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-red-200 bg-red-50 text-red-700",
    },
    { label: "Take profit", value: strategy.takeProfit, className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  ];

  return (
    <div className="w-full min-w-0">
      <div className="h-[310px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 16, bottom: 12, left: 6 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
            <XAxis dataKey="label" tick={{ fill: "#475569", fontSize: 12 }} tickLine={false} interval={0} />
            <YAxis
              domain={[minPrice - pricePadding, maxPrice + pricePadding]}
              tick={{ fill: "#475569", fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(Number(value), quote.price < 1 ? 5 : 0)}
              width={76}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value), pricePrecision), "Price"]}
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
    </div>
  );
}
