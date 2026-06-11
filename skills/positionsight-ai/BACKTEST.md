# Backtesting PositionSight AI

PositionSight AI packages a Track 2 Strategy Skill artifact: a deterministic, backtest-ready JSON strategy specification. It is not a live trading bot and does not connect wallets, exchanges, or on-chain execution.

## Run The App

Install dependencies:

```bash
npm install
```

Start the local app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Optional CoinMarketCap configuration lives in `.env.local`. Do not commit `.env.local`.

## Export A Strategy Spec

1. Select an eligible token.
2. Choose a position intent:
   - `analyze_entry`
   - `manage_open_position`
   - `exit_review`
3. Enter entry price, capital, position size when needed, risk percentage, strategy timeframe, and strategy mode.
4. Review the deterministic Strategy Signal panel.
5. Use the Backtest-ready JSON panel or Export JSON button.

The exported JSON is the reusable strategy-skill artifact. It includes deterministic `strategyDecision`, `strategySpec`, `marketContext`, `history.indicators`, `backtestSpec`, execution assumptions, validation, and optional explanation/scanner metadata.

## How The Simple Backtest Works

The simple backtest runner is deterministic and educational.

It checks the generated strategy against available candles:

- Entry trigger: whether the candle range touches the planned entry for new-entry mode.
- Stop trigger: whether a candle low reaches the generated stop loss.
- Trailing-exit reference: whether a candle high reaches the exported trailing-exit/take-profit compatibility level.
- Existing-position intents: `manage_open_position` and `exit_review` assume the long position already exists.
- No-trade strategies: record abstain/capital-protection behavior instead of opening a new position.

The result includes:

- `backtestSource`
- `candlesUsed`
- `entryTriggered`
- `exitTriggered`
- `stopHit`
- `trailingExitHit`
- `grossReturnPercentage`
- `estimatedPnL`
- `maxDrawdownPercentage`
- `winLossResult`
- `limitations`

## Fields That Matter For Backtesting

Primary machine-readable fields:

- `strategySpec.asset`
- `strategySpec.strategyTimeframe`
- `strategySpec.strategyType`
- `strategySpec.stopLoss`
- `strategySpec.takeProfit`
- `strategySpec.invalidationLevel`
- `strategySpec.riskRules`
- `strategyDecision.intentAction`
- `strategyDecision.riskBadge`
- `strategyDecision.stopStatus`
- `strategyDecision.finalRiskVerdict`
- `backtestSpec.signal`
- `backtestSpec.shouldOpenPosition`
- `backtestSpec.entryRule`
- `backtestSpec.exitRule`
- `backtestSpec.stopRule`
- `backtestSpec.takeProfitRule`
- `backtestSpec.trailingExit`
- `backtestSpec.positionSizing`
- `backtestSpec.riskManagement`
- `executionAssumptions`
- `validation`

Data context fields:

- `dataProvenance`
- `marketContext.quote`
- `marketContext.technicals`
- `history.source`
- `history.indicatorSource`
- `history.indicators`
- `history.warnings`

## Estimated Data Behavior

When CoinMarketCap historical OHLCV is available, `history.source` is `coinmarketcap` and indicators are calculated from real candles.

When CoinMarketCap historical OHLCV is unavailable because of API plan access, provider response, or missing key, the app returns `history.source: "estimated"` and labels the limitation. Estimated candles preserve demo/backtest continuity but should not be treated as real market history.

When no history response reaches the simple backtest runner, it can use a small documented demo dataset. In that case `backtestSource` is `demo_dataset`.

## Track 2 Fit

This package is suitable for BNB Hack Track 2: Strategy Skills because it produces a reusable, deterministic, backtestable strategy specification.

It is not Track 1 live trading infrastructure:

- No wallet connection.
- No on-chain transaction signing.
- No exchange order placement.
- No autonomous trading.
- No live agent address required.
- On-chain agent address can be `N/A`.

The artifact is designed for review, explanation, and backtesting.
