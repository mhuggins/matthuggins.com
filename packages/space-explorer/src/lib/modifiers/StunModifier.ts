import type { Part } from "../parts/Part";
import { angleToUpVector } from "../utils";
import { FlashModifier } from "./FlashModifier";
import { Modifier } from "./Modifier";

// With SPIN_DECAY=0.96, total rotation = initialVelocity / (1 - 0.96) = initialVelocity * 25.
// So initialVelocity = desiredRotations * 2π / 25 ≈ desiredRotations * 0.2513.
const DEFAULT_SPIN_DECAY = 0.96;
const DEFAULT_STUN_FRAMES = 60;

interface StunModifierConfig {
  spinDecay?: number;
  stunFrames?: number;
}

export class StunModifier extends Modifier {
  private spinVelocity = 0;
  private spinAngle: number; // Tracked independently of player.update() so left/right input can't bleed into the spin.
  private spinDecay: number;
  private stunFrames: number;
  private currentStunFrames = 0;

  constructor(parent: Part, cfg: StunModifierConfig = {}) {
    super(parent);
    this.spinAngle = Math.atan2(parent.upX, -parent.upY);
    this.spinDecay = cfg.spinDecay ?? DEFAULT_SPIN_DECAY;
    this.stunFrames = cfg.stunFrames ?? DEFAULT_STUN_FRAMES;
  }

  override onCollide(_other: Part, nx: number, ny: number, impactSpeed: number): void {
    const rotations = Math.min(4, 1 + impactSpeed * 0.15);
    const spinStrength = rotations * 2 * Math.PI * 0.04;

    // Player right = (-upY, upX). Positive dot → hit came from player's right.
    const rightDot = nx * -this.parent.upY + ny * this.parent.upX;
    this.spinVelocity = (rightDot > 0 ? 1 : -1) * spinStrength;
    this.currentStunFrames = this.stunFrames;
    this.spinAngle = Math.atan2(this.parent.upX, -this.parent.upY);

    this.parent.modifiers.push(new FlashModifier(this.parent, -8, -12, 16, 24, 6));
  }

  update(): void {
    if (this.spinVelocity === 0 && this.currentStunFrames === 0) {
      return;
    }

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

    if (this.currentStunFrames > 0) {
      this.currentStunFrames -= 1;
    }

    if (Math.abs(this.spinVelocity) < 0.001) {
      this.spinVelocity = 0;
    }
  }
}
