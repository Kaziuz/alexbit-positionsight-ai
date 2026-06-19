import type { AiExplanationResult, StrategyExport } from "@/types/strategy";
import type { Language } from "./i18n";

export type ExplainStrategyWithProviderInput = {
  artifact: StrategyExport;
  language: Language;
};

type ProviderMessage = {
  role: "system" | "user";
  content: string;
};

type ProviderResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const systemPrompt =
  "You are an explanation layer for PositionSight AI. You must not create new trading decisions, prices, signals, entries, exits, or risk levels. You must only explain the deterministic engine output. Preserve the original risk badge, verdict, intent action, stop status, and strategy mode exactly. Do not provide financial advice.";

function getAiBaseUrl() {
  return (process.env.AI_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/$/, "");
}

function getAiApiKey() {
  return process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY || "";
}

export function isAiProviderConfigured() {
  if (process.env.AI_EXPLAIN_ENABLED === "false") {
    return false;
  }

  return Boolean(getAiApiKey() && process.env.AI_MODEL);
}

export function getAiProviderName() {
  return process.env.AI_PROVIDER || "compatible-provider";
}

export function getAiModelName() {
  return process.env.AI_MODEL || null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function isAiExplanationResult(value: unknown): value is AiExplanationResult {
  const candidate = value as AiExplanationResult;

  return (
    typeof candidate?.summary === "string" &&
    isStringArray(candidate.whatTheSystemSaw) &&
    isStringArray(candidate.whyThisDecision) &&
    typeof candidate.riskExplanation === "string" &&
    isStringArray(candidate.whatToWatchNext) &&
    isStringArray(candidate.limitations) &&
    typeof candidate.notFinancialAdvice === "string"
  );
}

function parseJsonContent(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  return JSON.parse(fenced ? fenced[1] : trimmed) as unknown;
}

function buildProviderPayload(input: ExplainStrategyWithProviderInput) {
  const artifact = input.artifact;

  return {
    language: input.language,
    immutableDecisionFields: {
      riskBadge: artifact.riskBadge,
      riskVerdict: artifact.finalRiskVerdict,
      intentAction: artifact.intentAction,
      stopStatus: artifact.stopStatus,
      strategyMode: artifact.selectedStrategyMode,
      positionIntent: artifact.positionIntent,
      strategyTimeframe: artifact.strategyTimeframe,
    },
    strategyDecision: artifact.strategyDecision,
    strategySpec: artifact.strategySpec,
    marketContext: artifact.marketContext,
    backtestResult: artifact.backtestResult,
    dataProvenance: artifact.dataProvenance,
    warnings: artifact.warnings,
    responseShape: {
      summary: "string",
      whatTheSystemSaw: ["string"],
      whyThisDecision: ["string"],
      riskExplanation: "string",
      whatToWatchNext: ["string"],
      limitations: ["string"],
      notFinancialAdvice: "string",
    },
  };
}

export async function explainStrategyWithProvider(
  input: ExplainStrategyWithProviderInput,
): Promise<AiExplanationResult> {
  const apiKey = getAiApiKey();
  const model = process.env.AI_MODEL;

  if (!apiKey || !model) {
    throw new Error("AI provider is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  const messages: ProviderMessage[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: JSON.stringify(buildProviderPayload(input)),
    },
  ];
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  if (process.env.AI_SITE_URL) {
    headers["HTTP-Referer"] = process.env.AI_SITE_URL;
  }

  if (process.env.AI_APP_NAME) {
    headers["X-Title"] = process.env.AI_APP_NAME;
  }

  try {
    const response = await fetch(`${getAiBaseUrl()}/chat/completions`, {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error("AI provider request failed.");
    }

    const payload = (await response.json()) as ProviderResponse;
    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI provider response did not include content.");
    }

    const explanation = parseJsonContent(content);

    if (!isAiExplanationResult(explanation)) {
      throw new Error("AI provider response did not match the explanation schema.");
    }

    return explanation;
  } finally {
    clearTimeout(timeout);
  }
}
