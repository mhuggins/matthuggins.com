import autoBind from "auto-bind";
import { CachedValue } from "../helpers/CachedValue";
import type { Point, RenderingContext2D } from "../types";
import { Input } from "./Input";
import type { Modifier } from "./Modifier";
import type { World } from "./World";

/**
 * Returned by `getGrounding()` — provides snap position and walk tangent
 * for grounded player movement.
 */
export interface GroundingResult {
  /** Snap position for the player center. */
  x: number;
  y: number;
  /** Walk tangent direction (unit vector along the walkable edge). */
  tx: number;
  ty: number;
}

export abstract class Part {
  private static nextId = 0;

  readonly id = Part.nextId++;

  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  mass = 0;
  gravity: number = 0;
  gravityScale: number = 1.0;
  zIndex = 0;
  anchored = false;
  inputsEnabled = true;
  modifiers: Modifier[] = [];
  world: World;

  private _polygon: Point[] = [];
  private _boundingRadius = 0;
  private _worldVertsCache = new CachedValue<Point[]>();

  smooth = false;
  rotation = 0;
  canCollide = true;
  restitution = 1;
  obeysGravity = true;

  get polygon(): Point[] {
    return this._polygon;
  }
  set polygon(value: Point[]) {
    this._polygon = value;
    this._boundingRadius =
      value.length === 0 ? 0 : Math.max(...value.map((v) => Math.hypot(v.x, v.y)));
  }

  constructor(world: World) {
    autoBind(this);
    this.world = world;
  }

  /** Returns polygon vertices transformed to world space. */
  worldVertices(): Point[] {
    return this._worldVertsCache.get(() => {
      const cos = Math.cos(this.rotation);
      const sin = Math.sin(this.rotation);
      return this.polygon.map((v) => ({
        x: this.x + v.x * cos - v.y * sin,
        y: this.y + v.x * sin + v.y * cos,
      }));
    }, [this.x, this.y, this.rotation, this.polygon]);
  }

  update(input: Input): void {
    this.updateModifiers(input);
    if (this.inputsEnabled) {
      this.applyInputs(input);
    }
    this.doUpdate();
  }

  get boundingRadius(): number {
    return this._boundingRadius;
  }

  /** Pre-rendered offscreen canvas for static parts. */
  protected renderCache: OffscreenCanvas | null = null;
  protected renderCacheOffsetX = 0;
  protected renderCacheOffsetY = 0;

