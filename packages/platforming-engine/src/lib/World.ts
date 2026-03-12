import autoBind from "auto-bind";
import { applyCollisionImpulse } from "../helpers/applyCollisionImpulse";
import { Camera } from "./Camera";
import { Input } from "./Input";
import { Part } from "./Part";

const COLLISION_BUFFER = 0.2; // contact slop: catches floating-point near-misses on exact surface snaps
const SEPARATION_BUFFER = 4; // hysteresis: contact persists until clearly separated

export class World<TInput extends Input = Input, TCamera extends Camera = Camera> {
  public readonly canvas: HTMLCanvasElement;
  private container: HTMLElement;
  protected ctx: CanvasRenderingContext2D;
  protected input: TInput;
  public readonly camera: TCamera;

  protected parts: Part[] = [];

  private rafId = 0;
  private contactPairs = new Set<string>();

  constructor({
    canvas,
    container,
    input,
    camera,
  }: {
    canvas: HTMLCanvasElement;
    container: HTMLElement;
    input: TInput;
    camera: TCamera;
  }) {
    autoBind(this);
    this.canvas = canvas;
    this.container = container;
    this.ctx = canvas.getContext("2d")!;
    this.input = input;
    this.camera = camera;

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
  protected afterPhysics(): void {}

  private resolveCollisions(): void {
    const dynamic = this.parts.filter((p) => p.radius > 0);
    const newContacts = new Set<string>();

    for (let i = 0; i < dynamic.length; i++) {
      for (let j = i + 1; j < dynamic.length; j++) {
        const a = dynamic[i];
        const b = dynamic[j];
        if (a.anchored && b.anchored) {
          continue;
        }

        // Use each part's terrain-aware surface radius rather than the raw bounding
        // sphere. This keeps planet-player collision accurate in valleys where
        // surfaceRadiusAt < planet.radius — the sphere check only fires when the
        // non-anchored part is inside the actual surface, not just the bounding sphere.
        const ra = a.surfaceRadiusToward(b.x, b.y);
        const rb = b.surfaceRadiusToward(a.x, a.y);

        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const key = `${Math.min(a.id, b.id)}-${Math.max(a.id, b.id)}`;
        const wasContact = this.contactPairs.has(key);
        const overlapping = dist <= ra + rb + COLLISION_BUFFER;

        // Contact persists until the parts are clearly separated (hysteresis). This
        // prevents tiny terrain dips from breaking and immediately re-creating a
        // contact, which would fire onCollide on every step over uneven ground.
        if (overlapping || (wasContact && dist <= ra + rb + SEPARATION_BUFFER)) {
          newContacts.add(key);
        }

        if (!overlapping) {
          continue;
        }

        // nx/ny points from a toward b.
        const nx = (b.x - a.x) / (dist || 0.001);
        const ny = (b.y - a.y) / (dist || 0.001);

        // Capture impact speed before velocities change.
        const impactSpeed = Math.abs((a.vx - b.vx) * nx + (a.vy - b.vy) * ny);

        // Separate the pair, only moving non-anchored parts.
        const overlap = ra + rb - dist;
        const shareA = a.anchored ? 0 : b.anchored ? 1 : 0.5;
        const shareB = b.anchored ? 0 : a.anchored ? 1 : 0.5;
        a.x -= nx * overlap * shareA;
        a.y -= ny * overlap * shareA;
        b.x += nx * overlap * shareB;
        b.y += ny * overlap * shareB;

        // Apply impulse once for both.
        applyCollisionImpulse(a, b);

        // Only notify on first contact this pair has made.
        if (!wasContact) {
          a.onCollide(b, -nx, -ny, impactSpeed);
          b.onCollide(a, nx, ny, impactSpeed);
        }
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
