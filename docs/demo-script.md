# Demo Script

## 1. Open the App

Start the app with `npm run dev` and open `http://localhost:3000`.

Introduce PositionSight AI as a crypto intelligence and strategy skill for the CoinMarketCap x Trust Wallet hackathon.

## 2. Select a Token

Use the eligible token selector and choose an asset such as `BNB`, `BTC`, or `SOL`.

Explain that the first MVP uses a local eligible token list and mock market quotes so the demo is stable before the live CoinMarketCap API is connected.

## 3. Enter Position Details

Set:

- Entry price.
- Position size.
- Timeframe.
- Max risk percentage.

The app immediately updates the position view.

## 4. Review Market Context

Point out:

- Mock current price.
- 24h change.
- Market cap.
- Position value.
- Profit or loss from entry.

## 5. Review the Visual Chart

Show how the chart places:

- Stop loss.
- Entry price.
- Current price.
- Take profit.

This makes the position easier to evaluate than raw numbers alone.

## 6. Explain the Strategy Signal

Review the generated strategy type and the entry and exit conditions.

Mention that the MVP supports trend-following pullback, breakout with volume, defensive mean reversion, and no-trade outcomes.

## 7. Export Backtest JSON

Use the export button to download the JSON strategy specification.

Explain that this output is designed to be passed into a backtesting workflow, analytics notebook, or future autonomous agent layer.

## 8. Close With Scope

PositionSight AI does not trade, connect wallets, or expose exchange actions. It provides explainable position intelligence and backtest-ready strategy specs from market data.
