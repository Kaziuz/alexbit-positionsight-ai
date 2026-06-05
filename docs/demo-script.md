# Demo Script

## 2-Minute Beginner-Friendly Demo

### 0:00 - 0:15: Scope

Open the app with `npm run dev` and go to `http://localhost:3000`.

PositionSight AI is a beginner-friendly crypto strategy skill. It does not trade, connect wallets, or use live API keys yet. It turns a user position plus mock CMC-ready market context into an explainable strategy and backtest-ready JSON.

### 0:15 - 0:40: AVAX Default Scenario

Use the default state:

- Token mode: `Beginner`
- Token: `AVAX`
- Entry price: `34`
- Position size: `2`
- Timeframe: `4h`
- Strategy mode: `Auto Recommended`
- Max risk: `3%`

Show the chart levels: stop loss, invalidation, entry, current price, and take profit. Then point to the market context card: trend, RSI, ATR, sentiment, liquidity, and derivatives bias. Explain that these are mock/proxy fields designed for later CMC mapping.

### 0:40 - 1:00: LINK No-Trade Scenario

Select `LINK` and set entry price to `12`.

This creates a large distance between entry and current mock price. Auto Recommended should reject the setup or show a poor fit because the entry is too far from current price for a clean risk-managed strategy.

Explain that no-trade is a valid risk-management output, especially for beginners.

### 1:00 - 1:20: FET Breakout Scenario

Select `FET`.

Set:

- Entry price: `1.37`
- Position size: `100`
- Timeframe: `4h`
- Strategy mode: `Auto Recommended`
- Max risk: `3%`

FET has bullish mock trend context, breakout-style close position, stronger momentum, supportive buy pressure, and positive sentiment. Use this to explain breakout + retest logic.

### 1:20 - 1:40: Manual Strategy Selection

Keep `FET` selected and manually choose `Defensive Rebound`.

Show the Fit, Selected by, warnings, and Why this strategy card. Explain that manual mode does not force a poor strategy. It teaches the user when a chosen idea does or does not fit the market context.

### 1:40 - 2:00: JSON Export

Click `Export JSON`.

The filename follows:

```text
positionsight-{SYMBOL}-{TIMEFRAME}-{strategyType}.json
```

The export includes:

- `strategySpec`
- strategy decision metadata
- mock `marketContext`
- explanation
- warnings

Close by noting that Day 3 can connect server-only CoinMarketCap data while preserving mock fallback for demo reliability.
