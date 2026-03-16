import {
  Part as EnginePart,
  type RenderingContext2D,
  rectPolygon,
  WeldModifier,
} from "@matthuggins/platforming-engine";
import { surfaceRadiusAt } from "../../helpers/surfaceRadiusAt";
import { Color } from "../../types";
import type { World } from "../World";
import { Part, RenderLayer } from "./Part";
import type { Planet } from "./Planet";
import { SatellitePanel } from "./SatellitePanel";

const MIN_BREAK_IMPACT_SPEED = 2;

interface SatelliteConfig {
  planet: Planet;
  orbitalRadius: number;
  orbitalPeriod: number;
  angle: number;
  width: number;
  height: number;
  mass: number;
  color: Color;
}

export class Satellite extends Part {
  readonly layer = RenderLayer.WORLD;

  orbitalRadius: number;
  orbitalPeriod: number;
  angle: number;
  width: number;
  height: number;
  mode: "kinematic" | "physics" = "kinematic";
  color: Color;
  parentPlanet: Planet;

  private intact = true;
  private angularVelocity = 0;
  private panels: SatellitePanel[] = [];
  private panelWelds: WeldModifier[] = [];

  constructor(world: World, cfg: SatelliteConfig) {
    super(world);
    this.parentPlanet = cfg.planet;
    this.orbitalRadius = cfg.orbitalRadius;
    this.orbitalPeriod = cfg.orbitalPeriod;
    this.angle = cfg.angle;
    this.width = cfg.width;
    this.height = cfg.height;
    this.mass = cfg.mass;
    this.color = cfg.color;

    // While intact the body collision covers the full satellite span.
    const s = cfg.width / 4;
    this.polygon = rectPolygon(s * 6.4, s * 1.1);

    this.syncToOrbit();
  }

  override onSpawn(): void {
    this.assemblePanels();
  }

  override onDestroy(): void {
    // Clean up panels that are still welded.
    for (const panel of this.panels) {
      if (!panel.broken) {
        this.world.remove(panel);
      }
    }
    this.panels = [];
  }

  protected override doUpdate(): void {
    if (this.mode === "kinematic") {
      this.angle += (Math.PI * 2) / this.orbitalPeriod;
      this.syncToOrbit();
    } else {
      this.x += this.vx;
      this.y += this.vy;

      if (!this.intact) {
        this.rotation += this.angularVelocity;
      }

      // Crash into parent planet — respawn kinematically.
      const dToPlanet = Math.hypot(this.x - this.parentPlanet.x, this.y - this.parentPlanet.y);
      const surfAngle = Math.atan2(this.y - this.parentPlanet.y, this.x - this.parentPlanet.x);
      const s = this.width / 4;
      if (dToPlanet < surfaceRadiusAt(this.parentPlanet, surfAngle) + s * 0.5) {
        this.respawn();
      }
    }
  }

  override onCollide = (other: EnginePart, _nx: number, _ny: number, impactSpeed: number): void => {
    if (this.mode === "kinematic") {
      this.mode = "physics";
    }

    if (this.intact && impactSpeed >= MIN_BREAK_IMPACT_SPEED) {
      this.breakApart(other);
    }
  };

  protected override doRender(ctx: RenderingContext2D): void {
    const s = this.width / 4;
    this.drawBody(ctx, s);
    this.drawAntenna(ctx, s);
  }

  /** Snap position, velocity, and rotation to match the current orbital angle. */
  private syncToOrbit(): void {
    const av = (Math.PI * 2) / this.orbitalPeriod;
    this.x = this.parentPlanet.x + Math.cos(this.angle) * this.orbitalRadius;
    this.y = this.parentPlanet.y + Math.sin(this.angle) * this.orbitalRadius;
    this.vx = -Math.sin(this.angle) * this.orbitalRadius * av;
    this.vy = Math.cos(this.angle) * this.orbitalRadius * av;
    this.rotation = this.angle + Math.PI / 2;
  }

  private assemblePanels(): void {
    const s = this.width / 4;
    const panelMass = this.mass * 0.2;

    for (const side of [-1, 1] as const) {
      const panel = new SatellitePanel(this.world, {
        side,
        scale: s,
        color: this.color,
        mass: panelMass,
      });
      this.world.add(panel);

      const weld = new WeldModifier(panel, {
        child: this,
        offsetX: side * s * 1.8,
        offsetY: 0,
      });
      panel.modifiers.push(weld);

      // Position the panel immediately so it doesn't flash at (0,0).
      const cos = Math.cos(this.rotation);
      const sin = Math.sin(this.rotation);
      const ox = side * s * 1.8;
      panel.x = this.x + ox * cos;
      panel.y = this.y + ox * sin;
      panel.rotation = this.rotation;

      this.panels.push(panel);
      this.panelWelds.push(weld);
    }
  }

