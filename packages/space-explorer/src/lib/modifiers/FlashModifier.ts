import type { Part } from "../parts/Part";
import { roundRect } from "../utils";
import { Modifier } from "./Modifier";

export class FlashModifier extends Modifier {
  private framesLeft: number;
  private readonly totalFrames: number;

  constructor(
    parent: Part,
    private x: number,
    private y: number,
    private w: number,
    private h: number,
    private r: number,
    frames = 12,
  ) {
    super(parent);
    this.framesLeft = frames;
    this.totalFrames = frames;
  }

  override get isAlive(): boolean {
    return this.framesLeft > 0;
  }

  update(): void {
    if (this.framesLeft > 0) this.framesLeft--;
  }

  override onRender(ctx: CanvasRenderingContext2D): void {
    if (this.framesLeft <= 0) return;
    const alpha = this.framesLeft / this.totalFrames;
    ctx.save();
    ctx.globalAlpha = alpha * 0.72;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, this.x, this.y, this.w, this.h, this.r);
    ctx.fill();
    ctx.restore();
  }
}
