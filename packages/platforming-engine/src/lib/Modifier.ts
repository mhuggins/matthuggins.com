import autoBind from "auto-bind";
import { Input } from "./Input";
import type { Part } from "./Part";

export abstract class Modifier {
  constructor(public parent: Part) {
    autoBind(this);
  }

  abstract update(input: Input): void;

  get isAlive(): boolean {
    return true;
  }

  onCollide(_other: Part, _nx: number, _ny: number, _impactSpeed: number): void {}

  onSeparate(_other: Part): void {}

  onRender(_ctx: CanvasRenderingContext2D): void {}
}
