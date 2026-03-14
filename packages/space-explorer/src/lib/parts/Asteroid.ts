import { Part as EnginePart } from "@matthuggins/platforming-engine";
import type { World } from "../World";
import { Part, RenderLayer } from "./Part";
import { Planet } from "./Planet";

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

  override onCollide = (
    other: EnginePart,
    _nx: number,
    _ny: number,
    _impactSpeed: number,
  ): void => {
    if (other instanceof Planet) {
      this.world.remove(this);
    }
  };

  doUpdate(): void {
    this.x += this.vx;
    this.y += this.vy;

    // Despawn if too far from all planets
    const nearestPlanetDist = Math.min(
      ...this.world.planets.map((p) => Math.hypot(this.x - p.x, this.y - p.y)),
    );
    if (nearestPlanetDist > 3000) {
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
