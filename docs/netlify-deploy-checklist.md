# Netlify Deploy Checklist

## Pre-deploy Local Commands

Run these before deploying or recording the final demo:

```bash
npm run lint
npm run typecheck
npm run build
npm run test:e2e
git status --short
```

## Netlify Environment Variables

Add private values in Netlify Project configuration > Environment variables.

Required for live CoinMarketCap data:

```text
CMC_API_KEY
```

Optional for external AI explanations:

```text
OPENROUTER_API_KEY
AI_PROVIDER
AI_MODEL
```

Do not add private keys with a `NEXT_PUBLIC_` prefix.

No Binance environment variables are required. Paper Backtest uses Binance public klines only.

## What To Verify After Deploy

- The home page loads.
- English and Spanish language switching works.
- Strategy Builder can select tokens, intents, and all supported timeframes.
- Strategy Panel, Scanner, chart markers, and JSON export render.
- Paper Backtest accepts a PositionSight JSON export.
- Paper Backtest runs against Binance public klines or a clearly labeled demo fallback.
- Paper Backtest line and candle views both render.
- The UI shows no private API keys, `.env.local`, or provider key placeholders.
- No text asks the user to connect a Binance account or enter Binance API keys.

## Demo Recording Flow

1. Open the deployed app.
2. Show Strategy Builder in English.
3. Select a supported token and explain the risk-first strategy panel.
4. Switch to Spanish and show translated labels.
5. Export or copy the PositionSight JSON.
6. Open Paper Backtest.
7. Paste the JSON and run the paper simulation.
8. Toggle Line and Candles chart views.
9. Show the security disclaimer: no orders, no wallets, no exchange account access.

## Security Checklist

- `.env.local` is not committed.
- `.env` is not committed.
- `.env.example` contains names only, with empty values.
- `CMC_API_KEY` is server-side only.
- `OPENROUTER_API_KEY` is server-side only and optional.
- No private API key uses `NEXT_PUBLIC_`.
- Binance usage is limited to public market-data klines.
- No Binance account, wallet, balance, withdrawal, user-data, earnings, or trading endpoint is used.
- The app does not place orders, sign transactions, connect wallets, or access exchange accounts.
