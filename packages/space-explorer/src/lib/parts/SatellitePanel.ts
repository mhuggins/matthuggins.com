import { type RenderingContext2D, rectPolygon } from "@matthuggins/platforming-engine";
import { Color } from "../../types";
import type { World } from "../World";
import { Part, RenderLayer } from "./Part";

interface SatellitePanelConfig {
  side: -1 | 1;
  scale: number;
  color: Color;
  mass: number;
}

/**
 * One side of a satellite's solar array (boom + two panels).
 * While welded to the satellite body, the WeldModifier prevents panel↔body
 * collision and gravity is disabled. On break-apart, it becomes an independent
 * physics object that is destroyed on first collision.
 */
export class SatellitePanel extends Part {
  readonly layer = RenderLayer.WORLD;
  readonly side: -1 | 1;
  readonly scale: number;
  color: Color;
  angularVelocity = 0;
  broken = false;

  constructor(world: World, cfg: SatellitePanelConfig) {
    super(world);
    this.side = cfg.side;
    this.scale = cfg.scale;
    this.color = cfg.color;
    this.mass = cfg.mass;

    const s = cfg.scale;
    // Panel assembly spans 2.84s wide × 0.55s tall.
    this.polygon = rectPolygon(s * 2.84, s * 0.55);

    // While welded, WeldModifier prevents panel↔body collision and gravity is off.
    this.obeysGravity = false;
  }

  /** Enable independent physics after break-apart. */
  enablePhysics(): void {
    this.broken = true;
    this.obeysGravity = true;
    this.gravityScale = 0.5;
  }

  override onCollide(): void {
    if (this.broken) {
      this.world.remove(this);
    }
  }

  protected override doUpdate(): void {
    if (!this.broken) return;

    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.angularVelocity;

    // Despawn if too far from the player.
    const dx = this.x - this.world.player.x;
    const dy = this.y - this.world.player.y;
    if (dx * dx + dy * dy > 9000 * 9000) {
      this.world.remove(this);
    }
  }

  protected override doRender(ctx: RenderingContext2D): void {
    const s = this.scale;
    const side = this.side;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // All coordinates are relative to the panel center.
    // The panel assembly for one side spans from 0.38s to 3.22s from the body center,
    // giving a center offset of 1.8s. So local X goes from -1.42s to +1.42s.
    const centerOffset = side * s * 1.8;
    const boomW = s * 0.08;
    const panelW = s * 1.3;
    const panelH = s * 0.55;
    const panelGap = s * 0.12;

    // Boom — from body junction to outer edge.
    const boomLocalStart = side * s * 0.38 - centerOffset;
    const boomLocalEnd = side * (s * 0.38 + s * 1.7) - centerOffset;
    ctx.fillStyle = "rgba(160,165,180,0.9)";
    ctx.fillRect(
      Math.min(boomLocalStart, boomLocalEnd),
      -boomW / 2,
      Math.abs(boomLocalEnd - boomLocalStart),
      boomW,
    );

    // Two panels.
    for (let pi = 0; pi < 2; pi++) {
      let pStartX: number;
      if (side > 0) {
        pStartX = side * s * 0.38 + panelGap + pi * (panelW + panelGap) - centerOffset;
      } else {
        pStartX = side * s * 0.38 - panelGap - (pi + 1) * panelW - pi * panelGap - centerOffset;
      }

      ctx.fillStyle = "rgba(22, 44, 120, 0.95)";
      ctx.fillRect(pStartX, -panelH / 2, panelW * side, panelH);

      // Grid lines.
      ctx.strokeStyle = "rgba(80, 120, 220, 0.6)";
      ctx.lineWidth = 0.5;
      const cols = 4;
      const rows = 2;
      for (let ci = 1; ci < cols; ci++) {
        const lx = pStartX + (panelW * side * ci) / cols;
        ctx.beginPath();
        ctx.moveTo(lx, -panelH / 2);
        ctx.lineTo(lx, panelH / 2);
        ctx.stroke();
      }
      for (let ri = 1; ri < rows; ri++) {
        const ly = -panelH / 2 + (panelH * ri) / rows;
        ctx.beginPath();
        ctx.moveTo(pStartX, ly);
        ctx.lineTo(pStartX + panelW * side, ly);
        ctx.stroke();
      }

      // Highlight.
      ctx.fillStyle = "rgba(100,160,255,0.10)";
      ctx.fillRect(pStartX, -panelH / 2, panelW * side, panelH * 0.4);

      // Border.
      ctx.strokeStyle = "rgba(140,170,255,0.5)";
      ctx.lineWidth = 0.8;
      ctx.strokeRect(pStartX, -panelH / 2, panelW * side, panelH);
    }

    ctx.restore();
  }
}
