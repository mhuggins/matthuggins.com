import type { Point } from "../types";

/**
 * Returns polygon vertices for a rectangle of the given dimensions,
 * centered at the origin in local space. Vertices are in clockwise order
 * (top-left, top-right, bottom-right, bottom-left).
 */
export function rectPolygon(width: number, height: number): Point[] {
  const hw = width / 2;
  const hh = height / 2;
  return [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ];
}
