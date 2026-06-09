# Demo Script

## 2-Minute Beginner-Friendly Demo

### 0:00 - 0:15: Scope

Open the app with `npm run dev` and go to `http://localhost:3000`.

PositionSight AI is a beginner-friendly crypto strategy skill. It does not trade or connect wallets. It turns a user position plus CMC-ready market context into an explainable strategy and backtest-ready JSON.

If `CMC_API_KEY` is configured, the app uses CoinMarketCap live quote data. It also attempts CoinMarketCap historical OHLCV for the chart and indicators. If OHLCV is unavailable because of the response or plan, the app clearly labels the chart as estimated.

### 0:15 - 0:30: Language Toggle

Show the language toggle near the top of the UI.

Switch from `English` to `Español`, then back to `English`. Point out that the app translates key labels, tooltips, warnings, and beginner strategy explanations without exposing API keys or changing the strategy output.

### 0:30 - 0:55: AVAX Default Scenario

Use the default state:

- Token mode: `Beginner`
- Token: `AVAX`
- Position intent: `Analyze entry`
- Entry price: `34`
- Total capital: `1000`
- Calculated position size: shown as read-only
- Strategy Timeframe: `1d`
- Strategy mode: `Auto Recommended`
- Max risk: `1%`

Show the chart levels: stop loss, entry, current price, and trailing exit. Invalidation remains in the JSON export for backtesting, but it is hidden from the beginner chart. If CoinMarketCap historical OHLCV is available, point out that indicators can be calculated from historical candles. If it is unavailable, explain that the chart path is estimated and clearly labeled. Then point to the market context card: history source, MA 20/50/200, RSI, ATR, average volume, support, resistance, sentiment, liquidity, and derivatives bias.

Point to the `Simple Backtest` panel. Explain that it uses CoinMarketCap historical candles when available. If historical OHLCV is unavailable on the current plan, it clearly labels the source as estimated from live quote context or demo dataset. This is a simple educational backtest, not a professional simulator.

### 0:55 - 1:15: Strategy Explanation Cards

Open the explanation card for `Auto Recommended`.

Explain that PositionSight teaches patient, risk-first strategy thinking: avoid overtrading, wait for confirmation, define invalidation, and accept no-trade when risk is unclear.

Open `Breakout + Retest` or `Risk Check / No-Trade` to show the beginner-friendly sections:

- Simple explanation
- Best used when
- Avoid when
- What the system checks
- Beginner note

Switch Position intent to `Manage open position` and point out that the position size field becomes editable existing holdings. The panel now talks about holding, reducing, waiting, stop status, and trailing exit instead of a fresh buy. Switch to `Exit / Sell review` and point out that the visible condition becomes a sell/reduce/hold review for an existing long position, not a buy signal and not short selling.

For a stop-breach example, set an intentionally high average entry price so current price is below the stop. The panel should show stop breached / exit review required and should not describe the position as healthy.

### 1:15 - 1:35: LINK No-Trade Scenario

Select `LINK` and set entry price to `12`.

This creates a large distance between entry and current market price. Auto Recommended should reject the setup or show a poor fit because the entry is too far from current price for a clean risk-managed strategy.

Explain that no-trade is a valid capital-protection output, especially for beginners. In the Simple Backtest panel, note that no-trade records whether entry was not triggered instead of pretending a trade was opened.

### 1:35 - 1:50: FET Breakout Scenario

Select `FET`.

Set:

- Entry price: `1.37`
- Total capital: `1000`
- Strategy Timeframe: `1d`
- Strategy mode: `Auto Recommended`
- Max risk: `1%`

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
- `positionIntent`
- `marketContext`
- `dataProvenance`
- `strategyTimeframe`
- `timeframeCategory`
- `analysisInterval`
- `evaluatedStrategyType`
- `finalRiskVerdict`
- `riskBadge`
- `noTradeRecommended`
- `intentAction`
- `stopStatus`
- `positionSizingMode`
- `shouldAddExposure`
- `shouldReduceExposure`
- `shouldExitPosition`
- `allowShort: false`
- `backtestResult`
- `backtestSource`
- `candlesUsed`
- execution assumptions
- evaluation metrics

Close by noting that the export records whether the latest quote source was CoinMarketCap live data and whether historical candles came from CoinMarketCap OHLCV or estimated fallback.

Also point out that the export keeps `takeProfit` for backtest compatibility, while the beginner UI frames that level as a trailing-exit reference.

## Timeframe Note

PositionSight supports `15m`, `30m`, `1h`, `1d`, `1w`, and `1mo`.

Intraday timeframes are available for testing and strategy research, but the app treats them with more caution and requires stronger confirmation. The demo should emphasize that PositionSight does not encourage overtrading, and that higher timeframes are usually better for patient, risk-first position decisions.

Selecting `15m`, `30m`, or `1h` should show the intraday warning. Risk above `1%` should show the capital-preservation warning.
