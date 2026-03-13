import autoBind from "auto-bind";
import { applyCollisionImpulse } from "../helpers/applyCollisionImpulse";
import { Camera } from "./Camera";
import { CircularPart } from "./CircularPart";
import { Input } from "./Input";
import { Part } from "./Part";
import { Player } from "./Player";
import { RectangularPart } from "./RectangularPart";

const DEFAULT_COLLISION_BUFFER = 0.2; // contact slop: catches floating-point near-misses on exact surface snaps
const DEFAULT_SEPARATION_BUFFER = 4; // hysteresis: contact persists until clearly separated

type ContactEntry = { a: Part; b: Part; nx: number; ny: number };
// nx/ny point from a toward b

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
      if (target.anchored || target.mass === 0) {
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

        const upDot = nx * part.upX + ny * part.upY;
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
    const dynamic = this.parts.filter((p) => p.shape !== null);
    const newContacts: Map<string, ContactEntry> = new Map();

    for (let i = 0; i < dynamic.length; i++) {
      for (let j = i + 1; j < dynamic.length; j++) {
        const a = dynamic[i];
        const b = dynamic[j];
        if (a.anchored && b.anchored) {
          continue;
        }

        const aIsRect = a.shape === "rect";
        const bIsRect = b.shape === "rect";

        let overlapping: boolean;
        let touching: boolean;
        let nx: number; // from a toward b
        let ny: number;
        let overlap: number;

        const key = `${Math.min(a.id, b.id)}-${Math.max(a.id, b.id)}`;
        const wasContact = this.contactPairs.has(key);

        if (aIsRect || bIsRect) {
          // One must be a circle for rect-circle collision; skip rect-rect.
          if (aIsRect && bIsRect) {
            continue;
          }

          const rect = (aIsRect ? a : b) as unknown as RectangularPart;
          const circle = (aIsRect ? b : a) as unknown as CircularPart;

          const contact = computeRectCircleContact(
            rect,
            circle,
            this.collisionBuffer,
            this.separationBuffer,
          );
          if (contact === null) {
            continue;
          }

          // Skip contact when the rect surface is permeable in this direction.
          // contact.nx/ny points from rect toward circle.
          if (rect.isPermeable(contact.nx, contact.ny)) {
            continue;
          }

          overlapping = contact.overlapping;
          touching = contact.touching;
          overlap = contact.overlap;

          // contact.nx/ny points from rect toward circle.
          // nx/ny in this loop must point from a toward b.
          if (aIsRect) {
            nx = contact.nx;
            ny = contact.ny;
          } else {
            nx = -contact.nx;
            ny = -contact.ny;
          }
        } else {
          // Circle-circle: use terrain-aware surface radius.
          const ca = a as unknown as CircularPart;
          const cb = b as unknown as CircularPart;
          const ra = ca.surfaceRadiusToward(b.x, b.y);
          const rb = cb.surfaceRadiusToward(a.x, a.y);
          const dist = Math.hypot(a.x - b.x, a.y - b.y);

          nx = (b.x - a.x) / (dist || 0.001);
          ny = (b.y - a.y) / (dist || 0.001);
          overlapping = dist <= ra + rb + this.collisionBuffer;
          touching = dist <= ra + rb + this.separationBuffer;
          overlap = ra + rb - dist;
        }

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

    ctx.save();
    for (const part of this.parts) {
      part.render(ctx);
    }
    ctx.restore();
  }
}

/**
 * Computes contact data between a RectangularPart and a CircularPart using the
 * closest-point algorithm. Returns null if no contact.
 * The returned normal (nx, ny) points from rect toward circle.
 */
function computeRectCircleContact(
  rect: RectangularPart,
  circle: CircularPart,
  collisionBuffer: number,
  separationBuffer: number,
): { touching: boolean; overlapping: boolean; nx: number; ny: number; overlap: number } | null {
  // Transform circle center into rect's local frame (rotate by -tiltAngle).
  const cx = circle.x - rect.x;
  const cy = circle.y - rect.y;
  const cosA = Math.cos(-rect.tiltAngle);
  const sinA = Math.sin(-rect.tiltAngle);
  const localX = cx * cosA - cy * sinA;
  const localY = cx * sinA + cy * cosA;

  // Closest point on rect boundary to circle center.
  const hw = rect.width / 2;
  const hh = rect.height / 2;
  const closestX = Math.max(-hw, Math.min(hw, localX));
  const closestY = Math.max(-hh, Math.min(hh, localY));

  // Distance vector from closest point to circle center (in local frame).
  const dvx = localX - closestX;
  const dvy = localY - closestY;
  const distLen = Math.hypot(dvx, dvy);

  const overlapping = distLen <= circle.radius + collisionBuffer;
  const touching = distLen <= circle.radius + separationBuffer;

  if (!touching) {
    return null;
  }

  let nx: number;
  let ny: number;

  if (distLen < 0.001) {
    // Circle center is at or inside the rect — use faceNormal as fallback,
    // oriented toward the side the circle is on so isPermeable works correctly.
    if (rect.faceNormal) {
      const dx = circle.x - rect.x;
      const dy = circle.y - rect.y;
      const side = dx * rect.faceNormal.x + dy * rect.faceNormal.y;
      nx = side >= 0 ? rect.faceNormal.x : -rect.faceNormal.x;
      ny = side >= 0 ? rect.faceNormal.y : -rect.faceNormal.y;
    } else {
      nx = 0;
      ny = 1;
    }
  } else {
    // Rotate local normal back to world frame by +tiltAngle.
    const localNx = dvx / distLen;
    const localNy = dvy / distLen;
    const cosB = Math.cos(rect.tiltAngle);
    const sinB = Math.sin(rect.tiltAngle);
    nx = localNx * cosB - localNy * sinB;
    ny = localNx * sinB + localNy * cosB;
  }

  return { touching, overlapping, nx, ny, overlap: circle.radius - distLen };
}
