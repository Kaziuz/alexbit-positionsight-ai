# Strategy Specification

The strategy engine converts a position and a market quote into a structured JSON object designed for backtesting and review.

## Input

```json
{
  "symbol": "BNB",
  "entryPrice": 585,
  "positionSize": 2,
  "timeframe": "4h",
  "maxRiskPercentage": 3
}
```

## Output Fields

- `asset`: Token symbol.
- `timeframe`: Strategy timeframe.
- `strategyType`: One of `trend_following_pullback`, `breakout_with_volume`, `defensive_mean_reversion`, or `no_trade`.
- `entryCondition`: Human-readable condition for a valid strategy entry.
- `exitCondition`: Human-readable condition for exit or reduction.
- `stopLoss`: Suggested stop level based on configured risk.
- `takeProfit`: Suggested profit target using a simple reward-to-risk multiple.
- `invalidationLevel`: Price level where the strategy thesis is considered invalid.
- `riskRules`: Max risk, position size, estimated risk amount, and optional no-trade reason.
- `dataUsed`: Entry price, current price, 24h change, volume, market cap, source, and timestamp.

## Strategy Selection Logic

The current MVP uses deterministic rules:

- `no_trade`: Risk setting is high or current price is too far from entry.
- `breakout_with_volume`: 24h change is strongly positive and volume is elevated.
- `defensive_mean_reversion`: Position is under pressure or the 24h move is materially negative.
- `trend_following_pullback`: Default strategy when risk is controlled and momentum is not extreme.

These rules are intentionally simple for the first hackathon milestone. They make the output explainable and easy to replace with a more advanced AI strategy generator later.

## Example Output

```json
{
  "asset": "BNB",
  "timeframe": "4h",
  "strategyType": "trend_following_pullback",
  "entryCondition": "Wait for price to hold above entry after a shallow pullback and confirm momentum with a higher low.",
  "exitCondition": "Exit on stop loss, take profit, or a close below invalidation level.",
  "stopLoss": 567.45,
  "takeProfit": 616.59,
  "invalidationLevel": 564.61,
  "riskRules": {
    "maxRiskPercentage": 3,
    "positionSize": 2,
    "estimatedRiskAmount": 35.1
  },
  "dataUsed": {
    "entryPrice": 585,
    "currentPrice": 612.36,
    "percentChange24h": -0.48,
    "volume24h": 1680000000,
    "marketCap": 94000000000,
    "source": "mock",
    "lastUpdated": "2026-06-05T00:00:00.000Z"
  }
}
```
