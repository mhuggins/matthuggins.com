export function clampVelocity(vx: number, vy: number, maxSpeed: number) {
  const speed = Math.hypot(vx, vy);
  if (speed <= maxSpeed) {
    return { vx, vy };
  }

  const scale = maxSpeed / speed;
  return { vx: vx * scale, vy: vy * scale };
}
