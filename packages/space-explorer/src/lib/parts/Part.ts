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
  anchored = false;
  abstract readonly layer: RenderLayer;
  zIndex = 0;
  modifiers: Modifier[] = [];
  world: World;

  constructor(world: World) {
    this.world = world;
  }

  abstract update(): void;
  abstract render(ctx: CanvasRenderingContext2D): void;

  onSpawn(): void {}
  onDestroy(): void {}
  onCollide(_other: Part, _nx: number, _ny: number): void {}

  updateModifiers(): void {
    for (const m of this.modifiers) m.update();
  }
}
