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

  override shouldCollide(other: Part): boolean {
    return other !== this.child;
  }

  update(_input: Input): void {
    const cos = Math.cos(this.child.rotation);
    const sin = Math.sin(this.child.rotation);
    this.parent.x = this.child.x + this.offsetX * cos - this.offsetY * sin;
    this.parent.y = this.child.y + this.offsetX * sin + this.offsetY * cos;
    this.parent.rotation = this.child.rotation;
  }
}
