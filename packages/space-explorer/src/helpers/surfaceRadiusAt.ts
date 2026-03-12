import { type PlanetData } from "../types";
import { wrapAngle } from "./wrapAngle";

export function surfaceRadiusAt(planet: PlanetData, angle: number): number {
  let offset = 0;
  for (const feature of planet.terrain) {
    const diff = wrapAngle(angle - feature.angle);
    if (Math.abs(diff) < feature.width) {
      const t = diff / feature.width; // -1 to 1
      offset += feature.amplitude * 0.5 * (1 + Math.cos(Math.PI * t));
    }
  }
  return planet.radius + offset;
}
