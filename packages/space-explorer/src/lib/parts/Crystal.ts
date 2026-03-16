import { Part as EnginePart, type RenderingContext2D } from "@matthuggins/platforming-engine";
import type { World } from "../World";
import { Part, RenderLayer } from "./Part";

const CRYSTAL_FUEL_AMOUNT = 0.08;
const CRYSTAL_LIFETIME = 600; // frames (~10 seconds at 60fps)
const CRYSTAL_PICKUP_RADIUS = 28;
const CRYSTAL_DESPAWN_RADIUS = 9000;
const CRYSTAL_BOUNCE_DAMPING = 0.3;

export class Crystal extends Part {
  readonly layer = RenderLayer.WORLD;
  readonly fuelAmount: number;

  private age = 0;
  private shimmerPhase = Math.random() * Math.PI * 2;
  private settled = false;
  private touchedSurface = false;

  constructor(world: World, fuelAmount = CRYSTAL_FUEL_AMOUNT) {
    super(world);
    this.fuelAmount = fuelAmount;
    this.mass = 5;
    this.gravityScale = 0.3;
    this.obeysGravity = true;
    this.restitution = CRYSTAL_BOUNCE_DAMPING;

    // Small diamond collision shape.
    const s = 4;
    this.polygon = [
      { x: 0, y: -s },
      { x: s * 0.6, y: 0 },
      { x: 0, y: s * 0.8 },
      { x: -s * 0.6, y: 0 },
    ];
  }

  override shouldCollideWith(other: EnginePart): boolean {
    // Only collide with anchored parts (planets, platforms). Skip crystals, player, asteroids, etc.
    if (!other.anchored) {
      return false;
    }
    return super.shouldCollideWith(other);
  }

  override onCollide = (): void => {
    this.touchedSurface = true;
  };

  /** Check if the player is close enough to collect this crystal. */
  isNearPlayer(): boolean {
    const dx = this.x - this.world.player.x;
    const dy = this.y - this.world.player.y;
    return dx * dx + dy * dy < CRYSTAL_PICKUP_RADIUS * CRYSTAL_PICKUP_RADIUS;
  }

  protected override doUpdate(): void {
    if (!this.settled) {
      // Apply friction damping every frame once the crystal has hit a surface.
      if (this.touchedSurface) {
        this.vx *= 0.85;
        this.vy *= 0.85;

        const speed = Math.hypot(this.vx, this.vy);
        if (speed < 0.15) {
          this.vx = 0;
          this.vy = 0;
          this.obeysGravity = false;
          this.settled = true;
        }
      }

      this.x += this.vx;
      this.y += this.vy;
    }
    this.age++;

    // Fade-out blink in the last 120 frames.
    if (this.age >= CRYSTAL_LIFETIME) {
      this.world.remove(this);
      return;
    }

    // Despawn if too far from the player.
    const dx = this.x - this.world.player.x;
    const dy = this.y - this.world.player.y;
    if (dx * dx + dy * dy > CRYSTAL_DESPAWN_RADIUS * CRYSTAL_DESPAWN_RADIUS) {
      this.world.remove(this);
    }
  }

  protected doRender(ctx: RenderingContext2D): void {
    const remaining = CRYSTAL_LIFETIME - this.age;
    const blinkAlpha = remaining < 120 ? Math.sin(this.age * 0.3) * 0.5 + 0.5 : 1;

    ctx.globalAlpha *= blinkAlpha;

    const size = 6;
    const shimmer = Math.sin(this.shimmerPhase + this.age * 0.08) * 0.15 + 0.85;

    // Diamond shape.
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.6, 0);
    ctx.lineTo(0, size * 0.8);
    ctx.lineTo(-size * 0.6, 0);
    ctx.closePath();

    // Fill with a bright pink.
    ctx.fillStyle = `rgba(255, 80, 180, ${0.9 * shimmer})`;
    ctx.fill();

    // Bright highlight facet.
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.6, 0);
    ctx.lineTo(0, -size * 0.15);
    ctx.closePath();
    ctx.fillStyle = `rgba(255, 200, 230, ${0.6 * shimmer})`;
    ctx.fill();

    // Outline.
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.6, 0);
    ctx.lineTo(0, size * 0.8);
    ctx.lineTo(-size * 0.6, 0);
    ctx.closePath();
    ctx.strokeStyle = `rgba(255, 120, 200, ${0.7 * shimmer})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Small glow.
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2);
    glow.addColorStop(0, `rgba(255, 80, 180, ${0.25 * shimmer})`);
    glow.addColorStop(1, "rgba(255, 80, 180, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, size * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
