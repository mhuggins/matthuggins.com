import type { Modifier } from "../modifiers/Modifier";
import type { World } from "../World";

export enum RenderLayer {
  WORLD = 0,
  PLAYER = 1,
  HUD = 2,
}

export abstract class Part {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  mass = 0;
  radius = 0;
  anchored = false;
  abstract readonly layer: RenderLayer;
  zIndex = 0;
  modifiers: Modifier[] = [];
  world: World;
  upX = 0;
  upY = -1;
  inputsEnabled = true;

  constructor(world: World) {
    this.world = world;
  }

  abstract update(): void;
  abstract render(ctx: CanvasRenderingContext2D): void;

  onSpawn(): void {}

  onDestroy(): void {}

  /**
   * Called by World.resolveCollisions() after the physics impulse has already
   * been applied. `nx`/`ny` is the push direction for `this` (pointing away
   * from `other`). Override to add part-specific collision side-effects.
   */
  onCollide(_other: Part, _nx: number, _ny: number, _impactSpeed: number): void {}

  applyInputs(): void {}

  updateModifiers(): void {
    for (const m of this.modifiers) {
      m.update();
    }
  }

  renderModifiers(ctx: CanvasRenderingContext2D): void {
    for (const m of this.modifiers) {
      m.onRender(ctx);
    }
  }
}
