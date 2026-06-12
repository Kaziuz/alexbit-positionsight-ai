# Day 11 Token Validation

Validation date: 2026-06-11

Scope: controlled Day 11 + Day 10 + Day 13 validation for 10 requested tokens, all 3 position intents, English and Spanish UI, chart markers, simple backtest, and JSON export.

Automated coverage: `tests/smoke.spec.ts` includes the matrix test `day 10, 11, and 13 validation matrix covers requested tokens, intents, languages, chart, backtest, and export`.

Data-source rule: validation passes with either CoinMarketCap live quotes or documented mock quote fallback. Historical OHLCV unavailability is not a failure when the app returns estimated candles/indicators and labels `dataProvenance`, `historySource`, `indicatorSource`, `chartSeriesType`, and `backtestSource` honestly. During the full e2e run, CoinMarketCap returned 429 responses for some requests; the app stayed usable through fallback/estimated data paths.

| Token | Intent tested | English UI status | Spanish UI status | JSON export status | Backtest status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| BNB | analyze_entry | Pass | Pass | Pass | Pass | BNB is selectable; chart shows Stop, Entry, Current, and Trailing/Dynamic Exit. |
| BNB | manage_open_position | Pass | Pass | Pass | Pass | Existing-position sizing mode is preserved. |
| BNB | exit_review | Pass | Pass | Pass | Pass | Long-position exit/reduction review only; no shorting or execution. |
| ETH | analyze_entry | Pass | Pass | Pass | Pass | Token selection, risk badge, strategy panel, export, and backtest validated. |
| ETH | manage_open_position | Pass | Pass | Pass | Pass | Strategy panel changes to open-position management copy. |
| ETH | exit_review | Pass | Pass | Pass | Pass | Backtest signal remains compatible with exit/reduce/hold review. |
| LINK | analyze_entry | Pass | Pass | Pass | Pass | Chart path and data provenance remain visible. |
| LINK | manage_open_position | Pass | Pass | Pass | Pass | Risk badge is one of Low, Medium, High, or No Trade. |
| LINK | exit_review | Pass | Pass | Pass | Pass | JSON export remains valid and secret-free. |
| AVAX | analyze_entry | Pass | Pass | Pass | Pass | Existing default behavior preserved. |
| AVAX | manage_open_position | Pass | Pass | Pass | Pass | Open-position mode uses existing position size metadata. |
| AVAX | exit_review | Pass | Pass | Pass | Pass | Exit review explains monitoring/reduce/exit conditions. |
| CAKE | analyze_entry | Pass | Pass | Pass | Pass | DeFi token validates in both languages. |
| CAKE | manage_open_position | Pass | Pass | Pass | Pass | Simple backtest panel stays visible. |
| CAKE | exit_review | Pass | Pass | Pass | Pass | Export includes execution assumptions and validation metadata. |
| TWT | analyze_entry | Pass | Pass | Pass | Pass | Trust Wallet Token validates in both languages. |
| TWT | manage_open_position | Pass | Pass | Pass | Pass | Deterministic panel does not create provider-driven decisions. |
| TWT | exit_review | Pass | Pass | Pass | Pass | Data provenance remains explicit. |
| AAVE | analyze_entry | Pass | Pass | Pass | Pass | DeFi token validates in both languages. |
| AAVE | manage_open_position | Pass | Pass | Pass | Pass | Risk and stop status remain visible. |
| AAVE | exit_review | Pass | Pass | Pass | Pass | Backtest remains visible and exportable. |
| UNI | analyze_entry | Pass | Pass | Pass | Pass | Advanced/deeper token selection path validated. |
| UNI | manage_open_position | Pass | Pass | Pass | Pass | Existing-position metadata is exported. |
| UNI | exit_review | Pass | Pass | Pass | Pass | No wallet, no trading execution, and no short selling. |
| ATOM | analyze_entry | Pass | Pass | Pass | Pass | Main asset validates in both languages. |
| ATOM | manage_open_position | Pass | Pass | Pass | Pass | Strategy panel changes by intent. |
| ATOM | exit_review | Pass | Pass | Pass | Pass | JSON export includes indicators through `history.indicators`. |
| FIL | analyze_entry | Pass | Pass | Pass | Pass | Advanced token selectable and stable. |
| FIL | manage_open_position | Pass | Pass | Pass | Pass | Backtest source is labeled as historical, estimated, or demo. |
| FIL | exit_review | Pass | Pass | Pass | Pass | Export does not expose `.env.local` or API key names/values. |

Required JSON fields validated:

- `schemaVersion`
- `skill`
- `inputSchema`
- `symbol`
- `entryPrice`
- `positionSize` or calculated/existing position size metadata
- `totalCapital`
- `strategyTimeframe`
- `positionIntent`
- `strategySpec`
- `strategyDecision`
- `marketContext`
- `history.indicators`
- `dataProvenance`
- `backtestSpec`
- `executionAssumptions`
- `validation`

Result: pass. Remaining caveat: historical OHLCV can still be unavailable depending on the active CoinMarketCap plan; the app continues with estimated candles and documents that in the UI/export.
