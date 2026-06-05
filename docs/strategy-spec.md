# PositionSight AI - Strategy Specification

PositionSight AI is an AI-powered crypto intelligence and strategy skill.

The strategy engine is Goodman-inspired: it favors patient trend confirmation, breakout/retest structure, trailing exits, quick invalidation, and capital preservation over day trading or constant signal generation.

The goal is to help users convert a crypto position, market data, and risk profile into a clear, explainable, and backtestable trading strategy.

This project is not a live trading bot and does not provide financial advice. It is a decision-support and educational tool for strategy generation, risk visualization, and structured backtesting.

---

## Input

The strategy engine receives:

* Token symbol
* Entry price
* Current price
* Position size
* Timeframe
* Maximum risk percentage
* Market data source
* Market quote
* Technical context
* Risk profile

Example input:

```json
{
  "symbol": "AVAX",
  "entryPrice": 34,
  "positionSize": 2,
  "timeframe": "4h",
  "maxRiskPercentage": 3
}
```

---

## Output Fields

The strategy engine converts a user position and a market quote into a structured JSON object designed for backtesting and review.

* `asset`: Token symbol.
* `timeframe`: Strategy timeframe.
* `strategyType`: One of `trend_following_pullback`, `breakout_with_volume`, `defensive_mean_reversion`, or `no_trade`.
* `entryCondition`: Human-readable condition for a valid strategy entry.
* `exitCondition`: Human-readable condition for exit or reduction.
* `stopLoss`: Suggested stop level based on configured risk.
* `takeProfit`: Suggested profit target using a simple reward-to-risk multiple.
* `invalidationLevel`: Price level where the strategy thesis is considered invalid.
* `riskRules`: Max risk, position size, estimated risk amount, and optional no-trade reason.
* `dataUsed`: Entry price, current price, 24h change, volume, market cap, data source, and timestamp.

The `StrategySpec` shape remains stable so backtesting tools can depend on it.

---

## StrategyDecision Wrapper

The UI can also export a richer `StrategyDecision` wrapper around the stable `StrategySpec`.

`StrategyDecision` includes:

* `spec`: The unchanged backtest-ready `StrategySpec`.
* `selectedMode`: The user's selected strategy mode.
* `selectedBy`: `auto` when PositionSight chooses the mode, or `user` when the user tests a manual mode.
* `fit`: `good`, `caution`, or `poor`.
* `whyThisStrategy`: Plain-English reason for the selected or rejected setup.
* `warnings`: Beginner-friendly warnings when a chosen strategy does not fit.
* `nextConfirmation`: What the user should wait for before acting.
* `beginnerExplanation`: Short educational explanation of the decision.

When the user manually selects a poor-fitting strategy, PositionSight does not blindly force it. It can return a `no_trade` spec with warnings while preserving the selected mode in the decision metadata.

---

## Export Artifact Contract

The downloaded JSON is a strict artifact wrapper for backtesting tools and other strategy-skill consumers.

Top-level fields:

* `schemaVersion`: Currently `1.0.0`.
* `skill`: Metadata for the skill name, hackathon track, and artifact type.
* `inputSchema`: Machine-readable description of `symbol`, `entryPrice`, `positionSize`, `timeframe`, `maxRiskPercentage`, and `strategyMode`.
* `dataProvenance`: Source, live/mock status, intended live source, and generation timestamp.
* `dataRequirements`: Required OHLCV series, interval, lookback periods, and required indicators.
* `backtestSpec`: Machine-readable strategy contract.
* `executionAssumptions`: Starting capital, fees, slippage, order type, and no-short/no-leverage constraints.
* `evaluationMetrics`: Metrics a backtest runner should calculate.
* `validation`: Backtest readiness and limitations.
* `strategySpec`: Stable human-readable strategy specification.
* `strategyDecision`: User/auto selection metadata and warnings.
* `marketContext`: Mock CMC-ready context used to produce the strategy.
* `explanation`: Human-readable explanation.
* `warnings`: Human-readable warnings.

