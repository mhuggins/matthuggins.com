import autoBind from "auto-bind";
import { applyCollisionImpulse } from "../helpers/applyCollisionImpulse";
import { Camera } from "./Camera";
import { HeightFieldPart } from "./HeightFieldPart";
import { Input } from "./Input";
import { Part } from "./Part";
import { Player } from "./Player";

const DEFAULT_COLLISION_BUFFER = 0.2; // contact slop: catches floating-point near-misses on exact surface snaps
const DEFAULT_SEPARATION_BUFFER = 4; // hysteresis: contact persists until clearly separated

type ContactEntry = { a: Part; b: Part; nx: number; ny: number };
// nx/ny point from a toward b

type ContactResult = {
  nx: number; // from a toward b
  ny: number;
  overlap: number; // positive = penetrating, negative = gap
  overlapping: boolean;
  touching: boolean;
};

export class World<TInput extends Input = Input, TCamera extends Camera = Camera> {
  public readonly canvas: HTMLCanvasElement;
  public readonly camera: TCamera;

  protected ctx: CanvasRenderingContext2D;
  protected input: TInput;
  protected parts: Part[] = [];
  protected contactPairs: Map<string, ContactEntry> = new Map();

  private container: HTMLElement;
  private collisionBuffer: number;
  private separationBuffer: number;
  private rafId = 0;

  constructor({
    canvas,
    container,
    input,
    camera,
    collisionBuffer = DEFAULT_COLLISION_BUFFER,
    separationBuffer = DEFAULT_SEPARATION_BUFFER,
  }: {
    canvas: HTMLCanvasElement;
    container: HTMLElement;
    input: TInput;
    camera: TCamera;
    collisionBuffer?: number;
    separationBuffer?: number;
  }) {
    autoBind(this);
    this.canvas = canvas;
    this.container = container;
    this.ctx = canvas.getContext("2d")!;
    this.input = input;
    this.camera = camera;
    this.collisionBuffer = collisionBuffer;
    this.separationBuffer = separationBuffer;

    window.addEventListener("resize", this.handleResize);
    this.handleResize();
  }

  add(part: Part): void {
    part.world = this;
    this.parts.push(part);
    part.onSpawn();
  }

  remove(part: Part): void {
    part.onDestroy();
    const idx = this.parts.indexOf(part);
    if (idx !== -1) {
      this.parts.splice(idx, 1);
    }
  }

