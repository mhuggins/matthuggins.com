import type { Input } from "./Input";
import { Modifier } from "./Modifier";
import type { Part } from "./Part";

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

  update(_input: Input): void {
    this.parent.x = this.child.x + this.offsetX;
    this.parent.y = this.child.y + this.offsetY;
  }
}
