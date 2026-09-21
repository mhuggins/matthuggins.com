import type { EyeStyle } from "../types";
import { FINDER_SIZE } from "./matrix";
import { type CornerRadii, ringPath, roundedRectPath } from "./paths";

interface EyeGeometry {
  outer: CornerRadii;
  inner: CornerRadii;
  center: CornerRadii;
}

/**
 * Radii for each eye style, in module units. The ring is always one module
 * thick and the pupil is always 3x3, so only the corners change.
 */
const EYE_GEOMETRY: Record<EyeStyle, EyeGeometry> = {
  square: { outer: [0, 0, 0, 0], inner: [0, 0, 0, 0], center: [0, 0, 0, 0] },
  rounded: { outer: [2, 2, 2, 2], inner: [1.2, 1.2, 1.2, 1.2], center: [0.9, 0.9, 0.9, 0.9] },
  circle: {
    outer: [3.5, 3.5, 3.5, 3.5],
    inner: [2.5, 2.5, 2.5, 2.5],
    center: [1.5, 1.5, 1.5, 1.5],
  },
  leaf: { outer: [2.6, 0, 2.6, 0], inner: [1.7, 0, 1.7, 0], center: [1.1, 0, 1.1, 0] },
};

export interface EyePaths {
  /** The outer ring, to be filled with `fill-rule: evenodd`. */
  ring: string;
  /** The 3x3 pupil. */
  pupil: string;
}

/** Paths for one finder pattern whose top-left module sits at `col`, `row`. */
export function buildEyePaths(style: EyeStyle, col: number, row: number): EyePaths {
  const geometry = EYE_GEOMETRY[style];

  return {
    ring: ringPath(col, row, FINDER_SIZE, 1, geometry.outer, geometry.inner),
    pupil: roundedRectPath(col + 2, row + 2, 3, 3, geometry.center),
  };
}
