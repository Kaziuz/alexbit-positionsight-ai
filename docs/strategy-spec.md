# PositionSight AI - Strategy Specification

PositionSight AI is an AI-powered crypto intelligence and strategy skill.

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

---

## Market Data

The MVP currently supports mock market data for local testing.

The next milestone is to add a server-only CoinMarketCap integration so the app can fetch live quote data without exposing API keys on the client.

Target CoinMarketCap data:

* Current price
* 24h price change
* 24h volume
* Market cap
* Last updated timestamp
* Quote source

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

Used when the asset is in a constructive trend and risk remains controlled.

Conditions:

* Price remains above a key trend area.
* Momentum is positive but not overextended.
* Entry price is close enough to the current market structure.
* Risk-to-reward remains acceptable.

Output:

* Suggested hold or continuation setup.
* Stop loss below support or structural invalidation.
* Take profit using a simple reward-to-risk multiple.
* Invalidation level below the thesis structure.

---

### 2. Breakout With Volume

Used when price shows strong positive movement and volume confirms momentum.

Conditions:

* 24h move is strongly positive.
* Volume is elevated.
* Price action suggests continuation.
* Risk-to-reward is acceptable.

Output:

* Breakout continuation setup.
* Stop loss below breakout or invalidation zone.
* Take profit based on risk multiple.
* Exit if breakout fails.

---

### 3. Defensive Mean Reversion

Used when a position is under pressure but may be near a potential rebound area.

Conditions:

* Current price is below or near the user entry.
* 24h movement is materially negative.
* The asset may be oversold or extended.
* Risk remains controlled.

Output:

* Defensive rebound setup.
* Conservative stop loss.
* Partial recovery target.
* Clear invalidation level.

---

### 4. No-Trade Signal

Used when conditions are unclear or risk is too high.

Conditions:

* Risk setting is too aggressive.
* Current price is too far from entry.
* Price movement is extreme.
* Signals conflict.
* Risk-to-reward is poor.

Output:

* No-trade recommendation.
* Reason for invalid setup.
* Conditions needed before reconsidering.

This is an important part of PositionSight AI because avoiding bad trades is part of risk management.

---

## Current MVP Strategy Selection Logic

The current MVP uses deterministic rules:

* `no_trade`: Risk setting is high or current price is too far from entry.
* `breakout_with_volume`: 24h change is strongly positive and volume is elevated.
* `defensive_mean_reversion`: Position is under pressure or the 24h move is materially negative.
* `trend_following_pullback`: Default strategy when risk is controlled and momentum is not extreme.

These rules are intentionally simple for the first hackathon milestone. They make the output explainable and easy to replace with a more advanced AI strategy generator later.

---

## Example Output

```json
{
  "asset": "AVAX",
  "timeframe": "4h",
  "strategyType": "trend_following_pullback",
  "entryCondition": "Wait for price to hold above entry after a shallow pullback and confirm momentum with a higher low.",
  "exitCondition": "Exit on stop loss, take profit, or a close below invalidation level.",
  "stopLoss": 32.98,
  "takeProfit": 35.84,
  "invalidationLevel": 32.82,
  "riskRules": {
    "maxRiskPercentage": 3,
    "positionSize": 2,
    "estimatedRiskAmount": 2.04
  },
  "dataUsed": {
    "entryPrice": 34,
    "currentPrice": 35.62,
    "percentChange24h": -2.78,
    "volume24h": 426000000,
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
