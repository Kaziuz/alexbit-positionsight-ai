import type { AiExplanationResult, BacktestResult, StrategyExport } from "@/types/strategy";
import type { Language } from "./i18n";

type ExplanationInput = {
  artifact: StrategyExport;
  language: Language;
};

function compactList(values: Array<string | undefined | null>) {
  return values.filter((value): value is string => Boolean(value));
}

function sourceLabel(artifact: StrategyExport, language: Language) {
  const historySource = artifact.historySource ?? artifact.dataProvenance.historySource;

  if (language === "es") {
    return historySource === "coinmarketcap"
      ? "cotización y velas históricas de CoinMarketCap"
      : "cotización disponible con velas/indicadores estimados cuando el histórico no está disponible";
  }

  return historySource === "coinmarketcap"
    ? "CoinMarketCap quote and historical candles"
    : "available quote data with estimated candles/indicators when historical data is unavailable";
}

function getBacktestSourceText(backtestResult: BacktestResult | undefined, language: Language) {
  if (!backtestResult) {
    return language === "es"
      ? "El backtest simple todavía no fue generado para esta vista."
      : "The simple backtest has not been generated for this view yet.";
  }

  if (language === "es") {
    if (backtestResult.backtestSource === "historical_cmc") {
      return `Backtest simple con ${backtestResult.candlesUsed} velas históricas de CoinMarketCap.`;
    }

    if (backtestResult.backtestSource === "estimated_from_live_quote") {
      return `Backtest simple con ${backtestResult.candlesUsed} velas estimadas desde el contexto de cotización.`;
    }

    return `Backtest simple con ${backtestResult.candlesUsed} velas de demo documentadas.`;
  }

  if (backtestResult.backtestSource === "historical_cmc") {
    return `Simple backtest used ${backtestResult.candlesUsed} CoinMarketCap historical candles.`;
  }

  if (backtestResult.backtestSource === "estimated_from_live_quote") {
    return `Simple backtest used ${backtestResult.candlesUsed} estimated candles from quote context.`;
  }

  return `Simple backtest used ${backtestResult.candlesUsed} documented demo candles.`;
}

export function buildDeterministicExplanation(input: ExplanationInput): AiExplanationResult {
  const { artifact, language } = input;
  const decision = artifact.strategyDecision;
  const spec = artifact.strategySpec;
  const context = artifact.marketContext;
  const warnings = artifact.warnings ?? [];
  const noTradeReason = artifact.noTradeReason ?? spec.riskRules.noTradeReason;
  const riskBadge = artifact.riskBadge ?? decision.riskBadge;
  const stopStatus = artifact.stopStatus ?? decision.stopStatus;
  const strategyMode = artifact.selectedStrategyMode ?? decision.selectedStrategyMode;
  const backtestText = getBacktestSourceText(artifact.backtestResult, language);
  const sourceText = sourceLabel(artifact, language);

  if (language === "es") {
    return {
      summary: `El motor determinista evaluó ${artifact.positionIntent} para ${spec.asset} en ${artifact.strategyTimeframe} y mantiene el nivel de riesgo "${riskBadge}". La acción de intención es "${decision.intentAction}" y el estado del stop es "${stopStatus}".`,
      whatTheSystemSaw: compactList([
        `Precio actual: ${context.quote.price}. Movimiento 24h: ${context.quote.percentChange24h}%.`,
        `Tendencia: ${context.technicals.trendState}. RSI 14: ${context.technicals.rsi14}.`,
        `Soporte: ${context.technicals.support}. Resistencia: ${context.technicals.resistance}.`,
        `Fuente de datos: ${sourceText}.`,
        backtestText,
      ]),
      whyThisDecision: compactList([
        `Modo de estrategia preservado: ${strategyMode}.`,
        `Veredicto determinista preservado: ${artifact.finalRiskVerdict}.`,
        decision.whyThisStrategy,
        noTradeReason ? `Razón no-trade: ${noTradeReason}.` : undefined,
      ]),
      riskExplanation: `El nivel "${riskBadge}" viene del motor de reglas usando distancia al stop, riesgo configurado, liquidez, tendencia, estado del stop y ajuste de estrategia. Esta explicación no cambia ese resultado.`,
      whatToWatchNext: compactList([
        decision.nextConfirmation,
        `Vigilar si el precio respeta el stop ${spec.stopLoss} y el nivel de salida dinámica ${spec.takeProfit}.`,
        warnings[0],
      ]),
      limitations: compactList([
        "La explicación es determinista y no ejecuta operaciones.",
        "No hay conexión de wallet, exchange ni firma de transacciones.",
        ...(artifact.backtestResult?.limitations ?? []),
      ]),
      notFinancialAdvice:
        "Esto es una explicación educativa del resultado determinista de PositionSight AI. No es asesoría financiera.",
    };
  }

  return {
    summary: `The deterministic engine evaluated ${artifact.positionIntent} for ${spec.asset} on ${artifact.strategyTimeframe} and kept the risk badge as "${riskBadge}". The intent action is "${decision.intentAction}" and stop status is "${stopStatus}".`,
    whatTheSystemSaw: compactList([
      `Current price: ${context.quote.price}. 24h move: ${context.quote.percentChange24h}%.`,
      `Trend: ${context.technicals.trendState}. RSI 14: ${context.technicals.rsi14}.`,
      `Support: ${context.technicals.support}. Resistance: ${context.technicals.resistance}.`,
      `Data source: ${sourceText}.`,
      backtestText,
    ]),
    whyThisDecision: compactList([
      `Strategy mode preserved: ${strategyMode}.`,
      `Deterministic verdict preserved: ${artifact.finalRiskVerdict}.`,
      decision.whyThisStrategy,
      noTradeReason ? `No-trade reason: ${noTradeReason}.` : undefined,
    ]),
    riskExplanation: `The "${riskBadge}" badge comes from the rule engine using stop distance, configured risk, liquidity, trend, stop status, and strategy fit. This explanation does not change that result.`,
    whatToWatchNext: compactList([
      decision.nextConfirmation,
      `Watch whether price respects the stop at ${spec.stopLoss} and trailing-exit reference at ${spec.takeProfit}.`,
      warnings[0],
    ]),
    limitations: compactList([
      "This explanation is deterministic and does not execute trades.",
      "No wallet, exchange, or transaction signing is connected.",
      ...(artifact.backtestResult?.limitations ?? []),
    ]),
    notFinancialAdvice:
      "This is an educational explanation of the deterministic PositionSight AI output. It is not financial advice.",
  };
}
