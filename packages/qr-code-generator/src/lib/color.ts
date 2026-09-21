const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHexColor(value: string): boolean {
  return HEX.test(value.trim());
}

/** Expand `#abc` to `#aabbcc` and lower-case it; returns null for bad input. */
export function normalizeHex(value: string): string | null {
  const hex = value.trim().toLowerCase();
  if (!HEX.test(hex)) {
    return null;
  }
  if (hex.length === 4) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex;
}

function channels(hex: string): [number, number, number] {
  const normalized = normalizeHex(hex) ?? "#000000";
  return [
    Number.parseInt(normalized.slice(1, 3), 16),
    Number.parseInt(normalized.slice(3, 5), 16),
    Number.parseInt(normalized.slice(5, 7), 16),
  ];
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colors, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Pick black or white text for a filled band, whichever reads better on it. */
export function readableTextColor(background: string): string {
  return luminance(background) > 0.5 ? "#111827" : "#ffffff";
}

/**
 * Scanners need a clear light/dark split between the modules and the paper.
 * Below roughly 3:1 most readers start failing, well before WCAG's text
 * thresholds matter, so that is the line we warn at.
 */
export const MIN_SCAN_CONTRAST = 3;
