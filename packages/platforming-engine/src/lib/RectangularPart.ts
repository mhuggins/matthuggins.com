import { Part } from "./Part";

export class RectangularPart extends Part {
  override readonly shape = "rect" as const;
  width = 0;
  height = 0;
  tiltAngle = 0; // world-space rotation of the rectangle (radians)

  /**
   * If set, used as fallback contact normal when the circle center is inside
   * the rect (closest-point distance is zero). Also used by subclasses to
   * implement isPermeable() for one-way surfaces.
   */
  faceNormal: { x: number; y: number } | null = null;
}
