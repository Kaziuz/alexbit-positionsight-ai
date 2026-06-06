# PositionSight AI

PositionSight AI is a focused hackathon MVP for **BNB Hack: AI Trading Agent Edition - CoinMarketCap x Trust Wallet**.

It is an AI-powered crypto strategy skill, not a live trading bot and not a Binance frontend. The app helps a user select an eligible crypto token, enter position details, compare entry price against market price, review risk levels, and export a backtest-ready strategy specification.

## Hackathon Alignment

PositionSight AI fits the Crypto Intelligence / Strategy Skill direction by combining:

- CoinMarketCap-style market data inputs.
- Visual position analysis around entry price, current price, stop loss, and take profit.
- Explainable strategy generation for risk-aware decisions.
- Structured JSON output that can be consumed by backtesting tools.

The MVP uses server-only CoinMarketCap latest quotes when a local API key is configured, and safely falls back to mock market data when live quotes are unavailable.

## Current MVP Features

- Local eligible token selector.
- Position form for token, entry price, position size, timeframe, and max risk percentage.
- Server-side market endpoint with CoinMarketCap latest quote support and mock fallback.
- Entry price vs current price chart.
- Suggested stop loss and take profit levels.
- Deterministic strategy engine with:
  - Trend-following pullback.
  - Breakout with volume.
  - Defensive mean reversion.
  - No-trade signal when risk is too high.
- Backtest-ready JSON preview and export.
- Server API routes for CoinMarketCap quotes and strategy output.

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Recharts
- API routes for market data and strategy output

## Getting Started

Create a local environment file:

```bash
cp .env.example .env.local
```

Add your CoinMarketCap API key to `.env.local`:

```bash
CMC_API_KEY=your_coinmarketcap_api_key_here
CMC_API_BASE_URL=https://pro-api.coinmarketcap.com
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

`.env.local` is used for secrets and must not be committed.

```bash
CMC_API_KEY=your_coinmarketcap_api_key_here
CMC_API_BASE_URL=https://pro-api.coinmarketcap.com
```

The app calls CoinMarketCap only from server routes and never exposes `CMC_API_KEY` to browser code. If `CMC_API_KEY` is missing or CoinMarketCap is unavailable, the app uses mock data fallback for demo reliability.

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
