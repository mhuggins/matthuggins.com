import { TerrainFeature } from "../types";

export const GRAVITY_RADIUS_MULTIPLIER = 2.0;
export const GRAVITY_RADIUS_BASE = 240;

interface PlanetData {
  x: number;
  y: number;
  radius: number;
  gravity: number;
  terrain: TerrainFeature[];
}

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

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function length(x: number, y: number) {
  return Math.hypot(x, y);
}

export function normalize(x: number, y: number) {
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len };
}

export function dot(ax: number, ay: number, bx: number, by: number) {
  return ax * bx + ay * by;
}

export function wrapAngle(angle: number) {
  while (angle <= -Math.PI) angle += Math.PI * 2;
  while (angle > Math.PI) angle -= Math.PI * 2;
  return angle;
}

export function shortestAngleDiff(from: number, to: number) {
  return wrapAngle(to - from);
}

export function angleToUpVector(angle: number) {
  return { x: Math.sin(angle), y: -Math.cos(angle) };
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

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

export function clampVelocity(vx: number, vy: number, maxSpeed: number) {
  const speed = Math.hypot(vx, vy);
  if (speed <= maxSpeed) return { vx, vy };
  const scale = maxSpeed / speed;
  return { vx: vx * scale, vy: vy * scale };
}

export function applyCollisionImpulse(
  a: { vx: number; vy: number; mass: number; x: number; y: number },
  b: { vx: number; vy: number; mass: number; x: number; y: number },
) {
  const dist = Math.hypot(b.x - a.x, b.y - a.y) || 0.001;
  const nx = (b.x - a.x) / dist;
  const ny = (b.y - a.y) / dist;
  const relVx = a.vx - b.vx;
  const relVy = a.vy - b.vy;
  const relDotN = relVx * nx + relVy * ny;
  if (relDotN >= 0) return;
  const j = (2 * relDotN) / (1 / a.mass + 1 / b.mass);
  a.vx -= (j / a.mass) * nx;
  a.vy -= (j / a.mass) * ny;
  b.vx += (j / b.mass) * nx;
  b.vy += (j / b.mass) * ny;
}
