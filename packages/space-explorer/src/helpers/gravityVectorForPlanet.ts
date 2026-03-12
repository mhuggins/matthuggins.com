import { type PlanetData } from "../types";
import { gravityStrengthForPlanet } from "./gravityStrengthForPlanets";
import { normalize } from "./normalize";

export function gravityVectorForPlanet<T extends PlanetData>(planet: T, px: number, py: number) {
  const dx = planet.x - px;
  const dy = planet.y - py;
  const dir = normalize(dx, dy);
  const strength = gravityStrengthForPlanet(planet, px, py);
  return {
    planet,
    dirX: dir.x,
    dirY: dir.y,
    gx: dir.x * strength,
    gy: dir.y * strength,
    strength,
  };
}
