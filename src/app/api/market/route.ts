import { NextResponse } from "next/server";
import { eligibleTokenUniverse } from "@/data/eligible-tokens";
import { getMockMarketContext } from "@/data/mock-market";
import { CmcQuoteError, fetchCmcLatestQuote } from "@/lib/cmc";
import type { MarketContext } from "@/types/strategy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fallbackWarning = "Using mock data fallback because CoinMarketCap live quote is unavailable.";
const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

type MarketDiagnostics = NonNullable<MarketContext["diagnostics"]>;

function marketResponse(context: MarketContext, status = 200) {
  return NextResponse.json(context, {
    status,
    headers: noStoreHeaders,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.trim().toUpperCase();
  const debug = searchParams.get("debug") === "1";

  if (!symbol) {
    return NextResponse.json({ error: "Missing token symbol." }, { status: 400, headers: noStoreHeaders });
  }

  const token = eligibleTokenUniverse.find((item) => item.symbol.toUpperCase() === symbol);

  if (!token) {
    return NextResponse.json({ error: "Token is not in the eligible list." }, { status: 404, headers: noStoreHeaders });
  }

  const fallbackDiagnostics: MarketDiagnostics = {
    hasCmcApiKey: Boolean(process.env.CMC_API_KEY),
    cmcRequestMode: token.cmcId ? "id" : "symbol",
    cmcId: token.cmcId,
  };
  let diagnostics = fallbackDiagnostics;

  if (process.env.CMC_API_KEY) {
    try {
      const liveContext = await fetchCmcLatestQuote({ symbol: token.symbol, cmcId: token.cmcId });
      const responseContext = debug ? liveContext : { ...liveContext, diagnostics: undefined };

      return marketResponse(responseContext);
    } catch (error) {
      diagnostics =
        error instanceof CmcQuoteError
          ? error.diagnostics
          : {
              ...fallbackDiagnostics,
              parserError: error instanceof Error ? error.message : "CoinMarketCap live quote is unavailable.",
            };

      console.warn(error instanceof Error ? error.message : "CoinMarketCap live quote is unavailable.");
    }
  }

  const context = getMockMarketContext(token.symbol);

  if (!context) {
    return NextResponse.json({ error: "No mock market context available for token." }, { status: 404, headers: noStoreHeaders });
  }

  return marketResponse({
    ...context,
    source: "mock",
    warnings: [...(context.warnings ?? []), fallbackWarning],
    diagnostics,
  });
}
