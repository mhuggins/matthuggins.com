import autoBind from "auto-bind";
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
  radius = 0;
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
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.renderModifiers(ctx);
  }

  onSpawn(): void {}

  onDestroy(): void {}

  /**
   * The effective collision radius toward a given world point. Overridden by
   * Planet to return the terrain-accurate surface radius at that angle, so the
   * sphere collision check uses the real surface rather than the bounding sphere.
   */
  surfaceRadiusToward(_x: number, _y: number): number {
    return this.radius;
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
