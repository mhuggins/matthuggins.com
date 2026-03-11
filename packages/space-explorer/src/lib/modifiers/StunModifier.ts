import type { Part } from "../parts/Part";
import { angleToUpVector, roundRect } from "../utils";
import { Modifier } from "./Modifier";

// With SPIN_DECAY=0.96, total rotation = initialVelocity / (1 - 0.96) = initialVelocity * 25.
// So initialVelocity = desiredRotations * 2π / 25 ≈ desiredRotations * 0.2513.
const SPIN_DECAY = 0.96;
const STUN_FRAMES = 60;
const FLASH_FADE_FRAMES = 12;

interface StunModifierConfig {
  nx: number;
  ny: number;
  spinStrength: number;
  spinDecay?: number;
  stunFrames?: number;
  flashFadeFrames?: number;
}

export class StunModifier extends Modifier {
  private spinVelocity: number;
  private spinAngle: number; // Tracked independently of player.update() so left/right input can't bleed into the spin.
  private spinDecay: number;
  private stunFrames: number;
  private flashFadeFrames: number;

  constructor(parent: Part, cfg: StunModifierConfig) {
    super(parent);

    // Player right = (-upY, upX). Positive dot → hit came from player's right.
    const rightDot = cfg.nx * -parent.upY + cfg.ny * parent.upX;
    this.spinVelocity = (rightDot > 0 ? 1 : -1) * cfg.spinStrength;
    this.spinDecay = cfg.spinDecay ?? SPIN_DECAY;
    this.stunFrames = cfg.stunFrames ?? STUN_FRAMES;
    this.flashFadeFrames = cfg.flashFadeFrames ?? FLASH_FADE_FRAMES;
    this.spinAngle = Math.atan2(parent.upX, -parent.upY);
  }

  get flashIntensity(): number {
    return Math.max(0, Math.min(1, this.stunFrames / this.flashFadeFrames));
  }

  update(): void {
    this.parent.inputsEnabled = false;

    // Advance and decay the spin.
    const spin = this.spinVelocity;
    this.spinVelocity *= this.spinDecay;
    this.spinAngle += spin;

    // Drive the camera directly so the screen rotates this frame rather
    // than waiting for the camera's slow easing to catch up.
    this.parent.world.camera.angle += spin;

    // Sync upX/upY to match the new spinAngle.
    const up = angleToUpVector(this.spinAngle);
    this.parent.upX = up.x;
    this.parent.upY = up.y;

    if (this.stunFrames > 0) {
      this.stunFrames--;
    }

    if (Math.abs(this.spinVelocity) < 0.001 && this.stunFrames <= 0) {
      const idx = this.parent.modifiers.indexOf(this);
      if (idx !== -1) this.parent.modifiers.splice(idx, 1);
    }
  }

  override onRender(ctx: CanvasRenderingContext2D): void {
    const flash = this.flashIntensity;
    if (flash <= 0) return;
    ctx.save();
    ctx.globalAlpha = flash * 0.72;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, -8, -12, 16, 24, 6);
    ctx.fill();
    ctx.restore();
  }
}
