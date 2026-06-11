import { NextResponse } from "next/server";
import { buildDeterministicExplanation } from "@/lib/explanations";
import {
  explainStrategyWithProvider,
  getAiModelName,
  getAiProviderName,
  isAiProviderConfigured,
} from "@/lib/llm";
import type { Language } from "@/lib/i18n";
import type { StrategyExport } from "@/types/strategy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExplainRequestBody = {
  artifact?: unknown;
  language?: unknown;
};

function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "es";
}

function isStrategyArtifact(value: unknown): value is StrategyExport {
  const artifact = value as StrategyExport;

  return (
    artifact?.schemaVersion === "1.0.0" &&
    typeof artifact.strategySpec?.asset === "string" &&
    typeof artifact.strategyDecision?.intentAction === "string" &&
    typeof artifact.marketContext?.symbol === "string" &&
    typeof artifact.dataProvenance?.generatedAt === "string" &&
    typeof artifact.selectedStrategyMode === "string" &&
    typeof artifact.finalRiskVerdict === "string"
  );
}

function responsePayload(
  source: "provider" | "deterministic_fallback",
  artifact: StrategyExport,
  language: Language,
  warnings: string[],
  providerExplanation?: ReturnType<typeof buildDeterministicExplanation>,
) {
  return {
    source,
    provider: source === "provider" ? getAiProviderName() : "not_configured",
    model: source === "provider" ? getAiModelName() : null,
    explanation: providerExplanation ?? buildDeterministicExplanation({ artifact, language }),
    warnings,
  };
}

export async function POST(request: Request) {
  let body: ExplainRequestBody;

  try {
    body = (await request.json()) as ExplainRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const language = isLanguage(body.language) ? body.language : "en";

  if (!isStrategyArtifact(body.artifact)) {
    return NextResponse.json({ error: "Invalid strategy artifact." }, { status: 400 });
  }

  const artifact = body.artifact;

  if (!isAiProviderConfigured() || !getAiModelName()) {
    return NextResponse.json(
      responsePayload("deterministic_fallback", artifact, language, [
        "AI provider is disabled or not configured; deterministic fallback was used.",
      ]),
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const explanation = await explainStrategyWithProvider({ artifact, language });

    return NextResponse.json(responsePayload("provider", artifact, language, [], explanation), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      responsePayload("deterministic_fallback", artifact, language, [
        "AI provider response was unavailable or invalid; deterministic fallback was used.",
      ]),
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
