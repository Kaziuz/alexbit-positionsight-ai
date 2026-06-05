import { NextResponse } from "next/server";
import { eligibleTokens } from "@/data/eligible-tokens";
import { getMockQuote } from "@/data/mock-market";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: "Missing token symbol." }, { status: 400 });
  }

  const isEligible = eligibleTokens.some((token) => token.symbol === symbol);

  if (!isEligible) {
    return NextResponse.json({ error: "Token is not in the eligible list." }, { status: 404 });
  }

  const quote = getMockQuote(symbol);

  if (!quote) {
    return NextResponse.json({ error: "No mock quote available for token." }, { status: 404 });
  }

  return NextResponse.json(quote);
}
