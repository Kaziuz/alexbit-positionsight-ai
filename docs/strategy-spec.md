# PositionSight AI - Strategy Specification

PositionSight AI is a crypto intelligence and strategy skill for the Crypto Intelligence / Strategy Skills track.

The engine is Goodman-inspired in a broad, paraphrased sense: it favors confirmation, breakout/retest structure, trailing exits, quick invalidation, and capital preservation over constant signal generation.

This project is not a live trading bot and does not provide financial advice. It is a decision-support and educational tool for strategy generation, risk visualization, and structured backtesting.

---

## Input

The strategy engine receives:

* Token symbol
* Entry price
* Current price
* Total capital
* Calculated position size
* Strategy timeframe: `15m`, `30m`, `1h`, `1d`, `1w`, or `1mo`
* Timeframe category: `intraday`, `daily`, `weekly`, or `monthly`
* Analysis interval: same as the selected strategy timeframe
* Maximum risk percentage, defaulting to a risk-first `1%`
* Position intent: `analyze_entry`, `manage_open_position`, or `exit_review`
* Market data source
* Market quote
* Technical context, calculated from OHLCV when available or estimated when OHLCV is unavailable
* Risk profile

Example input:

```json
{
  "symbol": "AVAX",
  "entryPrice": 34,
  "totalCapital": 1000,
  "positionSize": 2.6578,
  "strategyTimeframe": "1d",
  "timeframeCategory": "daily",
  "analysisInterval": "1d",
  "maxRiskPercentage": 1,
  "positionIntent": "analyze_entry"
}
```

---

## Strategy Timeframe

Supported strategy timeframes:

* `15m`: Intraday research context. Requires stronger liquidity, momentum, and risk control.
* `30m`: Intraday research context. Still speculative and confirmation-heavy.
* `1h`: Short-term context with moderate strictness.
* `1d`: Default balanced context for patient position decisions.
* `1w`: Higher-timeframe context for more patient trend confirmation.
* `1mo`: Highest-timeframe context for long-range structure and risk review.

Intraday timeframes are supported for testing and strategy research. The engine does not automatically block them, but it treats them as higher-risk and more speculative and the UI warns beginners to validate setups on the daily timeframe. Higher timeframes are better suited to patient, risk-first decisions.

---

## Risk-First Position Sizing

PositionSight calculates position size from:

* Total capital
* Maximum risk percentage
* Entry price
* ATR 14 when available
* Stop distance

The preferred stop distance is `ATR 14 * 1.75`. If ATR is unavailable or invalid, the engine falls back to the existing percent-based stop behavior and records a warning. If the ATR stop would be at or below zero, the stop is clamped to a safe positive value.

The beginner UI presents the compatible `takeProfit` value as a `Trailing exit` reference. The JSON keeps `takeProfit` for backtest compatibility and also includes `trailingExit` metadata:

```json
{
  "enabled": true,
  "method": "atr_ma_trailing",
  "initialReference": 40.77,
  "atrMultiple": 1.75
}
```

---

## Position Intent

PositionSight supports three non-executing intent modes:

* `analyze_entry`: Evaluate whether a new entry setup is valid.
* `manage_open_position`: Review whether an existing position should be held, reduced, trailed, or left unchanged.
* `exit_review`: Review whether an existing position should be reduced or exited based on stop, trailing exit, support loss, risk, and market context.

The intent now changes the actual decision layer:

* `analyze_entry` can allow adding long exposure only when confirmation and risk are acceptable.
* `manage_open_position` uses existing holdings and does not create a fresh buy/open rule by default.
* `exit_review` reviews hold, reduce, or exit conditions for an existing long position.
* If current price is at or below the stop, `stopStatus` becomes `stop_breached` and the decision must not present the position as healthy.

Sell review means reducing or exiting an existing long position. It does not add exchange execution, wallet connection, order placement, Binance integration, short selling, or live trading.

---

## StrategySpec

`StrategySpec` is the stable human-readable strategy object.

Fields:

