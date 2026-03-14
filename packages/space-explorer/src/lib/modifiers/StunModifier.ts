import { Part as EnginePart } from "@matthuggins/platforming-engine";
import { angleToUpVector } from "../../helpers/angleToUpVector";
import type { Input } from "../Input";
import type { Part } from "../parts/Part";
import { playCrashSound } from "../sounds";
import { Modifier } from "./Modifier";
import { SmokeModifier } from "./SmokeModifier";

// With SPIN_DECAY=0.96, total rotation = initialVelocity / (1 - 0.96) = initialVelocity * 25.
// So initialVelocity = desiredRotations * 2π / 25 ≈ desiredRotations * 0.2513.
const DEFAULT_SPIN_DECAY = 0.96;
const DEFAULT_STUN_FRAMES = 60;
const DEFAULT_MIN_STUN_MOMENTUM = 500;

interface StunModifierConfig {
  spinDecay?: number;
  stunFrames?: number;
  minStunMomentum?: number;
}

export class StunModifier extends Modifier {
  private spinVelocity = 0;
  private spinAngle: number; // Tracked independently of player.update() so left/right input can't bleed into the spin.
  private spinDecay: number;
  private stunFrames: number;
  private minStunMomentum: number;
  private currentStunFrames = 0;

  constructor(parent: Part, cfg: StunModifierConfig = {}) {
    super(parent);
    this.spinAngle = Math.atan2(parent.upX, -parent.upY);
    this.spinDecay = cfg.spinDecay ?? DEFAULT_SPIN_DECAY;
    this.stunFrames = cfg.stunFrames ?? DEFAULT_STUN_FRAMES;
    this.minStunMomentum = cfg.minStunMomentum ?? DEFAULT_MIN_STUN_MOMENTUM;
  }

  override onCollide(other: EnginePart, nx: number, ny: number, impactSpeed: number): void {
    // Planet collisions are handled by Player.update() landing detection — the sphere
    // collision boundary is unreliable for anchored surfaces with valley terrain
    // (surfaceRadiusAt < planet.radius), which causes spurious high-speed contacts on
    // every jump. Only dynamic objects (asteroids, satellites) should stun the player.
    if (other.anchored) {
      return;
    }

    const momentum = other.mass * impactSpeed;
    if (momentum < this.minStunMomentum) {
      return;
    }

    playCrashSound();

    const rotations = Math.min(4, 1 + impactSpeed * 0.15);
    const spinStrength = rotations * 2 * Math.PI * 0.04;

    // Spin direction from tangential velocity (preserved through collision impulse).
    const tx = -this.parent.upY;
    const ty = this.parent.upX;
    const vt = this.parent.vx * tx + this.parent.vy * ty;
    this.spinVelocity = (vt > 0 ? 1 : -1) * spinStrength;
    this.currentStunFrames = this.stunFrames;
    this.spinAngle = Math.atan2(this.parent.upX, -this.parent.upY);

    this.parent.modifiers.push(new SmokeModifier(this.parent, { nx, ny }));
  }

  update(_input: Input): void {
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
