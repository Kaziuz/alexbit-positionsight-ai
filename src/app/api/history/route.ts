import { NextResponse } from "next/server";
import { eligibleTokenUniverse } from "@/data/eligible-tokens";
import { fetchCmcOhlcvHistorical } from "@/lib/cmc";
import { strategyTimeframes } from "@/lib/strategy-timeframe";
import type { StrategyTimeframe } from "@/types/strategy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isStrategyTimeframe(value: string | null): value is StrategyTimeframe {
  return strategyTimeframes.includes(value as StrategyTimeframe);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.trim().toUpperCase();
  const timeframe = searchParams.get("timeframe");
  const debug = searchParams.get("debug") === "1";

  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol." }, { status: 400 });
  }

  if (!isStrategyTimeframe(timeframe)) {
    return NextResponse.json({ error: "Unsupported timeframe." }, { status: 400 });
  }

  const token = eligibleTokenUniverse.find((item) => item.symbol === symbol);

  if (!token) {
    return NextResponse.json({ error: "Unsupported token." }, { status: 404 });
  }

  const history = await fetchCmcOhlcvHistorical({
    symbol,
    cmcId: token.cmcId,
    timeframe,
    debug,
  });

  return NextResponse.json(history, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