* `asset`: Token symbol.
* `strategyTimeframe`: Selected timeframe.
* `positionIntent`: The user's selected intent.
* `timeframeCategory`: Derived timeframe category.
* `analysisInterval`: Backtest interval, matching the selected timeframe.
* `strategyType`: One of `trend_following_pullback`, `breakout_with_volume`, `defensive_mean_reversion`, or `no_trade`.
* `entryCondition`: Human-readable condition for a valid strategy entry.
* `exitCondition`: Human-readable condition for exit or reduction.
* `stopLoss`: Suggested stop level, preferring ATR-based volatility distance when available.
* `takeProfit`: Compatibility field used as the initial trailing-exit reference.
* `invalidationLevel`: Price level where the strategy thesis is considered invalid.
* `riskRules`: Position intent, max risk, total capital, calculated position size, stop distance, estimated risk amount, and optional no-trade reason.
* `dataUsed`: Entry price, current price, 24h change, volume, market cap, data source, and timestamp.

---

## StrategyDecision Wrapper

The UI exports a richer `StrategyDecision` wrapper around `StrategySpec`.

`StrategyDecision` includes:

* `spec`: The strategy specification.
* `selectedMode`: The user's selected strategy mode.
* `selectedStrategyMode`: Same selected mode, repeated for export consumers.
* `evaluatedStrategyType`: The strategy type currently being evaluated in the UI.
* `finalRiskVerdict`: `good`, `needs_confirmation`, `poor_fit`, or `no_trade_recommended`.
* `riskBadge`: `low`, `medium`, `high`, or `no_trade` panel/export classification.
* `intentAction`: `evaluate_entry`, `wait_for_confirmation`, `hold_with_trailing_exit`, `reduce_risk`, `exit_or_reduce`, `stop_breached`, or `no_trade`.
* `intentVerdict`: Entry, hold, reduce, exit-review, wait, or no-trade verdict.
* `stopStatus`: `above_stop`, `near_stop`, or `stop_breached`.
* `shouldAddExposure`: Whether the strategy allows adding long exposure.
* `shouldReduceExposure`: Whether reducing long exposure is recommended.
* `shouldExitPosition`: Whether the existing long position should be treated as an exit review.
* `allowShort`: Always `false`.
* `sizingMode`: `calculated_new_entry` or `existing_position`.
* `positionSizingMode`: Export alias for `sizingMode`.
* `chartMode`: Entry validation, position management, or exit review.
* `noTradeRecommended`: Boolean risk verdict flag.
* `noTradeReason`: Optional reason shown when the risk engine recommends no-trade.
* `selectedBy`: `auto` or `user`.
* `fit`: `good`, `caution`, or `poor`.
* `whyThisStrategy`: Plain-English reason for the selected or rejected setup.
* `warnings`: Beginner-friendly warnings when a chosen strategy does not fit.
* `nextConfirmation`: What the user should wait for before acting.
* `beginnerExplanation`: Short educational explanation of the decision.

When the user manually selects a poor-fitting strategy, PositionSight does not hide that selection. The UI shows the selected/evaluated strategy separately from the risk verdict, so a manual `Trend Confirmation` test can still display `no_trade_recommended` as the risk outcome.

---

## Export Artifact Contract

The downloaded JSON is a strict artifact wrapper for backtesting tools and other strategy-skill consumers.

Top-level fields:

