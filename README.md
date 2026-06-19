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

## CMC Strategy Skill Package

The reusable CMC Strategy Skill artifact lives in `skills/positionsight-ai/`.

It includes `SKILL.md`, `skill.json`, concise example strategy exports, and `BACKTEST.md` documentation for using the exported JSON as a Track 2 backtestable strategy specification. The package is intentionally non-executing: no wallet connection, no exchange execution, no autonomous trading, and no financial advice.

## What It Does

- Analyzes a selected eligible crypto asset.
- Fetches live latest quote data from CoinMarketCap through a server-side API route.
- Attempts to fetch historical OHLCV from CoinMarketCap through a server-side API route.
- Falls back to local mock market context safely when CoinMarketCap is unavailable.
- Visualizes current price vs entry price.
- Shows CoinMarketCap historical OHLCV when available, or clearly labeled estimated candles when unavailable.
- Shows risk, stop loss, trailing-exit reference, and invalidation levels in the export.
- Provides Beginner and Advanced eligible token modes.
- Provides English and Spanish UI language options.
- Supports strategy timeframes of 15m, 30m, 1h, 1d, 1w, and 1mo.
- Treats intraday timeframes as higher-risk research contexts that require stronger confirmation.
- Defaults to 1d context and 1% risk for patient, capital-preservation-oriented analysis.
- Calculates new-entry position size from total capital, risk percentage, entry price, ATR, and stop distance.
- Supports position intent: analyze entry, manage open position, or review exit/sell conditions.
- Treats manage/exit intents as existing long-position reviews, not fresh buy signals.
- Flags breached stops as exit/risk reviews instead of presenting the position as healthy.
- Lets users choose Auto Recommended or a manual strategy mode.
- Explains each strategy mode with beginner-friendly educational cards.
- Generates an explainable strategy decision and risk signal.
- Provides an optional provider-agnostic AI explanation layer for explaining the deterministic result.
- Falls back to a local deterministic explanation when no AI provider is configured.
- Scans eligible tokens with the deterministic strategy engine to surface possible movements to review.
- Runs a simple deterministic backtest v1 against historical CMC candles when available, or clearly labeled estimated/demo fallback data.
- Provides a separate Paper Backtest tab that can paste a PositionSight JSON export and test it against Binance public historical klines.
- Displays market context, strategy fit, warnings, and next confirmation.
- Exports a machine-readable backtest-ready JSON artifact.

## What It Does Not Do

- Does not execute trades.
- Does not connect to wallets.
- Does not use Binance trading execution.
- Does not short sell.
- Does not provide financial advice.
- Does not let AI make trading decisions.
- Does not require an AI provider to run.
- Does not require or ask for Binance API keys.
- Does not connect to a Binance account.
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
- Optional OpenAI-compatible chat-completion provider endpoint for explanations

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
AI_EXPLAIN_ENABLED=false
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://openrouter.ai/api/v1
AI_API_KEY=your_provider_api_key_here
AI_MODEL=your_free_or_configured_model_here
AI_SITE_URL=http://localhost:3000
AI_APP_NAME=PositionSight AI
```

CoinMarketCap requests are made server-side only. `CMC_API_KEY` is read by Next.js API routes and is never exposed to browser/client components.

The optional AI explanation layer is provider-agnostic and uses a generic OpenAI-compatible chat completions endpoint. It is not tied to ChatGPT or any single provider. Providers such as OpenRouter, Together, Groq, local gateways, or future compatible services can be swapped by changing environment variables.

`AI_API_KEY` is server-side only. If `AI_EXPLAIN_ENABLED` is not `true`, `AI_API_KEY` is missing, `AI_MODEL` is missing, or the provider response fails validation, PositionSight returns a local deterministic explanation instead.

## API Route

Market context is available through:

```text
GET /api/market?symbol=ADA
GET /api/market?symbol=ADA&debug=1
```

Historical OHLCV and indicators are available through:

```text
GET /api/history?symbol=ADA&timeframe=1d
GET /api/history?symbol=ADA&timeframe=1d&debug=1
```

Optional strategy explanations are available through:

```text
POST /api/explain
```

The explain route accepts the generated strategy artifact and `language: "en" | "es"`. It returns either `source: "provider"` or `source: "deterministic_fallback"`. It never returns provider secrets or raw provider error details.

Behavior:

- With a valid `CMC_API_KEY`, `source` should be `coinmarketcap`.
- Without a key, or if CoinMarketCap fails, `source` falls back to `mock`.
- For history, `source` is `coinmarketcap` when OHLCV candles are available and `estimated` when the API response or plan cannot provide historical candles.
- `debug=1` includes safe diagnostics such as request mode, CMC ID, HTTP status, and parser status.
- Diagnostics never include the API key.

Paper backtesting from an exported PositionSight JSON artifact is available through:

```text
POST /api/backtest/binance
```

This route accepts the generated strategy JSON and uses Binance Market Data public klines from `https://data-api.binance.vision/api/v3/klines` only. It does not use private Binance credentials, does not read balances, does not place orders, and does not call account, wallet, withdrawals, user data, earnings, or trading endpoints. If Binance public klines are unavailable or the token has no supported USDT mapping, the route returns a clearly labeled `demo_fallback` paper simulation.

## Export Artifact

The JSON export is designed as a backtest-ready strategy artifact.

The JSON is not an order, not a trading bot, and not an instruction to execute. It is a strategy specification for review, explanation, and paper/backtest tooling.

It includes:

