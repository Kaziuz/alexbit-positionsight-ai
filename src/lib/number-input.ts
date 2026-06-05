export type NumberInputParseResult =
  | {
      ok: true;
      value: number;
      normalized: string;
    }
  | {
      ok: false;
      error: string;
    };

const localizedDecimalPattern = /^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/;

export function parseLocalizedNumberInput(rawValue: string): NumberInputParseResult {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    return { ok: false, error: "Value is required." };
  }

  if (!localizedDecimalPattern.test(trimmed)) {
    return {
      ok: false,
      error: "Use dot or comma for decimals, but values must be valid numbers.",
    };
  }

  const normalized = trimmed.replace(",", ".");
  const value = Number(normalized);

  if (!Number.isFinite(value)) {
    return {
      ok: false,
      error: "Use dot or comma for decimals, but values must be valid numbers.",
    };
  }

  return { ok: true, value, normalized };
}

// Examples:
// parseLocalizedNumberInput("0,002") -> 0.002
// parseLocalizedNumberInput("1,25") -> 1.25
// parseLocalizedNumberInput("34") -> 34
// parseLocalizedNumberInput("1,234.56") -> invalid, because mixed separators are ambiguous.
