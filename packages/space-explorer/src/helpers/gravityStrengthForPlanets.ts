import { type PlanetData } from "../types";
import { clamp } from "./clamp";

export const GRAVITY_RADIUS_MULTIPLIER = 2.0;
export const GRAVITY_RADIUS_BASE = 240;

export function gravityStrengthForPlanet(planet: PlanetData, px: number, py: number) {
  const dx = planet.x - px;
  const dy = planet.y - py;
  const dist = Math.hypot(dx, dy);
  const altitude = Math.max(0, dist - planet.radius);
  const influence = planet.radius * GRAVITY_RADIUS_MULTIPLIER + GRAVITY_RADIUS_BASE;
  const t = clamp(altitude / influence, 0, 1);
  const falloff = 1 - t * t * (3 - 2 * t);
  return planet.gravity * (0.015 + 0.985 * falloff);
}
