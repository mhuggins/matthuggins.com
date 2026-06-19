import type { Quantity, Rational } from "measurable";

/**
 * Denominators a cook actually wants to see. When an exact magnitude reduces to
 * one of these we render it as a fraction; otherwise we fall back to a rounded
 * decimal (the usual case after a cross-system conversion).
 */
const NICE_DENOMINATORS = new Set([1n, 2n, 3n, 4n, 6n, 8n, 16n]);

const VULGAR: Record<string, string> = {
  "1/2": "½",
  "1/3": "⅓",
  "2/3": "⅔",
  "1/4": "¼",
  "3/4": "¾",
  "1/6": "⅙",
  "5/6": "⅚",
  "1/8": "⅛",
  "3/8": "⅜",
  "5/8": "⅝",
  "7/8": "⅞",
};

function glyph(numerator: bigint, denominator: bigint): string {
  const key = `${numerator}/${denominator}`;
  return VULGAR[key] ?? key;
}

/** Render an exact magnitude as a cook-friendly fraction or a rounded decimal. */
export function formatMagnitude(value: Rational): string {
  const { n, d } = value;

  if (NICE_DENOMINATORS.has(d)) {
    const sign = n < 0n ? "-" : "";
    const abs = n < 0n ? -n : n;
    const whole = abs / d;
    const remainder = abs % d;

    if (remainder === 0n) {
      return `${sign}${whole}`;
    }

    const lead = whole > 0n ? `${whole} ` : "";
    return `${sign}${lead}${glyph(remainder, d)}`;
  }

  return `${Math.round(value.toNumber() * 100) / 100}`;
}

/**
 * A compact unit label: the unit's `symbol` when it has one (`g`, `mL`, `tbsp`,
 * `oz`, `L`), otherwise the magnitude-aware `auto` label from the library
 * (`cup`/`cups`, `gill`/`gills`). No custom name → symbol table of our own.
 */
export function unitLabel(quantity: Quantity): string {
  return quantity.unit.symbol ?? quantity.formatParts({ unit: "auto" }).unit;
}

/**
 * A quantity rendered as `"<fraction-or-decimal> <label>"`. A unit with no
 * label (the count unit) renders as a bare magnitude.
 */
export function formatQuantity(quantity: Quantity): string {
  const label = unitLabel(quantity);
  const magnitude = formatMagnitude(quantity.rational);
  return label ? `${magnitude} ${label}` : magnitude;
}

/**
 * A quantity rendered with a plain decimal magnitude (no fractions), for
 * converted/metric contexts where `1.5 L` reads better than `1 ½ L`. The
 * magnitude goes through the library's locale-aware formatter.
 */
export function formatDecimal(quantity: Quantity): string {
  const label = unitLabel(quantity);
  const { magnitude } = quantity.formatParts({ numberFormat: { maximumFractionDigits: 2 } });
  return label ? `${magnitude} ${label}` : magnitude;
}
