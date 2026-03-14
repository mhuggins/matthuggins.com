import autoBind from "auto-bind";
import { Input } from "./Input";
import type { Modifier } from "./Modifier";
import type { World } from "./World";

export abstract class Part {
  private static nextId = 0;

  readonly id = Part.nextId++;
  readonly shape: "circle" | "rect" | null = null;

  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  mass = 0;
  gravity: number = 0;
  gravityScale: number = 1.0;
  anchored = false;
  inputsEnabled = true;
  modifiers: Modifier[] = [];
  world!: World;

  constructor(world?: World) {
    autoBind(this);
    if (world !== undefined) {
      this.world = world;
    }
  }

  update(input: Input): void {
    this.updateModifiers(input);
    if (this.inputsEnabled) {
      this.applyInputs(input);
    }
    this.doUpdate();
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.doRender(ctx);
    this.renderModifiers(ctx);
  }

  onSpawn(): void {}

  onDestroy(): void {}

  /**
   * Returns true to skip collision resolution for this contact.
   * `nx`/`ny` is the contact normal pointing from this part toward the
   * colliding circle. Override in one-way surfaces (e.g. platforms).
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
