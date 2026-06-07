# PositionSight AI - Codex Instructions

## Project identity

PositionSight AI is a CoinMarketCap-powered crypto strategy skill for the BNB Hack: AI Trading Agent Edition - CoinMarketCap x Trust Wallet hackathon.

Track:
Crypto Intelligence / Strategy Skills.

This is not a live on-chain trading agent.
It does not execute trades.
It does not connect wallets.
It does not sign transactions.
The agent address can be submitted as N/A.

## Product scope

The product analyzes crypto market context and user position data, then generates an explainable, risk-aware, backtest-ready strategy specification.

It is educational and decision-support focused.
It must not present output as financial advice.

## Security rules

Never commit .env.local.
Never print or expose CMC_API_KEY.
CoinMarketCap API calls must remain server-side only.
Client components must never access secrets.
Do not add secrets to README, docs, examples, or logs.

## Current architecture

Next.js App Router.
TypeScript.
Tailwind CSS.
Recharts.
CoinMarketCap latest quote integration through /api/market.
Mock fallback when CMC is unavailable.
Backtest-ready JSON export.

Important files:
- src/app/api/market/route.ts
- src/lib/cmc.ts
- src/lib/strategy-engine.ts
- src/lib/strategy-export.ts
- src/lib/i18n.ts
- src/data/eligible-tokens.ts
- src/data/mock-market.ts
- src/components/PositionStrategyApp.tsx
- docs/strategy-spec.md
- docs/demo-script.md
- README.md

## Strategy timeframe rules

Do not remove intraday timeframe options unless explicitly requested.

The app should support these strategy timeframes:
- 15m
- 30m
- 1h
- 1d
- 1w
- 1mo

Intraday timeframes are allowed, but should be treated as higher-risk and more speculative.

The engine should not automatically block intraday timeframes.
Instead, intraday strategies should require stronger confirmation, better liquidity, lower risk, and clearer momentum.

No-trade is valid when the setup is unclear, risk is excessive, entry is too far, liquidity is weak, or signals conflict.

## Language rules

The UI supports English and Spanish.
Keep translation keys centralized.
Do not hardcode large amounts of UI copy directly inside components if a translation helper already exists.

## Development rules

Make small, safe, incremental changes.
Keep StrategySpec and export JSON backward-compatible unless explicitly requested.
Prefer adding wrapper fields over breaking existing shapes.
Keep mock fallback working.
Keep CMC live quote working.
Run lint, typecheck, and build after meaningful changes.
Do not commit unless explicitly instructed.

## Testing rules

If Playwright is available, use it for smoke tests.
If Playwright is not installed, document source-level verification and HTTP smoke tests.
Do not install new production dependencies without a clear reason.
Testing dependencies are allowed when explicitly requested.
