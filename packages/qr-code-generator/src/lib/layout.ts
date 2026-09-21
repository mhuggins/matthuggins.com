import assertNever from "assert-never";
import type { FrameStyle } from "../types";
import { QUIET_ZONE } from "./matrix";

/**
 * Nominal pixel width of one module. Everything downstream is proportional to
 * the resulting symbol width, so this only fixes the SVG's coordinate scale —
 * exports re-rasterize at whatever size the visitor picks.
 */
export const MODULE_PX = 12;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
}

export interface FrameLayout {
  width: number;
  height: number;
  /** Position and size of the symbol block, quiet zone included. */
  qr: { x: number; y: number; size: number };
  /** Corner radius of the outermost rectangle. */
  cardRadius: number;
  /** True when the card is filled with the frame color instead of the background. */
  solidCard: boolean;
  /** Background panel drawn behind the symbol on solid-card frames. */
  panel: Rect | null;
  /** Stroked outline drawn over the card. */
  border: (Rect & { strokeWidth: number; dashed: boolean }) | null;
  /** Baseline position for the caption, already centered horizontally. */
  label: { x: number; y: number; fontSize: number } | null;
}

/** Fraction of the font size to drop the baseline by to optically center text. */
const BASELINE_OFFSET = 0.34;

/**
 * Work out the frame geometry for a symbol `moduleCount` modules wide.
 *
 * Every measurement is a fraction of the symbol width rather than a fixed pixel
 * value, so a dense vCard code and a short URL get visually identical framing.
 */
export function buildLayout(moduleCount: number, frame: FrameStyle): FrameLayout {
  const qrBlock = (moduleCount + QUIET_ZONE * 2) * MODULE_PX;

  switch (frame) {
    case "none":
      return {
        width: qrBlock,
        height: qrBlock,
        qr: { x: 0, y: 0, size: qrBlock },
        cardRadius: 0,
        solidCard: false,
        panel: null,
        border: null,
        label: null,
      };

    case "border": {
      const pad = qrBlock * 0.05;
      const strokeWidth = qrBlock * 0.022;
      const size = qrBlock + pad * 2;
      const cardRadius = qrBlock * 0.07;

      return {
        width: size,
        height: size,
        qr: { x: pad, y: pad, size: qrBlock },
        cardRadius,
        solidCard: false,
        panel: null,
        border: {
          x: strokeWidth / 2,
          y: strokeWidth / 2,
          width: size - strokeWidth,
          height: size - strokeWidth,
          radius: Math.max(cardRadius - strokeWidth / 2, 0),
          strokeWidth,
          dashed: false,
        },
        label: null,
      };
    }

    case "label-below":
    case "label-above": {
      const pad = qrBlock * 0.05;
      const bandHeight = qrBlock * 0.2;
      const width = qrBlock + pad * 2;
      const height = qrBlock + pad + bandHeight;
      const fontSize = bandHeight * 0.44;
      const above = frame === "label-above";
      const qrY = above ? bandHeight : pad;
      const bandCenter = above ? bandHeight / 2 : qrBlock + pad + bandHeight / 2;

      return {
        width,
        height,
        qr: { x: pad, y: qrY, size: qrBlock },
        cardRadius: qrBlock * 0.06,
        solidCard: true,
        panel: { x: pad, y: qrY, width: qrBlock, height: qrBlock, radius: qrBlock * 0.03 },
        border: null,
        label: { x: width / 2, y: bandCenter + fontSize * BASELINE_OFFSET, fontSize },
      };
    }

    case "ticket": {
      const pad = qrBlock * 0.07;
      const bandHeight = qrBlock * 0.18;
      const strokeWidth = qrBlock * 0.012;
      const inset = pad * 0.35;
      const width = qrBlock + pad * 2;
      const height = qrBlock + pad + bandHeight;
      const fontSize = bandHeight * 0.42;

      return {
        width,
        height,
        qr: { x: pad, y: pad, size: qrBlock },
        cardRadius: qrBlock * 0.05,
        solidCard: false,
        panel: null,
        border: {
          x: inset,
          y: inset,
          width: width - inset * 2,
          height: height - inset * 2,
          radius: qrBlock * 0.04,
          strokeWidth,
          dashed: true,
        },
        label: {
          x: width / 2,
          y: qrBlock + pad + bandHeight / 2 + fontSize * BASELINE_OFFSET,
          fontSize,
        },
      };
    }

    default:
      return assertNever(frame);
  }
}
