import type { Part } from "../parts/Part";

export abstract class Modifier {
  constructor(public parent: Part) {}
  abstract update(): void;
  get isAlive(): boolean { return true; }
  onCollide(_other: Part, _nx: number, _ny: number, _impactSpeed: number): void {}
  onRender(_ctx: CanvasRenderingContext2D): void {}
}
