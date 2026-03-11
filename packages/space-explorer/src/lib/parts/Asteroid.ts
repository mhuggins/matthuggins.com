import { StunModifier } from "../modifiers/StunModifier";
import { applyCollisionImpulse, surfaceRadiusAt } from "../utils";
import { World } from "../World";
import { Part, RenderLayer } from "./Part";
import { Satellite } from "./Satellite";

interface AsteroidConfig {
  radius: number;
  vertexOffsets: number[];
}

export class Asteroid extends Part {
  readonly layer = RenderLayer.WORLD;

  radius: number;
  vertexOffsets: number[];

  constructor(world: World, cfg: AsteroidConfig) {
    super(world);
    this.radius = cfg.radius;
    this.mass = cfg.radius ** 2;
    this.vertexOffsets = cfg.vertexOffsets;
  }

  update(): void {
    // Gravity — 50% of full gravity so they curve but usually pass through
    const g = this.world.getBlendedGravity(this.x, this.y);
    this.vx += g.gx * 0.5;
    this.vy += g.gy * 0.5;
    this.x += this.vx;
    this.y += this.vy;

    // Despawn if too far from all planets
    const nearestPlanetDist = Math.min(
      ...this.world.planets.map((p) => Math.hypot(this.x - p.x, this.y - p.y)),
    );
    if (nearestPlanetDist > 3000) {
      this.world.remove(this);
      return;
    }

    // Collision with planets
    for (const planet of this.world.planets) {
      const d = Math.hypot(this.x - planet.x, this.y - planet.y);
      const surfAngle = Math.atan2(this.y - planet.y, this.x - planet.x);
      if (d < surfaceRadiusAt(planet, surfAngle) + this.radius) {
        this.world.remove(this);
        return;
      }
    }

    // Collision with player
    const player = this.world.player;
    const dToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
    if (dToPlayer < player.radius + this.radius) {
      const nx = (player.x - this.x) / (dToPlayer || 0.001);
      const ny = (player.y - this.y) / (dToPlayer || 0.001);
      const impactSpeed = Math.abs((player.vx - this.vx) * nx + (player.vy - this.vy) * ny);

      applyCollisionImpulse(player, this);

      if (player.onGround) {
        player.onGround = false;
        player.mode = "air";
      }

      // Asteroids hit harder: 1 rotation minimum, up to ~4 for a fast direct hit.
      const rotations = Math.min(4, 1 + impactSpeed * 0.18);
      const spinStrength = rotations * 2 * Math.PI * 0.04;
      const existingIdx = player.modifiers.findIndex((m) => m instanceof StunModifier);
      if (existingIdx !== -1) player.modifiers.splice(existingIdx, 1);
      player.modifiers.push(new StunModifier(player, nx, ny, spinStrength));
    }

    // Collision with satellites
    for (const part of this.world.parts) {
      if (!(part instanceof Satellite)) continue;
      const dToSat = Math.hypot(this.x - part.x, this.y - part.y);
      if (dToSat < this.radius + part.radius) {
        if (part.mode === "kinematic") {
          part.mode = "physics";
        }
        applyCollisionImpulse(this, part);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
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
