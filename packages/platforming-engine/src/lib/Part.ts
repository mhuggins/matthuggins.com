import autoBind from "auto-bind";
import type { Point } from "../types";
import { Input } from "./Input";
import type { Modifier } from "./Modifier";
import type { World } from "./World";

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

  polygon: Point[] = [];
  smooth = false;
  rotation = 0;
  canCollide = true;
  restitution = 1;
  obeysGravity = true;

  constructor(world: World) {
    autoBind(this);
    this.world = world;
  }

  /** Returns polygon vertices transformed to world space. */
  worldVertices(): Point[] {
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);
    return this.polygon.map((v) => ({
      x: this.x + v.x * cos - v.y * sin,
      y: this.y + v.x * sin + v.y * cos,
    }));
  }

  update(input: Input): void {
    this.updateModifiers(input);
    if (this.inputsEnabled) {
      this.applyInputs(input);
    }
    this.doUpdate();
  }

  get boundingRadius(): number {
    if (this.polygon.length === 0) return 0;
    return Math.max(...this.polygon.map((v) => Math.hypot(v.x, v.y)));
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.isOffScreen(ctx)) return;
    this.doRender(ctx);
    this.renderModifiers(ctx);
  }

  protected isOffScreen(ctx: CanvasRenderingContext2D): boolean {
    const r = this.boundingRadius;
    if (r === 0) return false;
    const t = ctx.getTransform();
    const sx = t.a * this.x + t.c * this.y + t.e;
    const sy = t.b * this.x + t.d * this.y + t.f;
    const scale = Math.hypot(t.a, t.b);
    const screenR = r * scale;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    return sx + screenR < 0 || sx - screenR > w || sy + screenR < 0 || sy - screenR > h;
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

  protected abstract doUpdate(): void;
  protected abstract doRender(ctx: CanvasRenderingContext2D): void;

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
