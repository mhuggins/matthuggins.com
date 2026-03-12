export function angleToUpVector(angle: number) {
  return { x: Math.sin(angle), y: -Math.cos(angle) };
}