  private breakApart(other: EnginePart): void {
    this.intact = false;

    // Shrink body polygon to just the body + antenna.
    const s = this.width / 4;
    this.polygon = rectPolygon(s * 0.76, s * 1.6);
    this.gravityScale = 0.5;
    this.angularVelocity = (Math.random() - 0.5) * 0.08;

    // Compute fragment launch direction.
    let baseVx: number;
    let baseVy: number;

    if (other.anchored) {
      // Reflect velocity off collision surface.
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = dx / dist;
      const ny = dy / dist;
      const dot = this.vx * nx + this.vy * ny;
      baseVx = this.vx - 2 * dot * nx;
      baseVy = this.vy - 2 * dot * ny;
    } else {
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = Math.hypot(dx, dy) || 1;
      const speed = Math.hypot(this.vx, this.vy);
      baseVx = (dx / dist) * speed;
      baseVy = (dy / dist) * speed;
    }

    const baseAngle = Math.atan2(baseVy, baseVx);
    const speed = Math.hypot(baseVx, baseVy) * 0.7;

    // Release each panel.
    for (let i = 0; i < this.panels.length; i++) {
      const panel = this.panels[i];
      const weld = this.panelWelds[i];

      // Remove the weld modifier.
      const idx = panel.modifiers.indexOf(weld);
      if (idx !== -1) panel.modifiers.splice(idx, 1);

      panel.enablePhysics();

      // Launch at a spread angle away from impact.
      const spreadAngle = (Math.PI / 5) * (i === 0 ? -1 : 1);
      const launchAngle = baseAngle + spreadAngle;
      panel.vx = Math.cos(launchAngle) * speed;
      panel.vy = Math.sin(launchAngle) * speed;
      panel.angularVelocity = (Math.random() - 0.5) * 0.12;
    }

    this.panels = [];
    this.panelWelds = [];
  }

  private respawn(): void {
    // Remove any lingering broken panels.
    for (const panel of this.panels) {
      if (!panel.broken) {
        this.world.remove(panel);
      }
    }
    this.panels = [];
    this.panelWelds = [];

    this.mode = "kinematic";
    this.intact = true;
    this.angularVelocity = 0;
    this.gravityScale = 1;
    this.angle = Math.random() * Math.PI * 2;

    // Restore full-size collision polygon.
    const s = this.width / 4;
    this.polygon = rectPolygon(s * 6.4, s * 1.1);

    this.syncToOrbit();
    this.assemblePanels();
  }

  private drawBody(ctx: RenderingContext2D, s: number): void {
    const bodyW = s * 0.76;
    const bodyH = s * 1.1;
    const br = s * 0.1;

    const bodyGrad = ctx.createLinearGradient(-bodyW / 2, -bodyH / 2, bodyW / 2, bodyH / 2);
    bodyGrad.addColorStop(0, `rgba(230,232,240,0.97)`);
    bodyGrad.addColorStop(0.45, `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`);
    bodyGrad.addColorStop(1, `rgba(60,65,80,0.95)`);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(-bodyW / 2 + br, -bodyH / 2);
    ctx.lineTo(bodyW / 2 - br, -bodyH / 2);
    ctx.quadraticCurveTo(bodyW / 2, -bodyH / 2, bodyW / 2, -bodyH / 2 + br);
    ctx.lineTo(bodyW / 2, bodyH / 2 - br);
    ctx.quadraticCurveTo(bodyW / 2, bodyH / 2, bodyW / 2 - br, bodyH / 2);
    ctx.lineTo(-bodyW / 2 + br, bodyH / 2);
    ctx.quadraticCurveTo(-bodyW / 2, bodyH / 2, -bodyW / 2, bodyH / 2 - br);
    ctx.lineTo(-bodyW / 2, -bodyH / 2 + br);
    ctx.quadraticCurveTo(-bodyW / 2, -bodyH / 2, -bodyW / 2 + br, -bodyH / 2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.strokeStyle = "rgba(100,110,140,0.45)";
    ctx.lineWidth = 0.7;
    const louvrCount = 5;
    for (let li = 1; li < louvrCount; li++) {
      const ly = -bodyH / 2 + (bodyH * li) / louvrCount;
      ctx.beginPath();
      ctx.moveTo(-bodyW / 2 + br, ly);
      ctx.lineTo(bodyW / 2 - br, ly);
      ctx.stroke();
    }
  }

  private drawAntenna(ctx: RenderingContext2D, s: number): void {
    const bodyH = s * 1.1;
    const dishR = s * 0.28;
    const dishStemH = s * 0.22;
    const dishY = -bodyH / 2 - dishStemH;

    ctx.strokeStyle = "rgba(180,185,200,0.9)";
    ctx.lineWidth = s * 0.06;
    ctx.beginPath();
    ctx.moveTo(0, -bodyH / 2);
    ctx.lineTo(0, dishY);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, dishY, dishR, Math.PI, Math.PI * 2);
    ctx.fillStyle = "rgba(210,215,230,0.88)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 0.7;
    ctx.stroke();

    ctx.fillStyle = "rgba(80,85,100,0.9)";
    ctx.beginPath();
    ctx.arc(0, dishY - dishR * 0.55, s * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
}
