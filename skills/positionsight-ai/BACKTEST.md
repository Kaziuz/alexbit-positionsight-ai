# Backtesting PositionSight AI

PositionSight AI packages a Track 2 Strategy Skill artifact: a deterministic, backtest-ready JSON strategy specification. The JSON is not an order, not a trading bot, and not an instruction to execute. It is not live trading and does not connect wallets, exchange accounts, or on-chain execution.

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

## Paper Backtest From JSON

The app includes a separate Paper Backtest tab:

1. Generate or export a PositionSight JSON artifact from Strategy Builder.
2. Open Paper Backtest.
3. Paste the JSON into the textarea.
4. Run the paper backtest.

Paper Backtest reads the strategy specification and requests public OHLCV candles from Binance Market Data:

```text
https://data-api.binance.vision/api/v3/klines
```

Supported symbols are mapped to USDT pairs such as `ADAUSDT`, `AVAXUSDT`, `ETHUSDT`, `BNBUSDT`, `LINKUSDT`, `CAKEUSDT`, `TWTUSDT`, `AAVEUSDT`, `UNIUSDT`, `ATOMUSDT`, `FILUSDT`, `TRXUSDT`, `XRPUSDT`, `BCHUSDT`, `LTCUSDT`, and `DOTUSDT`.

The route converts PositionSight timeframes to Binance intervals:

- `15m` -> `15m`
- `30m` -> `30m`
- `1h` -> `1h`
- `1d` -> `1d`
- `1w` -> `1w`
- `1mo` -> `1M`

If Binance public klines are unavailable, empty, or the symbol is not mapped, the app returns a documented `demo_fallback` result. The fallback is for interface and workflow validation only.

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

For Paper Backtest, Binance public klines are labeled as `binance_public_klines`. Demo fallback data is labeled as `demo_fallback`.

## Paper Backtest Safety Limits

- No Binance API keys are required.
- No Binance API keys are requested in the UI.
- No private credentials are read from environment variables.
- No `NEXT_PUBLIC_BINANCE_KEY` or public credential variable is used.
- No order, trading, account, wallet, withdrawals, user data, earnings, or balance endpoints are called.
- Imported JSON stays in temporary client state for the current session and is not saved to local storage.
- The simulation does not place orders, sign transactions, connect wallets, connect exchange accounts, or spend funds.
- No-trade or `ABSTAIN` strategy specs do not open a fake position; they return capital-protection behavior.

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
