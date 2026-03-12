export function applyCollisionImpulse(
  a: { vx: number; vy: number; mass: number; x: number; y: number; anchored?: boolean },
  b: { vx: number; vy: number; mass: number; x: number; y: number; anchored?: boolean },
) {
  const dist = Math.hypot(b.x - a.x, b.y - a.y) || 0.001;
  const nx = (b.x - a.x) / dist;
  const ny = (b.y - a.y) / dist;
  const relVx = a.vx - b.vx;
  const relVy = a.vy - b.vy;
  const relDotN = relVx * nx + relVy * ny;
  if (relDotN >= 0) {
    return;
  }

  // Anchored parts act as infinite mass — their inverse mass contribution is 0.
  const invMassA = a.anchored ? 0 : 1 / a.mass;
  const invMassB = b.anchored ? 0 : 1 / b.mass;
  if (invMassA + invMassB === 0) {
    return;
  }

  const j = (2 * relDotN) / (invMassA + invMassB);
  if (!a.anchored) {
    a.vx -= j * invMassA * nx;
    a.vy -= j * invMassA * ny;
  }
  if (!b.anchored) {
    b.vx += j * invMassB * nx;
    b.vy += j * invMassB * ny;
  }
}