- `schemaVersion`
- `skill` metadata
- `inputSchema`
- `dataProvenance`
- `dataRequirements`
- `historySource`
- `indicatorSource`
- `indicators`
- `chartSeriesType`
- `advancedContextType`
- `positionIntent`
- `intentAction`
- `intentVerdict`
- `riskBadge`
- `riskVerdict`
- `stopStatus`
- `shouldAddExposure`
- `shouldReduceExposure`
- `shouldExitPosition`
- `positionSizingMode`
- `calculatedPositionSize`
- `existingPositionSize` when managing or reviewing an existing position
- `allowShort: false`
- `strategySpec`
- `strategyDecision`
- `selectedStrategyMode`
- `evaluatedStrategyType`
- `finalRiskVerdict`
- `noTradeRecommended`
- `marketContext`
- `backtestSpec`
- `backtestResult`
- `backtestSource`
- `candlesUsed`
- `executionAssumptions`
- `evaluationMetrics`
- `validation`
- `aiExplanation`
- optional `scannerResults` after a token scan has run

The export preserves both human-readable strategy explanations and machine-readable backtest rules.

`aiExplanation` records whether an explanation was generated by a provider, generated by deterministic fallback, or not generated yet. Its guardrails state that the explanation does not override the engine, is not financial advice, and does not execute trades.

`scannerResults` is optional and contains deterministic strategy engine output for scanned tokens only. It does not contain AI-generated decisions.

## Current MVP Features

- Next.js + TypeScript MVP.
- CoinMarketCap latest quote integration through a server-side API route.
- CoinMarketCap historical OHLCV attempt through a server-side API route.
- `CMC_API_KEY` stored in `.env.local`.
- `.env.local` ignored by Git.
- Mock fallback when CoinMarketCap live quote is unavailable.
- Beginner / Advanced eligible token mode.
- English / Spanish language toggle.
- Strategy Timeframe selector: 15m, 30m, 1h, 1d, 1w, 1mo.
- Strategy mode selector.
- Position intent selector for entry analysis, open-position management, and exit/sell review.
- Intent-aware risk panel for add, hold, reduce, and exit-review decisions.
- Beginner-friendly strategy explanation cards.
- Risk visualization.
- Strategy signal panel.
- Optional Strategy explanation panel with provider or deterministic fallback source label.
- Token Scanner for eligible-token deterministic scans.
- Simple Backtest panel.
- Market context panel.
- Backtest-ready JSON export.
- Paper Backtest tab for pasted PositionSight JSON using Binance public klines or documented demo fallback.
- Data provenance.
- Execution assumptions.
- Evaluation metrics.
- Validation metadata.
- Human-readable and machine-readable strategy output.

## Current MVP Status

As of the Day 11 + Day 10 + Day 13 validation pass, the MVP supports:

- Live CoinMarketCap latest quote retrieval through `/api/market`.
- Estimated/fallback history when historical OHLCV is unavailable on the active CoinMarketCap plan.
- Deterministic strategy engine decisions for `analyze_entry`, `manage_open_position`, and `exit_review`.
- Simple deterministic backtest output with clear `historical_cmc`, `estimated_from_live_quote`, or `demo_dataset` provenance.
- Exportable strategy skill JSON with strategy, market, history/indicator, backtest, execution-assumption, and validation metadata.
- English and Spanish UI labels, warnings, badges, strategy explanation copy, and controls.
- No live trading, no wallet connection, no transaction signing, no exchange execution, and no short selling.
- Paper Backtest uses public OHLCV market data only and does not require Binance API keys.

The requested validation matrix covers BNB, ETH, LINK, AVAX, CAKE, TWT, AAVE, UNI, ATOM, and FIL across all three position intents and both supported UI languages. Details are recorded in `docs/day-11-token-validation.md`.

## Security

- Never commit `.env.local`.
- Never expose `CMC_API_KEY` in browser or client code.
- Never expose `AI_API_KEY` in browser or client code.
- CoinMarketCap API requests happen server-side only.
- Binance paper backtest requests use public market-data klines only.
- Do not add Binance private API keys, `NEXT_PUBLIC_BINANCE_KEY`, order routes, account routes, wallet routes, withdrawal routes, user-data routes, earnings routes, or balance access.
- AI explanation provider requests happen server-side only.
- The AI explanation layer must not create or override trading decisions, prices, entries, exits, signals, or risk levels.
- The app does not place trades or request wallet permissions.

## Current Limitations

- CoinMarketCap latest quote data is live when `CMC_API_KEY` is configured.
- Historical OHLCV is attempted from CoinMarketCap when `CMC_API_KEY` is configured and the API plan allows it.
- Indicators are real only when historical OHLCV candles are available.
- Estimated candles and indicators are fallback-only when OHLCV is unavailable.
- Simple Backtest v1 is deterministic and educational; it is not a professional trading simulator.
- Backtest source is labeled as `historical_cmc`, `estimated_from_live_quote`, or `demo_dataset`.
- Strategy analysis supports 15m, 30m, 1h, 1d, 1w, and 1mo contexts.
- Intraday timeframes are supported for testing and research, but the engine treats them with more caution and does not encourage overtrading.
- Historical OHLCV access depends on the CoinMarketCap plan; estimated candles and indicators remain clearly labeled when OHLCV is unavailable.
- There is no live trade execution.
- Sell review means reducing or exiting an existing long position; short selling is out of scope.
- Strategy output is educational and not financial advice.
- The AI provider is optional. Without provider configuration, the deterministic local explanation remains available.
- Token Scanner results are possible movements to review, not buy/sell signals or investment recommendations.

## Roadmap

- Strategy timeframe selection: 15m, 30m, 1h, 1d, 1w, 1mo.
- Historical OHLCV and timeframe-aware backtest assumptions.
- Historical OHLCV integration.
- Real MA / RSI / ATR calculations when OHLCV is available.
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
