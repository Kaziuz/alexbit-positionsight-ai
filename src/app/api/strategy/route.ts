import { NextResponse } from "next/server";
import { getMockQuote } from "@/data/mock-market";
import { generateStrategySpec } from "@/lib/strategy-engine";
import type { PositionInput } from "@/types/strategy";

export async function POST(request: Request) {
  const body = (await request.json()) as PositionInput;
  const quote = getMockQuote(body.symbol);

  if (!quote) {
    return NextResponse.json({ error: "No market quote available for token." }, { status: 404 });
  }

  if (!body.entryPrice || !body.positionSize || !body.maxRiskPercentage || !body.timeframe) {
    return NextResponse.json({ error: "Position details are incomplete." }, { status: 400 });
  }

  return NextResponse.json(generateStrategySpec(body, quote));
}
