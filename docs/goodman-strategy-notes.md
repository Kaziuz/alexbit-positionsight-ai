# Goodman-Inspired Strategy Notes

These are original project research notes used to shape the PositionSight AI MVP strategy logic. They paraphrase trading principles associated with Glen Goodman's longer-term crypto trading approach and do not reproduce book text.

## Core Principles

- Avoid day trading and overtrading. The product should discourage constant short-term signal chasing.
- Prefer `1h`, `4h`, and `1d` context. Ultra-short timeframes should be treated as speculative by default.
- Wait for trend confirmation. The system should avoid guessing bottoms and prefer evidence that an upward trend has started or resumed.
- Use breakout and retest logic. A strong move is more useful after price confirms strength and gives a clear failure level.
- Respect period closes. Timeframe closes matter more than temporary intraperiod noise.
- Use moving averages as filters or trailing exits. The MVP does not calculate averages yet, but strategy language can reference them as future backtest rules.
- Cut losing trades quickly. Stop loss and invalidation levels should be explicit and testable.
- Size positions by risk. Trade size should be evaluated through risk per setup, not through available capital alone.
- Use no-trade as a risk tool. Avoiding unclear or excessive-risk setups is a valid strategy outcome.

## PositionSight AI Mapping

- The `15m` timeframe should usually produce `no_trade` unless trend, volume, and risk are unusually clear.
- Strategy copy should guide users toward waiting for confirmation instead of reacting to every price tick.
- Breakout setups should include retest or failed-retest language so the trade has a clear invalidation point.
- Exit rules should emphasize quick loss cutting plus trailing logic for winners.
- Risk percentage and estimated risk amount should stay visible because the MVP is risk-first, not prediction-first.
- The engine should preserve capital by rejecting excessive risk, unrealistic entry distance, and unclear structure.
- The UI should teach risk-first thinking to beginners by explaining why a strategy fits, why it is risky, or why no-trade is the better choice.

## Strategy Type Mapping

- `trend_following_pullback`: trend-confirmation setup after price holds or retests a constructive area.
- `breakout_with_volume`: breakout and retest setup when strength is confirmed by volume and price remains above entry.
- `defensive_mean_reversion`: conservative recovery setup only when risk is controlled and invalidation is clear.
- `no_trade`: capital-preservation outcome for excessive risk, speculative short timeframes, unclear structure, or unrealistic distance from entry.