  render(ctx: CanvasRenderingContext2D): void {
    if (this.isOffScreen(ctx)) {
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    if (this.renderCache) {
      ctx.drawImage(this.renderCache, this.renderCacheOffsetX, this.renderCacheOffsetY);
    } else {
      this.doRender(ctx);
    }

    ctx.restore();
    this.renderModifiers(ctx);
  }

  /**
   * Build an offscreen render cache for static geometry.
   * Creates an offscreen canvas at the given size, translates by the origin
   * offset, and calls `doRender` to draw the content once. Subsequent
   * `render()` calls blit the cached image instead of calling `doRender`.
   */
  protected buildRenderCache(
    width: number,
    height: number,
    originX: number,
    originY: number,
  ): void {
    const oc = new OffscreenCanvas(width, height);
    const ctx = oc.getContext("2d")!;
    ctx.translate(-originX, -originY);
    this.doRender(ctx);
    this.renderCache = oc;
    this.renderCacheOffsetX = originX;
    this.renderCacheOffsetY = originY;
  }

  protected isOffScreen(ctx: CanvasRenderingContext2D): boolean {
    const r = this.boundingRadius;
    if (r === 0) {
      return false;
    }

    const t = ctx.getTransform();
    const sx = t.a * this.x + t.c * this.y + t.e;
    const sy = t.b * this.x + t.d * this.y + t.f;
    const scale = Math.hypot(t.a, t.b);
    const screenR = r * scale;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    return sx + screenR < 0 || sx - screenR > w || sy + screenR < 0 || sy - screenR > h;
  }

  /** Ticks to delay re-grounding after leaving this part's surface. */
  landingCooldown: number = 0;

  /**
   * Returns grounding info for a player at (px, py) with the given half-dimensions.
   * Returns null if the player is off-edge (should transition to air) or if this
   * part has no walkable surface.
   *
   * The default implementation works for any anchored convex polygon: it finds the
   * edge whose outward normal aligns with the given up direction within the
   * gradability threshold, then projects the player onto that edge.
   *
   * Override for non-polygon parts (e.g. height-field planets).
   */
  getGrounding(
    px: number,
    py: number,
    halfWidth: number,
    halfHeight: number,
    upX: number,
    upY: number,
    gradability: number,
  ): GroundingResult | null {
    if (!this.anchored) {
      return null;
    }

    const verts = this.worldVertices();
    const n = verts.length;
    if (n < 3) {
      return null;
    }

    const cosGrad = Math.cos(gradability);

    // Centroid — used to orient outward normals for convex polygons.
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < n; i++) {
      cx += verts[i].x;
      cy += verts[i].y;
    }
    cx /= n;
    cy /= n;

    let best: GroundingResult | null = null;
    let bestDist = Infinity;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const ax = verts[i].x;
      const ay = verts[i].y;
      const bx = verts[j].x;
      const by = verts[j].y;

      const edx = bx - ax;
      const edy = by - ay;
      const len = Math.hypot(edx, edy);
      if (len < 1e-6) {
        continue;
      }

      // Edge tangent (a → b) and candidate outward normal.
      const tx = edx / len;
      const ty = edy / len;
      let nx = -ty;
      let ny = tx;

      // Ensure normal points away from centroid (outward for convex polygon).
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      if (nx * (cx - mx) + ny * (cy - my) > 0) {
        nx = -nx;
        ny = -ny;
      }

      // Only consider edges walkable within the gradability threshold.
      if (nx * upX + ny * upY < cosGrad) {
        continue;
      }

      // Signed distance from player to edge line (positive = normal side).
      const dist = (px - ax) * nx + (py - ay) * ny;
      if (dist >= bestDist) {
        continue;
      }

      // Project player onto edge direction.
      const t = (px - ax) * tx + (py - ay) * ty;
      if (t < -halfWidth || t > len + halfWidth) {
        continue;
      }

      bestDist = dist;
      best = {
        x: ax + tx * t + nx * halfHeight,
        y: ay + ty * t + ny * halfHeight,
        tx,
        ty,
      };
    }

    return best;
  }

  shouldCollideWith(other: Part): boolean {
    return this.modifiers.every((m) => m.shouldCollide(other));
  }

  onSpawn(): void {}

  onDestroy(): void {}

  /**
   * Returns true to skip collision resolution for this contact.
   * `nx`/`ny` is the contact normal pointing from this part toward the
   * other part. Override in one-way surfaces (e.g. platforms).
   */
  isPermeable(_nx: number, _ny: number, _cx?: number, _cy?: number): boolean {
    return false;
  }

  /**
   * Called by World.resolveCollisions() after the physics impulse has already
   * been applied. `nx`/`ny` is the push direction for `this` (pointing away
   * from `other`). Override to add part-specific collision side-effects.
   */
  onCollide(other: Part, nx: number, ny: number, impactSpeed: number): void {
    for (const m of this.modifiers) {
      m.onCollide(other, nx, ny, impactSpeed);
    }
  }

  onSeparate(other: Part): void {
    for (const m of this.modifiers) {
      m.onSeparate(other);
    }
  }

  protected doUpdate(): void {}

  protected abstract doRender(ctx: RenderingContext2D): void;

  protected applyInputs(_input: Input): void {}

  protected updateModifiers(input: Input): void {
    for (const m of this.modifiers) {
      m.update(input);
    }
    this.modifiers = this.modifiers.filter((m) => m.isAlive);
  }

  protected renderModifiers(ctx: CanvasRenderingContext2D): void {
    for (const m of this.modifiers) {
      m.onRender(ctx);
    }
  }
}
