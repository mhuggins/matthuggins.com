import { Part } from "./Part";

export class RectangularPart extends Part {
  width = 0;
  height = 0;
  tiltAngle = 0; // world-space rotation of the rectangle (radians)

  /**
   * If set, contact is only registered when the circle center is on the
   * positive side of this normal (dot product > 0). Use for one-way surfaces.
   */
  solidNormal: { x: number; y: number } | null = null;
}