  handleResize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(this.container.clientWidth * dpr);
    this.canvas.height = Math.floor(this.container.clientHeight * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  reset(): void {
    this.camera.reset();
  }

  start(): void {
    this.reset();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener("resize", this.handleResize);
    this.input.destroy();
  }

  tick(): void {
    this.applyGravity();
    for (const part of [...this.parts]) {
      part.inputsEnabled = true;
      part.update(this.input);
    }
    this.resolveCollisions();
    this.afterPhysics();
    this.camera.update();
    this.input.endFrame();
    this.render();
    this.rafId = requestAnimationFrame(this.tick);
  }

  // Hook for subclasses to run logic after physics but before camera/render each tick.
  protected afterPhysics(): void {
    this.updatePlayerGrounding();
  }

  protected applyGravity(): void {
    const sources = this.parts.filter((p) => p.gravity > 0);
    for (const target of this.parts) {
      if (target.anchored || target.mass === 0 || !target.obeysGravity) {
        continue;
      }

      for (const source of sources) {
        if (source === target) {
          continue;
        }

        const dx = source.x - target.x;
        const dy = source.y - target.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const force = this.gravityForce(source, target, dist);
        target.vx += (dx / dist) * force * target.gravityScale;
        target.vy += (dy / dist) * force * target.gravityScale;
      }
    }
  }

  // Override in game World for custom falloff curves.
  protected gravityForce(source: Part, _target: Part, _dist: number): number {
    return source.gravity; // naive constant; games override with smoothstep etc.
  }

  private updatePlayerGrounding(): void {
    for (const part of this.parts) {
      if (!(part instanceof Player)) {
        continue;
      }

      // Use dominant gravity direction as "up" reference so the grounding
      // threshold stays accurate even when the player has free-rotated via jetpack.
      let gravUpX = part.upX;
      let gravUpY = part.upY;
      let maxForce = 0;
      for (const source of this.parts) {
        if (source.gravity <= 0 || source === part) {
          continue;
        }
        const dx = source.x - part.x;
        const dy = source.y - part.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const force = this.gravityForce(source, part, dist) * part.gravityScale;
        if (force > maxForce) {
          maxForce = force;
          // "up" is opposite of the pull direction (away from source)
          gravUpX = -(dx / dist);
          gravUpY = -(dy / dist);
        }
      }

      let bestPart: Part | null = null;
      let bestNx = 0,
        bestNy = 0;
      let bestDot = Math.cos(part.gradability); // threshold

      for (const entry of this.contactPairs.values()) {
        let other: Part, nx: number, ny: number;
        if (entry.a === part) {
          other = entry.b;
          nx = -entry.nx;
          ny = -entry.ny; // flip: toward player
        } else if (entry.b === part) {
          other = entry.a;
          nx = entry.nx;
          ny = entry.ny;
        } else {
          continue;
        }

        const upDot = nx * gravUpX + ny * gravUpY;
        if (upDot > bestDot && part.canGroundOn(other)) {
          bestDot = upDot;
          bestPart = other;
          bestNx = nx;
          bestNy = ny;
        }
      }

      const wasGrounded = part.groundedOn !== null;
      part.groundedOn = bestPart;

      if (bestPart !== null) {
        part.groundedNormal = { x: bestNx, y: bestNy };
        part.surfaceTangent = { x: -bestNy, y: bestNx };
        part.upX = bestNx;
        part.upY = bestNy;
      }

      if (!wasGrounded && bestPart !== null) {
        part.onLand(bestPart);
      } else if (wasGrounded && bestPart === null) {
        part.onLeaveGround();
      }
    }
  }

  private resolveCollisions(): void {
    const cb = this.collisionBuffer;
    const sb = this.separationBuffer;

    const collidable = this.parts.filter((p) => p.canCollide);
    const newContacts: Map<string, ContactEntry> = new Map();

    for (let i = 0; i < collidable.length; i++) {
      for (let j = i + 1; j < collidable.length; j++) {
        const a = collidable[i];
        const b = collidable[j];
        if (a.anchored && b.anchored) {
          continue;
        }

        // Broad-phase: skip pairs that are clearly too far apart.
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const maxDist = a.boundingRadius + b.boundingRadius + sb;
        if (dx * dx + dy * dy > maxDist * maxDist) continue;

        const key = `${Math.min(a.id, b.id)}-${Math.max(a.id, b.id)}`;
        const wasContact = this.contactPairs.has(key);

        const contact = findContact(a, b, cb, sb);
        if (contact === null) {
          continue;
        }

        // Check permeability — pass the normal pointing FROM that part TOWARD the other.
        // contact.nx/ny points from a toward b.
        if (a.isPermeable(contact.nx, contact.ny, b.x, b.y)) {
          continue;
        }
        if (b.isPermeable(-contact.nx, -contact.ny, a.x, a.y)) {
          continue;
        }

        const { nx, ny, overlap, overlapping, touching } = contact;

        // Contact persists until the parts are clearly separated (hysteresis).
        if (overlapping || (wasContact && touching)) {
          newContacts.set(key, { a, b, nx, ny });
        }

        if (!overlapping) {
          continue;
        }

        // Capture impact speed before velocities change.
        const impactSpeed = Math.abs((a.vx - b.vx) * nx + (a.vy - b.vy) * ny);

        // Separate the pair, only moving non-anchored parts.
        const shareA = a.anchored ? 0 : b.anchored ? 1 : 0.5;
        const shareB = b.anchored ? 0 : a.anchored ? 1 : 0.5;
        const separationOverlap = Math.max(0, overlap);
        a.x -= nx * separationOverlap * shareA;
        a.y -= ny * separationOverlap * shareA;
        b.x += nx * separationOverlap * shareB;
        b.y += ny * separationOverlap * shareB;

        applyCollisionImpulse(a, b, nx, ny);

        // Only notify on first contact this pair has made.
        if (!wasContact) {
          a.onCollide(b, -nx, -ny, impactSpeed);
          b.onCollide(a, nx, ny, impactSpeed);
        }
      }
    }

    // Fire onSeparate for pairs that were in contact last frame but no longer are.
    for (const [key, entry] of this.contactPairs) {
      if (!newContacts.has(key)) {
        entry.a.onSeparate(entry.b);
        entry.b.onSeparate(entry.a);
      }
    }

    this.contactPairs = newContacts;
  }

  render(): void {
    const ctx = this.ctx;
    const sortedParts = this.parts.sort((a, b) => a.zIndex - b.zIndex);

    ctx.save();
    for (const part of sortedParts) {
      part.render(ctx);
    }
    ctx.restore();
  }
}

// ─── Contact dispatch ──────────────────────────────────────────────────────

function findContact(a: Part, b: Part, cb: number, sb: number): ContactResult | null {
  // Height field (planet) always uses its own contact algorithm.
  if (a instanceof HeightFieldPart) {
    return heightFieldContact(a, b, cb, sb);
  }
  if (b instanceof HeightFieldPart) {
    // heightFieldContact returns nx from the height field toward the other part.
    // We need nx from a toward b, so flip.
    const c = heightFieldContact(b, a, cb, sb);
    return c ? { ...c, nx: -c.nx, ny: -c.ny } : null;
  }

  if (a.smooth && b.smooth) return circleCircleContact(a, b, cb, sb);
  if (a.smooth) return circlePolyContact(a, b, cb, sb);
  if (b.smooth) {
    // circlePolyContact(circle=b, poly=a) returns nx from b toward a — flip.
    const c = circlePolyContact(b, a, cb, sb);
    return c ? { ...c, nx: -c.nx, ny: -c.ny } : null;
  }
  return polyPolyContact(a, b, cb, sb);
}

// ─── Circle–circle ─────────────────────────────────────────────────────────

function circleCircleContact(a: Part, b: Part, cb: number, sb: number): ContactResult | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 0.001;
  const overlap = a.boundingRadius + b.boundingRadius - dist;
  if (overlap < -sb) return null;
  return {
    nx: dx / dist,
    ny: dy / dist,
    overlap,
    overlapping: overlap >= -cb,
    touching: overlap >= -sb,
  };
}

