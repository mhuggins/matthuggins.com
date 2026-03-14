import { Part } from "./Part";

/**
 * A Part whose collision shape is defined by a radial surface sampler rather
 * than a polygon. Used for planets and other objects with terrain-aware
 * surfaces that may be concave.
 */
export abstract class HeightFieldPart extends Part {
  /** Nominal radius — used for rendering, gravity, and minimap. Not a collision radius. */
  radius = 0;

  override get boundingRadius(): number {
    return this.radius * 4;
  }

  /** Returns the surface radius at the given world-space angle from this part's center. */
  abstract surfaceRadiusAt(angle: number): number;

  /** Returns the surface radius in the direction of the given world-space point. */
  surfaceRadiusToward(x: number, y: number): number {
    return this.surfaceRadiusAt(Math.atan2(y - this.y, x - this.x));
  }
}
