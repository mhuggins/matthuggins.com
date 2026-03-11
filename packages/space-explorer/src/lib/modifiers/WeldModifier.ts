import type { Part } from "../parts/Part";
import { Modifier } from "./Modifier";

export class WeldModifier extends Modifier {
  constructor(
    parent: Part,
    private child: Part,
    private offsetX: number,
    private offsetY: number,
  ) {
    super(parent);
  }

  update(): void {
    this.parent.x = this.child.x + this.offsetX;
    this.parent.y = this.child.y + this.offsetY;
  }
}