* `schemaVersion`: Currently `1.0.0`.
* `skill`: Metadata for skill name, track, and artifact type.
* `inputSchema`: Machine-readable description of position inputs, strategy timeframe, and strategy mode.
* `dataProvenance`: Source, live/mock status, intended live source, and generation timestamp.
* `chartSeriesType`: `historical_ohlcv` when real candles are available, otherwise `estimated_from_live_quote_context`.
* `advancedContextType`: `estimated_until_ohlcv` for fields that still depend on unavailable historical data.
* `dataRequirements`: OHLCV requirements, minimum history, lookback periods, and required indicators.
* `positionIntent`: Selected non-executing user intent.
* `intentAction`, `intentVerdict`, and `stopStatus`: Intent-aware decision metadata.
* `riskBadge` and `riskVerdict`: Beginner-facing risk classification and machine-readable verdict.
* `shouldAddExposure`, `shouldReduceExposure`, and `shouldExitPosition`: Long-only exposure management flags.
* `positionSizingMode`: `calculated_new_entry` for entry planning or `existing_position` for manage/exit review.
* `calculatedPositionSize` or `existingPositionSize`: Size context used for the current intent.
* `allowShort`: Always `false`.
* `history`: Historical source, candles used, indicator source, indicators, and indicator warnings.
* `selectedStrategyMode`: Strategy mode chosen by the user or Auto Recommended.
* `evaluatedStrategyType`: Strategy type evaluated for the current decision.
* `finalRiskVerdict`: Machine-readable risk verdict.
* `noTradeRecommended`: Boolean flag for abstain/no-trade recommendation.
* `noTradeReason`: Optional abstain/no-trade reason.
* `backtestSpec`: Machine-readable strategy contract.
* `backtestResult`: Simple deterministic backtest v1 result.
* `backtestSource`: `historical_cmc`, `estimated_from_live_quote`, or `demo_dataset`.
* `candlesUsed`: Number of candles used by the simple backtest.
* `executionAssumptions`: Starting capital, fees, slippage, order type, and no-short/no-leverage constraints.
* `evaluationMetrics`: Metrics a backtest runner should calculate.
* `validation`: Backtest readiness and limitations.
* `strategySpec`: Human-readable strategy specification.
* `strategyDecision`: User/auto selection metadata and warnings.
* `marketContext`: CMC-ready context used to produce the strategy.
* `explanation`: Human-readable explanation.
* `warnings`: Human-readable warnings.

### Data Requirements

```json
{
  "requiredSeries": ["open", "high", "low", "close", "volume"],
  "interval": "1d",
  "minimumHistoryDays": 200,
  "lookbackPeriods": 200,
  "requiredIndicators": ["ma20", "ma50", "ma200", "rsi14", "atr14", "support", "resistance"]
}
```

For `1w` and `1mo`, the export includes `aggregationHint: "weekly"` or `aggregationHint: "monthly"` so a backtest runner can aggregate base OHLCV correctly.

### BacktestSpec

`backtestSpec` is optimized for machines.

It includes:

* `strategyType`
* `strategyTimeframe`
* `positionIntent`
* `timeframeCategory`
* `analysisInterval`
* Optional `aggregationHint` for weekly/monthly analysis
* Optional intraday `warning`
* `signal`: `LONG`, `HOLD`, `REDUCE`, `CONDITIONAL_LONG`, `EXIT`, or `ABSTAIN`
* `shouldOpenPosition`
* `entryRule`
* `exitRule`
* `stopRule`
* `takeProfitRule`, retained for compatibility and used as the initial trailing-exit reference
* `trailingExit`
* `invalidationRule`
* `positionSizing`
* `riskManagement`

For intraday selections, `backtestSpec.warning` notes that shorter timeframes require stronger confirmation and may be more speculative.

For `manage_open_position` and `exit_review`, `shouldOpenPosition` remains `false`; the artifact reviews hold/reduce/exit conditions and does not create execution instructions. `EXIT` and `REDUCE` mean long-position risk review outcomes, not short selling.

### Simple Backtest V1

`backtestResult` is a small deterministic evaluation of the generated strategy. It is designed for hackathon demonstration and backtest artifact completeness, not professional trade simulation.

Sources:

* `historical_cmc`: Uses CoinMarketCap historical OHLCV candles when available.
* `estimated_from_live_quote`: Uses estimated candles from live quote context when historical OHLCV is unavailable.
* `demo_dataset`: Uses a small documented demo series only when no history response is available in the UI.

The result records entry trigger, stop hit, trailing-exit hit, final price, gross return percentage, estimated P/L, max drawdown, win/loss result, notes, and limitations.

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

This keeps no-trade as a first-class backtestable outcome.

---

## Strategy Modes

The UI supports:

* `Auto Recommended`: PositionSight selects the best fit from current market context.
* `Trend Confirmation`: Tests whether a continuation setup fits after confirmation.
* `Breakout + Retest`: Tests whether breakout momentum, volume, and retest logic are present.
* `Defensive Rebound`: Tests whether a conservative recovery setup is valid.
* `Risk Check / No-Trade`: Tests whether avoiding the trade is the best risk-management outcome.

