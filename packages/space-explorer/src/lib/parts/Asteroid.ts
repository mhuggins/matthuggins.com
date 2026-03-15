import { Part as EnginePart } from "@matthuggins/platforming-engine";
import { playAsteroidCrashSound } from "../sounds";
import type { World } from "../World";
import { Crystal } from "./Crystal";
import { Part, RenderLayer } from "./Part";

const MIN_SPLIT_RADIUS = 5;
const MAX_ASTEROIDS = 8;

interface AsteroidConfig {
  radius: number;
  vertexOffsets: number[];
}

export class Asteroid extends Part {
  readonly layer = RenderLayer.WORLD;

  readonly radius: number;
  vertexOffsets: number[];

  constructor(world: World, cfg: AsteroidConfig) {
    super(world);
    this.radius = cfg.radius;
    this.mass = cfg.radius ** 2;
    this.gravityScale = 0.5; // curves toward planets at half-gravity rate
    this.vertexOffsets = cfg.vertexOffsets;

    // Build collision polygon from vertex offsets.
    const numVerts = cfg.vertexOffsets.length;
    this.polygon = cfg.vertexOffsets.map((offset, i) => {
      const angle = (i / numVerts) * Math.PI * 2;
      return {
        x: Math.cos(angle) * cfg.radius * offset,
        y: Math.sin(angle) * cfg.radius * offset,
      };
    });
  }

  override onCollide = (other: EnginePart, nx: number, ny: number, _impactSpeed: number): void => {
    this.world.remove(this);
    playAsteroidCrashSound({ mass: this.mass }, { source: this });
    this.spawnCrystals();

    if (this.radius > MIN_SPLIT_RADIUS && this.world.asteroids.length < MAX_ASTEROIDS) {
      this.spawnFragments(other, nx, ny);
    }
  };

  private spawnCrystals(): void {
    // Larger asteroids drop more crystals. Tiny fragments drop 1, big asteroids drop up to 3.
    const count = Math.min(3, Math.max(1, Math.floor(this.radius / 12)));
    const speed = Math.hypot(this.vx, this.vy) * 0.3;

    for (let i = 0; i < count; i++) {
      const crystal = new Crystal(this.world);
      crystal.x = this.x + (Math.random() - 0.5) * this.radius;
      crystal.y = this.y + (Math.random() - 0.5) * this.radius;

      // Scatter in random directions.
      const angle = Math.random() * Math.PI * 2;
      crystal.vx = Math.cos(angle) * (speed + Math.random() * 1.5);
      crystal.vy = Math.sin(angle) * (speed + Math.random() * 1.5);

      this.world.add(crystal);
    }
  }

  private spawnFragments(other: EnginePart, nx: number, ny: number): void {
    const childRadius = this.radius / 2;
    const numVertices = 7 + Math.floor(Math.random() * 3);

    // Reflect velocity off the collision normal if the other part is anchored
    // (e.g. a planet), otherwise deflect based on relative mass.
    let baseVx: number;
    let baseVy: number;

    if (other.anchored) {
      // Reflect: v' = v - 2(v·n)n
      const dot = this.vx * nx + this.vy * ny;
      baseVx = this.vx - 2 * dot * nx;
      baseVy = this.vy - 2 * dot * ny;
    } else {
      // Deflect away from the other object's center
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = Math.hypot(dx, dy) || 1;
      const speed = Math.hypot(this.vx, this.vy);
      baseVx = (dx / dist) * speed;
      baseVy = (dy / dist) * speed;
    }

    // Spread the two fragments apart by ±30° from the base direction.
    const spreadAngle = Math.PI / 6;
    const baseAngle = Math.atan2(baseVy, baseVx);
    const speed = Math.hypot(baseVx, baseVy) * 0.8;

    for (const sign of [-1, 1]) {
      const angle = baseAngle + sign * spreadAngle;
      const vertexOffsets = Array.from({ length: numVertices }, () => 0.75 + Math.random() * 0.5);

      const fragment = new Asteroid(this.world, {
        radius: childRadius,
        vertexOffsets,
      });
      fragment.x = this.x + Math.cos(angle) * childRadius;
      fragment.y = this.y + Math.sin(angle) * childRadius;
      fragment.vx = Math.cos(angle) * speed;
      fragment.vy = Math.sin(angle) * speed;
      this.world.add(fragment);
    }
  }

  doUpdate(): void {
    this.x += this.vx;
    this.y += this.vy;

    // Despawn if too far from the player (beyond minimap range).
    const dx = this.x - this.world.player.x;
    const dy = this.y - this.world.player.y;
    if (dx * dx + dy * dy > 9000 * 9000) {
      this.world.remove(this);
    }
  }

  doRender(ctx: CanvasRenderingContext2D): void {
    const numVerts = this.vertexOffsets.length;
    ctx.beginPath();
    for (let i = 0; i <= numVerts; i++) {
      const vAngle = (i / numVerts) * Math.PI * 2;
      const r = this.radius * this.vertexOffsets[i % numVerts];
      const vx = this.x + Math.cos(vAngle) * r;
      const vy = this.y + Math.sin(vAngle) * r;
      if (i === 0) ctx.moveTo(vx, vy);
      else ctx.lineTo(vx, vy);
    }
    ctx.closePath();

    const gray = 85 + Math.floor(this.radius * 1.5);
    ctx.fillStyle = `rgb(${gray}, ${gray - 5}, ${gray - 10})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(180,180,185,0.5)`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
