import type { Part } from "../parts/Part";
import { Modifier } from "./Modifier";

interface WeldModifierConfig {
  child: Part;
  offsetX: number;
  offsetY: number;
}

export class WeldModifier extends Modifier {
  private child: Part;
  private offsetX: number;
  private offsetY: number;

  constructor(parent: Part, cfg: WeldModifierConfig) {
    super(parent);
    this.child = cfg.child;
    this.offsetX = cfg.offsetX;
    this.offsetY = cfg.offsetY;
  }

  update(): void {
    this.parent.x = this.child.x + this.offsetX;
    this.parent.y = this.child.y + this.offsetY;
  }
}