// ─── Circle–polygon SAT ────────────────────────────────────────────────────
// Returns nx/ny pointing from `circle` (a) toward `poly` (b).

function circlePolyContact(circle: Part, poly: Part, cb: number, sb: number): ContactResult | null {
  const verts = poly.worldVertices();
  const n = verts.length;
  if (n === 0) return null;

  let minOverlap = Infinity;
  let bestAx = 0,
    bestAy = 0;

  function testAxis(ax: number, ay: number): boolean {
    const cp = circle.x * ax + circle.y * ay;
    const r = circle.boundingRadius;
    const cMin = cp - r;
    const cMax = cp + r;

    let pMin = Infinity,
      pMax = -Infinity;
    for (const v of verts) {
      const p = v.x * ax + v.y * ay;
      if (p < pMin) pMin = p;
      if (p > pMax) pMax = p;
    }

    const overlap = Math.min(cMax - pMin, pMax - cMin);
    if (overlap < -sb) return false;

    if (overlap < minOverlap) {
      minOverlap = overlap;
      bestAx = ax;
      bestAy = ay;
    }
    return true;
  }

  // Test all polygon edge normals.
  for (let i = 0; i < n; i++) {
    const v1 = verts[i];
    const v2 = verts[(i + 1) % n];
    const ex = v2.x - v1.x;
    const ey = v2.y - v1.y;
    const len = Math.hypot(ex, ey);
    if (len < 0.001) continue;
    if (!testAxis(ey / len, -ex / len)) return null;
  }

  // Test axis from closest polygon vertex to circle center.
  let closestDist = Infinity;
  let closestV = verts[0];
  for (const v of verts) {
    const d = Math.hypot(circle.x - v.x, circle.y - v.y);
    if (d < closestDist) {
      closestDist = d;
      closestV = v;
    }
  }
  const vx = circle.x - closestV.x;
  const vy = circle.y - closestV.y;
  const vlen = Math.hypot(vx, vy);
  if (vlen > 0.001 && !testAxis(vx / vlen, vy / vlen)) return null;

  if (minOverlap < -sb) return null;

  // Orient normal from circle (a) toward poly (b).
  const circleProj = circle.x * bestAx + circle.y * bestAy;
  const polyProj = poly.x * bestAx + poly.y * bestAy;
  const sign = polyProj >= circleProj ? 1 : -1;

  return {
    nx: bestAx * sign,
    ny: bestAy * sign,
    overlap: minOverlap,
    overlapping: minOverlap >= -cb,
    touching: minOverlap >= -sb,
  };
}

// ─── Polygon–polygon SAT ───────────────────────────────────────────────────

