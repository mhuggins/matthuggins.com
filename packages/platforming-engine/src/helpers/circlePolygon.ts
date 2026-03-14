import type { Point } from "../types";

/**
 * Returns polygon vertices approximating a circle of the given radius.
 * When used with `smooth = true` on a Part, the collision system treats
 * this shape as an exact circle using `radius` directly — the polygon is
 * used for rendering purposes.
 */
export function circlePolygon(radius: number, segments = 16): Point[] {
  return Array.from({ length: segments }, (_, i) => {
    const angle = (i / segments) * Math.PI * 2;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
}