### Human-Readable vs Machine-Readable Output

`strategySpec` is optimized for humans and demos. It explains the asset, timeframe, strategy type, entry condition, exit condition, stop loss, take profit, invalidation level, risk rules, and data used.

`backtestSpec` is optimized for machines. It expresses the same idea as structured rules:

* `signal`: `LONG`, `REDUCE`, `CONDITIONAL_LONG`, `EXIT`, or `ABSTAIN`.
* `shouldOpenPosition`: Boolean permission for a backtest runner to open a position.
* `entryRule`: Machine-readable entry requirements.
* `exitRule`: Machine-readable exit requirements.
* `stopRule`: Stop-loss trigger.
* `takeProfitRule`: Profit target and trailing behavior.
* `invalidationRule`: Thesis invalidation trigger.
* `positionSizing`: Risk-based sizing inputs.
* `riskManagement`: Risk, liquidity, sentiment, and execution constraints.

### No-Trade As ABSTAIN

When `strategyType` is `no_trade`, the export uses:

```json
{
  "signal": "ABSTAIN",
  "shouldOpenPosition": false,
  "entryRule": {
    "type": "none",
    "reason": "No-trade reason appears here"
  },
  "exitRule": {
    "type": "none"
  }
}
```

This keeps no-trade as a first-class backtestable outcome instead of treating it as missing data.

---

## Strategy Modes

The UI supports:

* `Auto Recommended`: PositionSight selects the best fit from the current mock context.
* `Trend Confirmation`: Tests whether a trend-following pullback setup fits.
* `Breakout + Retest`: Tests whether a breakout setup has momentum, volume, and retest logic.
* `Defensive Rebound`: Tests whether a conservative recovery setup is valid.
* `Risk Check / No-Trade`: Tests whether avoiding the trade is the best risk-management outcome.

Auto is the default because the MVP is designed for beginners.

---

## Market Data

The MVP currently supports mock market data for local testing.

The next milestone is to add a server-only CoinMarketCap integration so the app can fetch live quote data without exposing API keys on the client.

The current mock model is CMC-ready and grouped as `MarketContext`:

* `quote`: Current price, 24h change, 24h volume, market cap, timestamp, and source.
* `technicals`: EMA proxy values, RSI, ATR, support, resistance, trend state, and close-position state.
* `sentiment`: Mock/proxy sentiment score, label, news bias, and community bias.
* `orderBook`: Mock/proxy spread, buy pressure, sell pressure, and liquidity score.
* `derivatives`: Mock/proxy funding bias, open-interest change, and long/short bias.

Important: order book and derivatives fields are mock/proxy fields for now. They are included so future real CMC quotes, OHLCV, market-pair liquidity, news/community signals, and other available data can be mapped into the same shape.

Future versions may include:

* Historical OHLCV
* Volatility
* Sentiment
* News signals
* Derivatives data
* On-chain context

---

## Strategy Types

### 1. Trend-Following Pullback

Used as a trend-confirmation setup when the asset is in a constructive trend and risk remains controlled.

Conditions:

* Price remains above entry or a key trend area.
* Momentum is constructive but not overextended.
* Entry price is close enough to the current market structure.
* Risk-to-reward remains acceptable.

Output:

* Suggested hold or continuation setup after confirmation.
* Stop loss below support or structural invalidation.
* Take profit using a simple reward-to-risk multiple.
* Invalidation level below the thesis structure, with room to trail winners.

---

### 2. Breakout With Volume

Used when price shows strong positive movement, volume confirms momentum, and the setup can be framed as a breakout followed by a retest or failure level.

Conditions:

* 24h move is strongly positive.
* Volume is elevated.
* Price action suggests continuation after breakout confirmation.
* Risk-to-reward is acceptable.

Output:

