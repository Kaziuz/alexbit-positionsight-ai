import { NextResponse } from "next/server";
import { getMockMarketContext } from "@/data/mock-market";
import { parseLocalizedNumberInput } from "@/lib/number-input";
import { generateStrategyDecision } from "@/lib/strategy-engine";
import type { PositionInput, StrategyMode, Timeframe } from "@/types/strategy";

type PositionRequestBody = {
  symbol?: unknown;
  entryPrice?: unknown;
  positionSize?: unknown;
  timeframe?: unknown;
  maxRiskPercentage?: unknown;
  strategyMode?: unknown;
};

function parseRequestNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? { ok: true as const, value } : { ok: false as const };
  }

  if (typeof value === "string") {
    const parsed = parseLocalizedNumberInput(value);
    return parsed.ok ? { ok: true as const, value: parsed.value } : { ok: false as const };
  }

  return { ok: false as const };
}

export async function POST(request: Request) {
  const body = (await request.json()) as PositionRequestBody;
  const symbol = typeof body.symbol === "string" ? body.symbol : "";
  const entryPrice = parseRequestNumber(body.entryPrice);
  const positionSize = parseRequestNumber(body.positionSize);
  const maxRiskPercentage = parseRequestNumber(body.maxRiskPercentage);
  const timeframe = typeof body.timeframe === "string" ? (body.timeframe as Timeframe) : undefined;
  const strategyMode = typeof body.strategyMode === "string" ? (body.strategyMode as StrategyMode) : "auto";
  const context = getMockMarketContext(symbol);

  if (!context) {
    return NextResponse.json({ error: "No market context available for token." }, { status: 404 });
  }

  if (
    !entryPrice.ok ||
    entryPrice.value <= 0 ||
    !positionSize.ok ||
    positionSize.value <= 0 ||
    !maxRiskPercentage.ok ||
    maxRiskPercentage.value <= 0 ||
    !timeframe
  ) {
    return NextResponse.json({ error: "Position details are incomplete." }, { status: 400 });
  }

  const normalizedPosition: PositionInput = {
    symbol,
    entryPrice: entryPrice.value,
    positionSize: positionSize.value,
    timeframe,
    maxRiskPercentage: maxRiskPercentage.value,
    strategyMode,
  };

  return NextResponse.json(generateStrategyDecision(normalizedPosition, context, strategyMode));
}
