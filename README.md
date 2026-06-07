# PositionSight AI

<p align="center">
  <img src="./position-sight.png" alt="PositionSight AI logo" width="180" />
</p>

A CoinMarketCap-powered crypto strategy skill that converts market context and user position data into an explainable, risk-aware, backtest-ready trading strategy specification.

PositionSight AI is a hackathon MVP for **BNB Hack: AI Trading Agent Edition - CoinMarketCap x Trust Wallet** on DoraHacks.

## Track Alignment

PositionSight AI is submitted under the **Crypto Intelligence / Strategy Skills** track.

It ships a structured strategy skill and export artifact, not a live on-chain trading agent. The app analyzes market context, position risk, and strategy fit, then produces a human-readable and machine-readable strategy specification that can be reviewed or used by backtesting tools.

Because this project does not execute trades and does not deploy or control an on-chain trading agent, the agent address can be submitted as `N/A` for this project type.

## What It Does

- Analyzes a selected eligible crypto asset.
- Fetches live latest quote data from CoinMarketCap through a server-side API route.
- Falls back to local mock market context safely when CoinMarketCap is unavailable.
- Visualizes current price vs entry price.
- Shows a timeframe-aware estimated projection until real OHLCV paths are added.
- Shows risk, stop loss, take profit, and invalidation levels.
- Provides Beginner and Advanced eligible token modes.
- Provides English and Spanish UI language options.
- Supports strategy timeframes of 15m, 30m, 1h, 1d, 1w, and 1mo.
- Treats intraday timeframes as higher-risk research contexts that require stronger confirmation.
- Lets users choose Auto Recommended or a manual strategy mode.
- Explains each strategy mode with beginner-friendly educational cards.
- Generates an explainable strategy decision and risk signal.
- Displays market context, strategy fit, warnings, and next confirmation.
- Exports a machine-readable backtest-ready JSON artifact.

## What It Does Not Do

- Does not execute trades.
- Does not connect to wallets.
- Does not use Binance trading execution.
- Does not provide financial advice.
- Does not expose API keys client-side.
- Does not require an on-chain agent address.

## Tech Stack

- Next.js
- TypeScript
- CoinMarketCap API
- Server-side API routes
- Tailwind CSS
- Recharts
- Local mock market context fallback

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Add your CoinMarketCap API key to `.env.local`:

```bash
CMC_API_KEY=your_coinmarketcap_api_key_here
CMC_API_BASE_URL=https://pro-api.coinmarketcap.com
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

`.env.local` is used for local secrets and must never be committed.

Required placeholder values:

```bash
CMC_API_KEY=your_coinmarketcap_api_key_here
CMC_API_BASE_URL=https://pro-api.coinmarketcap.com
```

CoinMarketCap requests are made server-side only. `CMC_API_KEY` is read by Next.js API routes and is never exposed to browser/client components.

## API Route

Market context is available through:

```text
GET /api/market?symbol=ADA
GET /api/market?symbol=ADA&debug=1
```

Behavior:

- With a valid `CMC_API_KEY`, `source` should be `coinmarketcap`.
- Without a key, or if CoinMarketCap fails, `source` falls back to `mock`.
- `debug=1` includes safe diagnostics such as request mode, CMC ID, HTTP status, and parser status.
- Diagnostics never include the API key.

## Export Artifact

The JSON export is designed as a backtest-ready strategy artifact.

It includes:

- `schemaVersion`
- `skill` metadata
- `inputSchema`
- `dataProvenance`
- `dataRequirements`
- `strategySpec`
- `strategyDecision`
- `selectedStrategyMode`
- `evaluatedStrategyType`
- `finalRiskVerdict`
- `noTradeRecommended`
- `marketContext`
- `backtestSpec`
- `executionAssumptions`
- `evaluationMetrics`
- `validation`

The export preserves both human-readable strategy explanations and machine-readable backtest rules.

## Current MVP Features

- Next.js + TypeScript MVP.
- CoinMarketCap latest quote integration through a server-side API route.
- `CMC_API_KEY` stored in `.env.local`.
- `.env.local` ignored by Git.
- Mock fallback when CoinMarketCap live quote is unavailable.
- Beginner / Advanced eligible token mode.
- English / Spanish language toggle.
- Strategy Timeframe selector: 15m, 30m, 1h, 1d, 1w, 1mo.
- Strategy mode selector.
- Beginner-friendly strategy explanation cards.
- Risk visualization.
- Strategy signal panel.
- Market context panel.
- Backtest-ready JSON export.
- Data provenance.
- Execution assumptions.
- Evaluation metrics.
- Validation metadata.
- Human-readable and machine-readable strategy output.

## Security

- Never commit `.env.local`.
- Never expose `CMC_API_KEY` in browser or client code.
- CoinMarketCap API requests happen server-side only.
- The app does not place trades or request wallet permissions.

## Current Limitations

- CoinMarketCap latest quote data is live when `CMC_API_KEY` is configured.
- Some advanced context fields are estimated until historical OHLCV is integrated.
- Chart projection is deterministic estimated behavior until historical OHLCV is integrated.
- Strategy analysis supports 15m, 30m, 1h, 1d, 1w, and 1mo contexts.
- Intraday timeframes are supported for testing and research, but the engine treats them with more caution and does not encourage overtrading.
- Historical OHLCV and real indicator calculations are planned next.
- There is no live trade execution.
- Strategy output is educational and not financial advice.

## Roadmap

- Strategy timeframe selection: 15m, 30m, 1h, 1d, 1w, 1mo.
- Historical OHLCV and timeframe-aware backtest assumptions.
- Historical OHLCV integration.
- Real EMA / RSI / ATR calculations.
- Basic backtest runner.
- Demo video.
- DoraHacks final submission polish.

## Project Structure

```text
src/app/                  Next.js App Router pages and API routes
src/components/           UI components for the form, chart, metrics, and strategy output
src/data/                 Eligible token list and mock market data
src/lib/                  CoinMarketCap client, formatting helpers, export builder, strategy engine
src/types/                Shared TypeScript types
docs/                     Strategy spec and demo script
```

## Safety Scope

PositionSight AI does not place trades, manage wallets, connect to exchanges, or provide financial advice. It creates explainable strategy specifications from user-provided position details and market data.
