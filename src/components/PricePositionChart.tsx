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
  const data = [
    { label: "Stop", price: strategy.stopLoss },
    { label: "Entry", price: position.entryPrice },
    { label: "Current", price: quote.price },
    { label: "Target", price: strategy.takeProfit },
  ];
  const profitable = quote.price >= position.entryPrice;

  return (
    <div className="h-[320px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 18, right: 20, bottom: 10, left: 8 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
          <XAxis dataKey="label" tick={{ fill: "#475569", fontSize: 12 }} tickLine={false} />
          <YAxis
            domain={["dataMin", "dataMax"]}
            tick={{ fill: "#475569", fontSize: 12 }}
            tickFormatter={(value) => formatCurrency(Number(value), quote.price < 1 ? 5 : 0)}
            width={72}
          />
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value), quote.price < 1 ? 6 : 2), "Price"]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              boxShadow: "0 14px 32px rgba(15, 23, 42, 0.12)",
            }}
          />
          <ReferenceLine
            y={position.entryPrice}
            stroke="#2563eb"
            strokeDasharray="5 5"
            label={{ value: "Entry", fill: "#2563eb", fontSize: 12, position: "insideTopRight" }}
          />
          <ReferenceLine
            y={strategy.stopLoss}
            stroke="#dc2626"
            strokeDasharray="5 5"
            label={{ value: "Stop", fill: "#dc2626", fontSize: 12, position: "insideBottomRight" }}
          />
          <ReferenceLine
            y={strategy.takeProfit}
            stroke="#0f9f6e"
            strokeDasharray="5 5"
            label={{ value: "Target", fill: "#0f9f6e", fontSize: 12, position: "insideTopLeft" }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke={profitable ? "#0f9f6e" : "#dc2626"}
            strokeWidth={3}
            dot={{ r: 5, fill: profitable ? "#0f9f6e" : "#dc2626", strokeWidth: 0 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
