# PositionSight AI

PositionSight AI is a focused hackathon MVP for **BNB Hack: AI Trading Agent Edition - CoinMarketCap x Trust Wallet**.

It is an AI-powered crypto strategy skill, not a live trading bot and not a Binance frontend. The app helps a user select an eligible crypto token, enter position details, compare entry price against market price, review risk levels, and export a backtest-ready strategy specification.

## Hackathon Alignment

PositionSight AI fits the Crypto Intelligence / Strategy Skill direction by combining:

- CoinMarketCap-style market data inputs.
- Visual position analysis around entry price, current price, stop loss, and take profit.
- Explainable strategy generation for risk-aware decisions.
- Structured JSON output that can be consumed by backtesting tools.

The first MVP uses mock market data so the UI works locally before real CoinMarketCap API keys are configured.

## Current MVP Features

- Local eligible token selector.
- Position form for token, entry price, position size, timeframe, and max risk percentage.
- Mock quote endpoint with current price, 24h change, volume, and market cap.
- Entry price vs current price chart.
- Suggested stop loss and take profit levels.
- Deterministic strategy engine with:
  - Trend-following pullback.
  - Breakout with volume.
  - Defensive mean reversion.
  - No-trade signal when risk is too high.
- Backtest-ready JSON preview and export.
- Server API routes for future CoinMarketCap and strategy generation integration.

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Recharts
- API routes for market data and strategy output

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

`.env.local` is used for secrets and must not be committed.

```bash
COINMARKETCAP_API_KEY=replace_with_your_cmc_api_key
CMC_API_BASE_URL=https://pro-api.coinmarketcap.com
```

The current app intentionally uses mock market data. A future integration should call CoinMarketCap from server routes only and never expose API keys to the browser.

## Project Structure

```text
src/app/                  Next.js App Router pages and API routes
src/components/           UI components for the form, chart, metrics, and strategy output
src/data/                 Eligible token list and mock market data
src/lib/                  Formatting helpers and strategy engine
src/types/                Shared TypeScript types
docs/                     Strategy spec and demo script
```

## Safety Scope

PositionSight AI does not place trades, manage wallets, connect to exchanges, or provide financial advice. It creates explainable strategy specifications from user-provided position details and market data.
