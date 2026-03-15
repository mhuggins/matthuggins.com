import { HeightFieldPart } from "@matthuggins/platforming-engine";
import { clamp } from "../../helpers/clamp";
import {
  GRAVITY_RADIUS_BASE,
  GRAVITY_RADIUS_MULTIPLIER,
} from "../../helpers/gravityStrengthForPlanets";
import { surfaceRadiusAt } from "../../helpers/surfaceRadiusAt";
import { Color, PlanetDecoration, TerrainFeature } from "../../types";
import type { World } from "../World";
import { RenderLayer } from "./Part";

// Assumed gravity range across all planets — used to normalize visual intensity.
const GRAVITY_MIN = 0.15;
const GRAVITY_MAX = 0.4;

// Accumulated band opacity range — weakest planet sits at MIN, strongest at MAX.
const GRAVITY_BAND_OPACITY_MIN = 0.08;
const GRAVITY_BAND_OPACITY_MAX = 0.2;

export interface PlanetConfig {
  name: string;
  x: number;
  y: number;
  radius: number;
  gravity: number;
  color: Color;
  ringColor: Color;
  deco: PlanetDecoration[];
  terrain: TerrainFeature[];
}

export class Planet extends HeightFieldPart {
  readonly layer = RenderLayer.WORLD;
  override anchored = true;
  declare world: World;

  name: string;
  color: Color;
  ringColor: Color;
  deco: PlanetDecoration[];
  terrain: TerrainFeature[];
  private surfaceRadiusLUT: Float64Array;

  constructor(world: World, cfg: PlanetConfig) {
    super(world);
    this.x = cfg.x;
    this.y = cfg.y;
    this.name = cfg.name;
    this.radius = cfg.radius;
    this.gravity = cfg.gravity; // engine field — used by applyGravity
    this.color = cfg.color;
    this.ringColor = cfg.ringColor;
    this.deco = cfg.deco;
    this.terrain = cfg.terrain;
    this.mass = 4 * Math.PI * cfg.radius ** 2;

    const LUT_SIZE = 512;
    this.surfaceRadiusLUT = new Float64Array(LUT_SIZE);
    for (let i = 0; i < LUT_SIZE; i++) {
      const a = (i / LUT_SIZE) * Math.PI * 2;
      this.surfaceRadiusLUT[i] = surfaceRadiusAt(this, a);
    }
  }

  surfaceRadiusAt(angle: number): number {
    const TWO_PI = Math.PI * 2;
    const n = this.surfaceRadiusLUT.length;
    const a = ((angle % TWO_PI) + TWO_PI) % TWO_PI;
    const idx = (a / TWO_PI) * n;
    const i0 = Math.floor(idx) % n;
    const i1 = (i0 + 1) % n;
    const frac = idx - Math.floor(idx);
    return this.surfaceRadiusLUT[i0] * (1 - frac) + this.surfaceRadiusLUT[i1] * frac;
  }

  doUpdate(): void {
    // Planets are static — no movement.
  }

  doRender(ctx: CanvasRenderingContext2D): void {
    const player = this.world.player;
    const planets = this.world.planets;

    let bandVisibility: number;
    if (player.hasUsedJetpackThisAirborne) {
      bandVisibility = 1;
    } else {
      const minSurfaceDist = Math.min(
        ...planets.map((p) => {
          const angle = Math.atan2(player.y - p.y, player.x - p.x);
          return Math.hypot(player.x - p.x, player.y - p.y) - surfaceRadiusAt(p, angle);
        }),
      );
      bandVisibility = clamp(minSurfaceDist / 240, 0, 1);
    }

    this.drawBands(ctx, bandVisibility);
    this.drawBody(ctx);
    this.drawDecorations(ctx);
    this.drawTrees(ctx);
  }

  private drawBands(ctx: CanvasRenderingContext2D, bandVisibility: number): void {
    const influenceRadius = this.radius * (1 + GRAVITY_RADIUS_MULTIPLIER) + GRAVITY_RADIUS_BASE;
    const numBands = Math.max(3, Math.round(this.gravity * 32));
    const period = 1500 / this.gravity;
    const now = performance.now();
    const { r: cr, g: cg, b: cb } = this.ringColor;
    const gravityNormalized = (this.gravity - GRAVITY_MIN) / (GRAVITY_MAX - GRAVITY_MIN);
    const maxOpacity =
      GRAVITY_BAND_OPACITY_MIN +
      gravityNormalized * (GRAVITY_BAND_OPACITY_MAX - GRAVITY_BAND_OPACITY_MIN);
    const bandAlpha = (maxOpacity / numBands) * bandVisibility;

    ctx.save();
    ctx.beginPath();
    ctx.rect(
      this.x - influenceRadius - 10,
      this.y - influenceRadius - 10,
      (influenceRadius + 10) * 2,
      (influenceRadius + 10) * 2,
    );
    for (let i = 0; i <= 256; i++) {
      const a = (i / 256) * Math.PI * 2;
      const r = surfaceRadiusAt(this, a);
      const px = this.x + Math.cos(a) * r;
      const py = this.y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.clip("evenodd");

    for (let i = 0; i < numBands; i++) {
      const phase = (now / period + i / numBands) % 1;
      const bandRadius = influenceRadius * (1 - phase);
      ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${bandAlpha})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, bandRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawBody(ctx: CanvasRenderingContext2D): void {
    const g = ctx.createRadialGradient(
      this.x - this.radius * 0.35,
      this.y - this.radius * 0.4,
      this.radius * 0.2,
      this.x,
      this.y,
      this.radius,
    );
    g.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.7)`);
    g.addColorStop(0.18, `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`);
    g.addColorStop(1, `rgb(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.3)`);

    const N = 256;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const r = surfaceRadiusAt(this, a);
      const px = this.x + Math.cos(a) * r;
      const py = this.y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
  }

  private drawDecorations(ctx: CanvasRenderingContext2D): void {
    for (const d of this.deco) {
      const surfR = surfaceRadiusAt(this, d.angle);
      const ox = Math.cos(d.angle) * (surfR - d.size * 0.8);
      const oy = Math.sin(d.angle) * (surfR - d.size * 0.8);
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(this.x + ox, this.y + oy, d.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawTrees(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.3;
      const nx = Math.cos(a);
      const ny = Math.sin(a);
      const surfR = surfaceRadiusAt(this, a);

      const trunkBaseX = this.x + nx * surfR;
      const trunkBaseY = this.y + ny * surfR;
      const trunkTopX = this.x + nx * (surfR + 10);
      const trunkTopY = this.y + ny * (surfR + 10);

      ctx.strokeStyle = "rgba(60,35,20,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(trunkBaseX, trunkBaseY);
      ctx.lineTo(trunkTopX, trunkTopY);
      ctx.stroke();

      ctx.fillStyle = "rgba(145,220,160,0.95)";
      ctx.beginPath();
      ctx.arc(this.x + nx * (surfR + 14), this.y + ny * (surfR + 14), 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
