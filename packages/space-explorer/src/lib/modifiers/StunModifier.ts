import type { Player } from "../parts/Player";
import { angleToUpVector } from "../utils";
import { Modifier } from "./Modifier";

// With SPIN_DECAY=0.96, total rotation = initialVelocity / (1 - 0.96) = initialVelocity * 25.
// So initialVelocity = desiredRotations * 2π / 25 ≈ desiredRotations * 0.2513.
const SPIN_DECAY = 0.96;
const STUN_FRAMES = 60;
const FLASH_FADE_FRAMES = 12;

export class StunModifier extends Modifier {
  private spinVelocity: number;
  private stunFrames: number;
  // Tracked independently of player.update() so left/right input can't bleed into the spin.
  private targetFreeAngle: number;

  constructor(parent: Player, nx: number, ny: number, spinStrength: number) {
    super(parent);

    // Player right = (-upY, upX). Positive dot → hit came from player's right.
    const rightDot = nx * -parent.upY + ny * parent.upX;
    this.spinVelocity = (rightDot > 0 ? 1 : -1) * spinStrength;
    this.stunFrames = STUN_FRAMES;
    this.targetFreeAngle = parent.freeAngle;
  }

  get flashIntensity(): number {
    return Math.max(0, Math.min(1, this.stunFrames / FLASH_FADE_FRAMES));
  }

  update(): void {
    const player = this.parent as Player;

    // Force free-rotation mode so player.update() doesn't snap freeAngle back
    // to the planet-relative direction before we override it below.
    player.hasUsedJetpackThisAirborne = true;

    // Advance and decay the spin.
    const spin = this.spinVelocity;
    this.spinVelocity *= SPIN_DECAY;
    this.targetFreeAngle += spin;

    // SET freeAngle from the modifier's own accumulator, discarding any
    // left/right steering input that player.update() may have applied.
    player.freeAngle = this.targetFreeAngle;

    // Also drive the camera directly so the screen rotates this frame rather
    // than waiting for the camera's slow easing to catch up.
    player.world.camera.angle += spin;

    // Sync upX/upY to match the new freeAngle.
    const up = angleToUpVector(player.freeAngle);
    player.upX = up.x;
    player.upY = up.y;

    if (this.stunFrames > 0) {
      player.jetpackArmed = false;
      this.stunFrames--;
    }

    if (Math.abs(this.spinVelocity) < 0.001 && this.stunFrames <= 0) {
      const idx = player.modifiers.indexOf(this);
      if (idx !== -1) player.modifiers.splice(idx, 1);
    }
  }
}
