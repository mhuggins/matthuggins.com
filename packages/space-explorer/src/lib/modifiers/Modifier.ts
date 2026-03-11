import type { Part } from "../parts/Part";

export abstract class Modifier {
  constructor(public parent: Part) {}
  abstract update(): void;
  onRender(_ctx: CanvasRenderingContext2D): void {}
}
