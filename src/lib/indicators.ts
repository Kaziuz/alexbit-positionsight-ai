import type { OhlcvCandle, TechnicalIndicators } from "@/types/strategy";

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function calculateEMA(values: number[], period: number): number | null {
  const cleanValues = values.filter(isFiniteNumber);

  if (period <= 0 || cleanValues.length < period) {
    return null;
  }

  const multiplier = 2 / (period + 1);
  const initialSlice = cleanValues.slice(0, period);
  let ema = initialSlice.reduce((sum, value) => sum + value, 0) / period;

  for (const value of cleanValues.slice(period)) {
    ema = (value - ema) * multiplier + ema;
  }

  return ema;
}

export function calculateRSI(closes: number[], period = 14): number | null {
  const cleanCloses = closes.filter(isFiniteNumber);

  if (period <= 0 || cleanCloses.length <= period) {
    return null;
  }

  let gains = 0;
  let losses = 0;

  for (let index = 1; index <= period; index += 1) {
    const change = cleanCloses[index] - cleanCloses[index - 1];

    if (change >= 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  let averageGain = gains / period;
  let averageLoss = losses / period;

  for (let index = period + 1; index < cleanCloses.length; index += 1) {
    const change = cleanCloses[index] - cleanCloses[index - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    averageGain = (averageGain * (period - 1) + gain) / period;
    averageLoss = (averageLoss * (period - 1) + loss) / period;
  }

  if (averageLoss === 0) {
    return 100;
  }

  const relativeStrength = averageGain / averageLoss;

  return 100 - 100 / (1 + relativeStrength);
}

export function calculateATR(candles: OhlcvCandle[], period = 14): number | null {
  if (period <= 0 || candles.length <= period) {
    return null;
  }

  const trueRanges: number[] = [];

  for (let index = 1; index < candles.length; index += 1) {
    const candle = candles[index];
    const previousClose = candles[index - 1].close;
    const highLow = candle.high - candle.low;
    const highPreviousClose = Math.abs(candle.high - previousClose);
    const lowPreviousClose = Math.abs(candle.low - previousClose);

    trueRanges.push(Math.max(highLow, highPreviousClose, lowPreviousClose));
  }

  if (trueRanges.length < period) {
    return null;
  }

  return trueRanges.slice(-period).reduce((sum, value) => sum + value, 0) / period;
}

export function calculateAverageVolume(candles: OhlcvCandle[], period = 20): number | null {
  if (period <= 0 || candles.length < period) {
    return null;
  }

  const recentVolumes = candles.slice(-period).map((candle) => candle.volume).filter(isFiniteNumber);

  if (recentVolumes.length < period) {
    return null;
  }

  return recentVolumes.reduce((sum, value) => sum + value, 0) / recentVolumes.length;
}

export function calculateSupportResistance(
  candles: OhlcvCandle[],
  period = 20,
): { support: number | null; resistance: number | null } {
  if (period <= 0 || candles.length < Math.min(period, 5)) {
    return { support: null, resistance: null };
  }

  const recentCandles = candles.slice(-period);
  const lows = recentCandles.map((candle) => candle.low).filter(isFiniteNumber);
  const highs = recentCandles.map((candle) => candle.high).filter(isFiniteNumber);

  if (!lows.length || !highs.length) {
    return { support: null, resistance: null };
  }

  return {
    support: Math.min(...lows),
    resistance: Math.max(...highs),
  };
}

export function calculateTechnicalIndicators(candles: OhlcvCandle[]): {
  indicators: TechnicalIndicators;
  warnings: string[];
} {
  const closes = candles.map((candle) => candle.close);
  const supportResistance = calculateSupportResistance(candles);
  const ma20 = calculateEMA(closes, 20);
  const ma50 = calculateEMA(closes, 50);
  const ma200 = calculateEMA(closes, 200);
  const indicators: TechnicalIndicators = {
    ema20: ma20,
    ema50: ma50,
    ema200: ma200,
    ma20,
    ma50,
    ma200,
    rsi14: calculateRSI(closes, 14),
    atr14: calculateATR(candles, 14),
    averageVolume: calculateAverageVolume(candles, 20),
    support: supportResistance.support,
    resistance: supportResistance.resistance,
  };
  const warnings = Object.entries(indicators)
    .filter(([, value]) => value === null)
    .map(([name]) => `Not enough historical candles to calculate ${name}.`);

  return { indicators, warnings };
}