Each strategy mode has bilingual beginner explanations in English and Spanish. The explanations are educational and not financial advice.

---

## Market Data

The MVP supports a server-only CoinMarketCap latest quote integration with mock fallback.

The app calls:

```text
GET https://pro-api.coinmarketcap.com/v3/cryptocurrency/quotes/latest
```

from a Next.js API route only. The browser never receives `CMC_API_KEY`.

When `CMC_API_KEY` is configured and CoinMarketCap responds successfully, `MarketContext.source` is `coinmarketcap` and quote fields use live latest quote data:

* Current price
* 24h percent change
* 24h volume
* Market cap when available
* Last updated timestamp

When the key is missing or the request fails, `MarketContext.source` is `mock` and the route returns deterministic mock data with a fallback warning.

The MVP also attempts server-only historical OHLCV through:

```text
GET /api/history?symbol=ADA&timeframe=1d
```

When CoinMarketCap historical candles are available, the history response uses `source: "coinmarketcap"` and indicators are calculated from real OHLCV candles. When the API response or plan cannot provide historical candles, the response uses `source: "estimated"` and includes a warning that candles and indicators are estimated from live quote context.

The UI uses `MA 20`, `MA 50`, and `MA 200` labels. Internally, existing EMA-derived fields remain available for backward compatibility, and the export includes MA aliases.

CoinMarketCap latest quote fields are live when `CMC_API_KEY` is configured. Indicators are real only when OHLCV candles are available. Future versions should map market-pair liquidity, news/community signals, and other available data into the same `MarketContext` shape.

TODO for future data depth: market pairs, richer sentiment sources, order book/liquidity feeds, and derivatives context can enhance the existing liquidity/sentiment fields when the product is ready for additional integrations.

---

## Strategy Selection Logic

The current MVP uses deterministic, timeframe-aware rules:

* `15m` and `30m`: stricter liquidity, volume, confirmation, and risk requirements.
* `1h`: moderate short-term strictness.
* `1d`: balanced default context.
* `1w` and `1mo`: more patient trend confirmation.
* `no_trade`: risk setting is high, current price is too far from entry, structure is unclear, liquidity is weak, trend/sentiment are weak, or meme-asset context is fragile.
* `breakout_with_volume`: positive movement, volume, buy pressure/liquidity, and breakout/retest behavior are supportive.
* `defensive_mean_reversion`: position is under pressure or near support, but risk and liquidity are controlled.
* `trend_following_pullback`: price is above support, trend filters are constructive, RSI is not extremely overbought, and risk is controlled.

The engine does not no-trade solely because the selected timeframe is intraday.

---

## Example Output

```json
{
  "asset": "AVAX",
  "strategyTimeframe": "1d",
  "timeframeCategory": "daily",
  "analysisInterval": "1d",
  "strategyType": "defensive_mean_reversion",
  "positionIntent": "analyze_entry",
  "entryCondition": "Do not add exposure unless risk is controlled and price stabilizes near support with evidence of a rebound.",
  "exitCondition": "Reduce quickly if price loses the stop level, and only hold for recovery if the selected timeframe confirms support.",
  "stopLoss": 32.98,
  "takeProfit": 40.77,
  "invalidationLevel": 32.98,
  "riskRules": {
    "maxRiskPercentage": 1,
    "positionIntent": "analyze_entry",
    "totalCapital": 1000,
    "positionSize": 2.6578,
    "calculatedPositionSize": 2.6578,
    "positionSizingMethod": "atr_volatility",
    "estimatedRiskAmount": 10
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

## UI Language Support

The app supports:

* English
* Spanish

The language toggle changes major UI labels, tooltips, warnings, and strategy education cards.

---

## Backtesting Goal

Every generated strategy should be exportable as a structured specification with:

* Asset
* Strategy timeframe
* Analysis interval
* Entry rule
* Exit rule
* Stop rule
* Take profit rule
* Invalidation rule
* Risk parameters
* Data provenance
* Execution assumptions
* Evaluation metrics

The goal is to make every generated strategy testable instead of vague.

---

## Disclaimer

PositionSight AI does not execute trades and does not provide financial advice.

It is an educational and research tool designed to help users understand crypto market data, trading risk, and strategy logic more clearly.
