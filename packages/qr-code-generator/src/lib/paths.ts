import assertNever from "assert-never";
import type { ModuleStyle } from "../types";
import type { QrMatrix } from "./matrix";

/** Corner radii in clockwise order: top-left, top-right, bottom-right, bottom-left. */
export type CornerRadii = readonly [number, number, number, number];

/** Keep path data readable (and the exported SVG small) without visible drift. */
function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * A rectangle with independently rounded corners.
 *
 * A zero radius is safe to pass straight to the arc command: the SVG spec says
 * an arc with a zero radius is drawn as a straight line, so square corners fall
 * out of the same code path.
 */
export function roundedRectPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radii: CornerRadii,
): string {
  const max = Math.min(width, height) / 2;
  const clamp = (radius: number) => round(Math.min(Math.max(radius, 0), max));
  const [tl, tr, br, bl] = [clamp(radii[0]), clamp(radii[1]), clamp(radii[2]), clamp(radii[3])];
  const left = round(x);
  const top = round(y);
  const right = round(x + width);
  const bottom = round(y + height);

  return [
    `M${left + tl},${top}`,
    `H${right - tr}`,
    `A${tr},${tr} 0 0 1 ${right},${top + tr}`,
    `V${bottom - br}`,
    `A${br},${br} 0 0 1 ${right - br},${bottom}`,
    `H${left + bl}`,
    `A${bl},${bl} 0 0 1 ${left},${bottom - bl}`,
    `V${top + tl}`,
    `A${tl},${tl} 0 0 1 ${left + tl},${top}`,
    "Z",
  ].join("");
}

/** A circle, expressed as two arcs so it can share a path with other shapes. */
export function circlePath(cx: number, cy: number, radius: number): string {
  const r = round(radius);
  const x = round(cx);
  const y = round(cy);
  return `M${x - r},${y}a${r},${r} 0 1,0 ${r * 2},0a${r},${r} 0 1,0 ${-r * 2},0Z`;
}

/**
 * A ring drawn as one path with an even-odd fill, which keeps non-uniform
 * corner radii (the "leaf" eye) working where a stroke could not.
 */
export function ringPath(
  x: number,
  y: number,
  size: number,
  thickness: number,
  outerRadii: CornerRadii,
  innerRadii: CornerRadii,
): string {
  const outer = roundedRectPath(x, y, size, size, outerRadii);
  const inner = roundedRectPath(
    x + thickness,
    y + thickness,
    size - thickness * 2,
    size - thickness * 2,
    innerRadii,
  );
  return `${outer}${inner}`;
}

/** Shape of a single data module, drawn in a 1x1 cell at `col`, `row`. */
function modulePath(style: ModuleStyle, col: number, row: number): string {
  switch (style) {
    case "square":
      return `M${col},${row}h1v1h-1Z`;
    case "rounded":
      return roundedRectPath(col, row, 1, 1, [0.32, 0.32, 0.32, 0.32]);
    case "dots":
      // Slightly under half a module so neighbouring dots stay visually separate.
      return circlePath(col + 0.5, row + 0.5, 0.45);
    default:
      return assertNever(style);
  }
}

export interface ModulePathOptions {
  matrix: QrMatrix;
  style: ModuleStyle;
  /** Return true to leave a module undrawn (finder patterns, logo cut-out). */
  skip?: (row: number, col: number) => boolean;
}

/**
 * Build the `d` attribute for every dark data module, in module units. The
 * caller positions and scales the result, so nothing here depends on pixels.
 */
export function buildModulePath({ matrix, style, skip }: ModulePathOptions): string {
  const parts: string[] = [];

  for (let row = 0; row < matrix.size; row++) {
    for (let col = 0; col < matrix.size; col++) {
      if (!matrix.modules[row][col]) {
        continue;
      }
      if (skip?.(row, col)) {
        continue;
      }
      parts.push(modulePath(style, col, row));
    }
  }

  return parts.join("");
}
