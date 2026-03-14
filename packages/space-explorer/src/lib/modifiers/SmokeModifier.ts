import type { Input } from "../Input";
import type { Part } from "../parts/Part";
import { Modifier } from "./Modifier";

const DEFAULT_FRAMES = 24;
const DEFAULT_PARTICLE_COUNT = 6;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  startRadius: number;
  endRadius: number;
}

interface SmokeModifierConfig {
  nx: number;
  ny: number;
  frames?: number;
  particles?: number;
}

export class SmokeModifier extends Modifier {
  private framesLeft: number;
  private readonly totalFrames: number;
  private readonly particles: Particle[];

  // nx/ny: push direction for the parent (away from the other object), world space.
  constructor(parent: Part, cfg: SmokeModifierConfig) {
    super(parent);
    this.framesLeft = cfg.frames ?? DEFAULT_FRAMES;
    this.totalFrames = cfg.frames ?? DEFAULT_FRAMES;

    // Convert impact direction from world space to screen space.
    // Player.render() draws in unrotated screen space, so we rotate world vectors
    // by -camera.angle to align them with how the player appears on screen.
    const camAngle = parent.world.camera.angle;
    const cc = Math.cos(-camAngle);
    const cs = Math.sin(-camAngle);
    const iwx = -cfg.nx; // impact came from opposite of push direction
    const iwy = -cfg.ny;
    const isx = iwx * cc - iwy * cs;
    const isy = iwx * cs + iwy * cc;

    // Spawn particles at the contact point on the player's edge.
    const r = Math.max(...parent.polygon.map((v) => Math.hypot(v.x, v.y)));
    const cx = isx * r;
    const cy = isy * r;
    const baseAngle = Math.atan2(isy, isx);

    this.particles = Array.from({ length: cfg.particles ?? DEFAULT_PARTICLE_COUNT }, () => {
      const spread = (Math.random() - 0.5) * Math.PI * 0.9;
      const angle = baseAngle + spread;
      const speed = 0.6 + Math.random() * 1.4;
      return {
        x: cx + (Math.random() - 0.5) * 5,
        y: cy + (Math.random() - 0.5) * 5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        startRadius: 1.5 + Math.random() * 1.5,
        endRadius: 5 + Math.random() * 5,
      };
    });
  }

  override get isAlive(): boolean {
    return this.framesLeft > 0;
  }

  update(_input: Input): void {
    if (this.framesLeft <= 0) {
      return;
    }

    this.framesLeft--;

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.87;
      p.vy *= 0.87;
    }
  }

  override onRender(ctx: CanvasRenderingContext2D): void {
    if (this.framesLeft <= 0) {
      return;
    }

    const t = this.framesLeft / this.totalFrames; // 1 → 0
    const age = 1 - t;

    ctx.save();
    for (const p of this.particles) {
      const r = p.startRadius + (p.endRadius - p.startRadius) * age;
      ctx.globalAlpha = t * 0.65;
      ctx.fillStyle = "#c8c8cc";
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