* Breakout continuation setup with retest confirmation.
* Stop loss below breakout or invalidation zone.
* Take profit based on risk multiple.
* Exit if breakout fails or a period close loses the retest area.

---

### 3. Defensive Mean Reversion

Used conservatively when a position is under pressure or recent movement is weak, but risk remains controlled.

Conditions:

* Current price is below or near the user entry.
* 24h movement is materially negative.
* The asset may be oversold or extended.
* Risk remains controlled enough to avoid turning a small loss into a large one.

Output:

* Defensive rebound setup.
* Conservative stop loss.
* Partial recovery target.
* Clear invalidation level and quick loss-cutting rule.

---

### 4. No-Trade Signal

Used when conditions are unclear, risk is too high, or the requested setup is too speculative for the MVP framework.

Conditions:

* Risk setting is too aggressive.
* Current price is too far from entry.
* Price movement is extreme.
* Signals conflict.
* Risk-to-reward is poor.
* The user selects a `15m` timeframe without unusually clear momentum, volume, and controlled risk.

Output:

* No-trade recommendation.
* Reason for invalid setup.
* Conditions needed before reconsidering, usually on a higher timeframe close.

This is an important part of PositionSight AI because avoiding bad trades is part of risk management.

---

## Current MVP Strategy Selection Logic

The current MVP uses deterministic, Goodman-inspired rules:

* `no_trade`: Risk setting is high, current price is too far from entry, structure is unclear, the `15m` timeframe is speculative, liquidity is weak, or meme-asset context is fragile.
* `breakout_with_volume`: 24h change is strongly positive, volume is elevated, buy pressure/liquidity are supportive, and price action suggests breakout/retest behavior.
* `defensive_mean_reversion`: Position is under pressure or near support, but risk and liquidity are controlled.
* `trend_following_pullback`: Trend-confirmation setup when price is above support, trend filters are constructive, RSI is not extremely overbought, and risk is controlled.

These rules are intentionally simple for the first hackathon milestone. They make the output explainable and easy to replace with a more advanced AI strategy generator later.

---

## Example Output

```json
{
  "asset": "AVAX",
  "timeframe": "4h",
  "strategyType": "defensive_mean_reversion",
  "entryCondition": "Do not add exposure unless risk is controlled and price stabilizes near support with evidence of a rebound.",
  "exitCondition": "Reduce quickly if price loses the stop level, and only hold for recovery if a higher timeframe close confirms support.",
  "stopLoss": 32.98,
  "takeProfit": 35.84,
  "invalidationLevel": 32.98,
  "riskRules": {
    "maxRiskPercentage": 3,
    "positionSize": 2,
    "estimatedRiskAmount": 2.04
  },
  "dataUsed": {
    "entryPrice": 34,
    "currentPrice": 35.62,
    "percentChange24h": -2.78,
    "volume24h": 525000000,
    "marketCap": 13900000000,
    "source": "mock",
    "lastUpdated": "2026-06-05T00:00:00.000Z"
  }
}
```

---

## Backtesting Goal

Every generated strategy should be exportable as a structured specification.

The MVP should allow users to export:

* Asset
* Timeframe
* Entry rule
* Exit rule
* Stop rule
* Take profit rule
* Invalidation rule
* Risk parameters
* Data used

The goal is to make every AI-generated strategy testable instead of vague.

---

## Hackathon Alignment

PositionSight AI aligns with the hackathon by focusing on:

* Crypto intelligence
* Strategy generation
* CoinMarketCap market data
* Explainable AI output
* Risk visualization
* Backtestable strategy specifications
* Clear user experience for traders

The project is designed for the Crypto Intelligence / Strategy Skill track, not as a live on-chain trading bot.

---

## Disclaimer

PositionSight AI does not execute trades and does not provide financial advice.

It is an educational and research tool designed to help users understand crypto market data, trading risk, and strategy logic more clearly.
