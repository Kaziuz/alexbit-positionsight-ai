# PositionSight AI

## Skill Identity

Skill name: PositionSight AI

Track: Crypto Intelligence / Strategy Skills

Purpose: Generate a deterministic, risk-aware, backtestable crypto strategy specification from CoinMarketCap market data and user position inputs.

PositionSight AI is a strategy-skill artifact for BNB Hack Track 2. It is not a live trading agent. It converts market context, technical indicators, position intent, and risk settings into a structured strategy decision and backtest specification.

## What It Does

- Reads CoinMarketCap latest quote data through the server-side app API.
- Attempts CoinMarketCap historical OHLCV when available through the server-side app API.
- Calculates or uses MA 20, MA 50, MA 200, RSI 14, ATR 14, average volume, support, and resistance.
- Evaluates position intent:
  - `analyze_entry`
  - `manage_open_position`
  - `exit_review`
- Returns a deterministic `strategyDecision`.
- Produces a machine-readable `backtestSpec`.
- Keeps no-trade as a valid deterministic outcome.
- Labels whether market/history data is live, historical, estimated, or demo fallback.
- Never executes trades.

## What It Does Not Do

- No wallet connection.
- No exchange execution.
- No transaction signing.
- No financial advice.
- No autonomous trading.
- No short selling.
- No hidden AI trade decisions.

## Inputs

- `symbol`: Eligible crypto asset symbol.
- `entryPrice`: Planned entry price or average/original entry for an existing long position.
- `totalCapital`: Capital base used for risk sizing.
- `positionSize`: Token quantity for the strategy or existing position.
- `strategyTimeframe`: One of `15m`, `30m`, `1h`, `1d`, `1w`, `1mo`.
- `maxRiskPercentage`: Maximum risk percentage for the setup.
- `strategyMode`: One of `auto`, `trend_confirmation`, `breakout_retest`, `defensive_rebound`, `risk_check`.
- `positionIntent`: One of `analyze_entry`, `manage_open_position`, `exit_review`.

## Outputs

- `strategyDecision`: Deterministic strategy engine result.
- `riskBadge`: `low`, `medium`, `high`, or `no_trade`.
- `intentAction`: Intent-aware action such as `evaluate_entry`, `wait_for_confirmation`, `hold_with_trailing_exit`, `reduce_risk`, `exit_or_reduce`, `stop_breached`, or `no_trade`.
- `stopLoss`: Risk control level.
- `trailingExit`: Initial trailing-exit reference retained for backtest compatibility.
- `indicators`: MA 20, MA 50, MA 200, RSI 14, ATR 14, average volume, support, and resistance.
- `marketContext`: Quote, technical, sentiment, liquidity, and derivatives context used by the engine.
- `backtestSpec`: Machine-readable backtest contract.
- `validation`: Backtest readiness and limitations.

## Usage Examples

### Analyze A New Entry

Use `positionIntent: "analyze_entry"` when a user is considering a new long entry and wants to size risk before acting.

Example request intent:

```json
{
  "symbol": "ADA",
  "entryPrice": 0.58,
  "totalCapital": 1000,
  "positionSize": 125,
  "strategyTimeframe": "1d",
  "maxRiskPercentage": 1,
  "strategyMode": "auto",
  "positionIntent": "analyze_entry"
}
```

Expected output: a deterministic entry-validation decision, risk badge, stop loss, trailing-exit reference, backtest spec, and no-trade reason when risk or structure is unclear.

### Manage An Open Position

Use `positionIntent: "manage_open_position"` when a user already holds a long position and wants to review hold, reduce, wait, or trailing-exit conditions.

Example request intent:

```json
{
  "symbol": "ADA",
  "entryPrice": 0.52,
  "totalCapital": 1000,
  "positionSize": 500,
  "strategyTimeframe": "1d",
  "maxRiskPercentage": 1,
  "strategyMode": "auto",
  "positionIntent": "manage_open_position"
}
```

Expected output: a deterministic open-position decision where `shouldAddExposure` remains false and the engine focuses on hold, reduce, or trailing-exit protection.

### Review Exit / Sell Conditions

Use `positionIntent: "exit_review"` when a user wants to evaluate whether an existing long position should be reduced, exited, or monitored.

Example request intent:

```json
{
  "symbol": "ADA",
  "entryPrice": 0.75,
  "totalCapital": 1000,
  "positionSize": 400,
  "strategyTimeframe": "1d",
  "maxRiskPercentage": 1,
  "strategyMode": "risk_check",
  "positionIntent": "exit_review"
}
```

Expected output: a deterministic exit-review result. `EXIT` or `REDUCE` means long-position risk review only. It is not short selling and does not execute an order.

## Limitations

- Historical OHLCV depends on CoinMarketCap plan access.
- Estimated fallback candles are documented when real historical candles are unavailable.
- Indicators are real only when calculated from real OHLCV candles.
- The included simple backtest is educational and deterministic, not a professional trading simulator.
- No live execution, wallet connection, exchange routing, leverage, or short selling.
- Outputs are educational decision-support artifacts and are not financial advice.
