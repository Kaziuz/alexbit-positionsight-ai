import { NextResponse } from "next/server";
import { eligibleTokenUniverse } from "@/data/eligible-tokens";
import { getMockMarketContext } from "@/data/mock-market";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: "Missing token symbol." }, { status: 400 });
  }

  const isEligible = eligibleTokenUniverse.some((token) => token.symbol === symbol);

  if (!isEligible) {
    return NextResponse.json({ error: "Token is not in the eligible list." }, { status: 404 });
  }

  const context = getMockMarketContext(symbol);

  if (!context) {
    return NextResponse.json({ error: "No mock market context available for token." }, { status: 404 });
  }

  return NextResponse.json(context);
}
