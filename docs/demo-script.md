# Demo Script

## 2-Minute Beginner-Friendly Demo

### 0:00 - 0:15: Scope

Open the app with `npm run dev` and go to `http://localhost:3000`.

PositionSight AI is a beginner-friendly crypto strategy skill. It does not trade or connect wallets. It turns a user position plus CMC-ready market context into an explainable strategy and backtest-ready JSON.

If `CMC_API_KEY` is configured, the app uses CoinMarketCap live quote data. Otherwise, it safely falls back to mock data.

### 0:15 - 0:30: Language Toggle

Show the language toggle near the top of the UI.

Switch from `English` to `Español`, then back to `English`. Point out that the app translates key labels, tooltips, warnings, and beginner strategy explanations without exposing API keys or changing the strategy output.

### 0:30 - 0:55: AVAX Default Scenario

Use the default state:

- Token mode: `Beginner`
- Token: `AVAX`
- Entry price: `34`
- Position size: `2`
- Strategy Timeframe: `1d`
- Strategy mode: `Auto Recommended`
- Max risk: `3%`

Show the chart levels: stop loss, invalidation, entry, current price, and take profit. Change the strategy timeframe once to show that the estimated projection path changes. Then point to the market context card: trend, RSI, ATR, sentiment, liquidity, and derivatives bias. Explain that CoinMarketCap latest quote can be live, while the chart projection and some advanced context fields are estimated until historical OHLCV is integrated.

### 0:55 - 1:15: Strategy Explanation Cards

Open the explanation card for `Auto Recommended`.

Explain that PositionSight teaches patient, risk-first strategy thinking: avoid overtrading, wait for confirmation, define invalidation, and accept no-trade when risk is unclear.

Open `Breakout + Retest` or `Risk Check / No-Trade` to show the beginner-friendly sections:

- Simple explanation
- Best used when
- Avoid when
- What the system checks
- Beginner note

### 1:15 - 1:35: LINK No-Trade Scenario

Select `LINK` and set entry price to `12`.

This creates a large distance between entry and current market price. Auto Recommended should reject the setup or show a poor fit because the entry is too far from current price for a clean risk-managed strategy.

Explain that no-trade is a valid risk-management output, especially for beginners.

### 1:35 - 1:50: FET Breakout Scenario

Select `FET`.

Set:

- Entry price: `1.37`
- Position size: `100`
- Strategy Timeframe: `1d`
- Strategy mode: `Auto Recommended`
- Max risk: `3%`

FET has bullish estimated trend context, breakout-style close position, stronger momentum, supportive buy pressure, and positive sentiment. Use this to explain breakout + retest logic.

### 1:50 - 2:00: JSON Export

Click `Export JSON`.

The filename follows:

```text
positionsight-{SYMBOL}-{strategyTimeframe}-{strategyType}.json
```

The export includes:

- `strategySpec`
- strategy decision metadata
- `marketContext`
- `dataProvenance`
- `strategyTimeframe`
- `timeframeCategory`
- `analysisInterval`
- `evaluatedStrategyType`
- `finalRiskVerdict`
- `noTradeRecommended`
- execution assumptions
- evaluation metrics

Close by noting that the export records whether the quote source was CoinMarketCap live data or mock fallback.

## Timeframe Note

PositionSight supports `15m`, `30m`, `1h`, `1d`, `1w`, and `1mo`.

Intraday timeframes are available for testing and strategy research, but the app treats them with more caution and requires stronger confirmation. The demo should emphasize that PositionSight does not encourage overtrading, and that higher timeframes are usually better for patient, risk-first position decisions.