function polyPolyContact(a: Part, b: Part, cb: number, sb: number): ContactResult | null {
  const vertsA = a.worldVertices();
  const vertsB = b.worldVertices();
  if (vertsA.length === 0 || vertsB.length === 0) return null;

  let minOverlap = Infinity;
  let bestAx = 0,
    bestAy = 0;

  function testAxis(ax: number, ay: number): boolean {
    let aMin = Infinity,
      aMax = -Infinity;
    for (const v of vertsA) {
      const p = v.x * ax + v.y * ay;
      if (p < aMin) aMin = p;
      if (p > aMax) aMax = p;
    }

    let bMin = Infinity,
      bMax = -Infinity;
    for (const v of vertsB) {
      const p = v.x * ax + v.y * ay;
      if (p < bMin) bMin = p;
      if (p > bMax) bMax = p;
    }

    const overlap = Math.min(aMax - bMin, bMax - aMin);
    if (overlap < -sb) return false;

    if (overlap < minOverlap) {
      minOverlap = overlap;
      bestAx = ax;
      bestAy = ay;
    }
    return true;
  }

  for (const verts of [vertsA, vertsB]) {
    const n = verts.length;
    for (let i = 0; i < n; i++) {
      const v1 = verts[i];
      const v2 = verts[(i + 1) % n];
      const ex = v2.x - v1.x;
      const ey = v2.y - v1.y;
      const len = Math.hypot(ex, ey);
      if (len < 0.001) continue;
      if (!testAxis(ey / len, -ex / len)) return null;
    }
  }

  if (minOverlap < -sb) return null;

  // Orient normal from a toward b.
  const aProj = a.x * bestAx + a.y * bestAy;
  const bProj = b.x * bestAx + b.y * bestAy;
  const sign = bProj >= aProj ? 1 : -1;

  return {
    nx: bestAx * sign,
    ny: bestAy * sign,
    overlap: minOverlap,
    overlapping: minOverlap >= -cb,
    touching: minOverlap >= -sb,
  };
}

// ─── Height field contact ──────────────────────────────────────────────────
// Returns nx/ny pointing from `planet` (outward from surface) toward `other`.

function heightFieldContact(
  planet: HeightFieldPart,
  other: Part,
  cb: number,
  sb: number,
): ContactResult | null {
  let bestPenetration = -Infinity;
  let bestAngle = 0;

  if (other.smooth) {
    // Circle: test the closest point on the circle toward the planet center.
    const dx = other.x - planet.x;
    const dy = other.y - planet.y;
    const dist = Math.hypot(dx, dy) || 0.001;
    const angle = Math.atan2(dy, dx);
    const surfaceR = planet.surfaceRadiusAt(angle);
    bestPenetration = surfaceR - (dist - other.boundingRadius);
    bestAngle = angle;
  } else {
    // Polygon: find the deepest-penetrating vertex.
    const verts = other.worldVertices();
    for (const v of verts) {
      const dx = v.x - planet.x;
      const dy = v.y - planet.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      const angle = Math.atan2(dy, dx);
      const surfaceR = planet.surfaceRadiusAt(angle);
      const penetration = surfaceR - dist;
      if (penetration > bestPenetration) {
        bestPenetration = penetration;
        bestAngle = angle;
      }
    }
  }

  if (bestPenetration < -sb) return null;

  // Derive contact normal from the terrain gradient at the contact angle.
  const epsilon = 0.005;
  const r0 = planet.surfaceRadiusAt(bestAngle - epsilon);
  const r1 = planet.surfaceRadiusAt(bestAngle + epsilon);
  const p0x = Math.cos(bestAngle - epsilon) * r0;
  const p0y = Math.sin(bestAngle - epsilon) * r0;
  const p1x = Math.cos(bestAngle + epsilon) * r1;
  const p1y = Math.sin(bestAngle + epsilon) * r1;

  const tx = p1x - p0x;
  const ty = p1y - p0y;
  const tlen = Math.hypot(tx, ty) || 0.001;

  // Normal perpendicular to the surface tangent.
  let nx = -ty / tlen;
  let ny = tx / tlen;

  // Ensure it points from planet toward other (outward).
  const dx = other.x - planet.x;
  const dy = other.y - planet.y;
  if (dx * nx + dy * ny < 0) {
    nx = -nx;
    ny = -ny;
  }

  return {
    nx,
    ny,
    overlap: bestPenetration,
    overlapping: bestPenetration >= -cb,
    touching: bestPenetration >= -sb,
  };
}
