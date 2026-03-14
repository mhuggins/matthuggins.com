import { Part as EnginePart, rectPolygon } from "@matthuggins/platforming-engine";
import { surfaceRadiusAt } from "../../helpers/surfaceRadiusAt";
import { Color } from "../../types";
import type { World } from "../World";
import { Part, RenderLayer } from "./Part";
import type { Planet } from "./Planet";

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

    this.polygon = rectPolygon(cfg.width, cfg.height);
    this.rotation = cfg.angle + Math.PI / 2; // broadside tangent to orbit

    const angularVelocity = (Math.PI * 2) / cfg.orbitalPeriod;
    this.x = cfg.planet.x + Math.cos(cfg.angle) * cfg.orbitalRadius;
    this.y = cfg.planet.y + Math.sin(cfg.angle) * cfg.orbitalRadius;
    this.vx = -Math.sin(cfg.angle) * cfg.orbitalRadius * angularVelocity;
    this.vy = Math.cos(cfg.angle) * cfg.orbitalRadius * angularVelocity;
  }

  protected override doUpdate(): void {
    if (this.mode === "kinematic") {
      const angularVelocity = (Math.PI * 2) / this.orbitalPeriod;
      this.angle += angularVelocity;
      this.x = this.parentPlanet.x + Math.cos(this.angle) * this.orbitalRadius;
      this.y = this.parentPlanet.y + Math.sin(this.angle) * this.orbitalRadius;
      this.vx = -Math.sin(this.angle) * this.orbitalRadius * angularVelocity;
      this.vy = Math.cos(this.angle) * this.orbitalRadius * angularVelocity;
      this.rotation = this.angle + Math.PI / 2; // stay broadside to orbit
    } else {
      // Physics mode — gravity applied by engine applyGravity; just integrate position
      this.x += this.vx;
      this.y += this.vy;

      // Crash into parent planet — respawn kinematically
      const dToPlanet = Math.hypot(this.x - this.parentPlanet.x, this.y - this.parentPlanet.y);
      const surfAngle = Math.atan2(this.y - this.parentPlanet.y, this.x - this.parentPlanet.x);
      const collisionRadius = this.width / 4; // approximate bounding radius
      if (dToPlanet < surfaceRadiusAt(this.parentPlanet, surfAngle) + collisionRadius) {
        this.mode = "kinematic";
        this.angle = Math.random() * Math.PI * 2;
        this.x = this.parentPlanet.x + Math.cos(this.angle) * this.orbitalRadius;
        this.y = this.parentPlanet.y + Math.sin(this.angle) * this.orbitalRadius;
        const av = (Math.PI * 2) / this.orbitalPeriod;
        this.vx = -Math.sin(this.angle) * this.orbitalRadius * av;
        this.vy = Math.cos(this.angle) * this.orbitalRadius * av;
        this.rotation = this.angle + Math.PI / 2;
      }
    }
  }

  protected override doRender(ctx: CanvasRenderingContext2D): void {
    // Draw faint orbital ring in kinematic mode
    if (this.mode === "kinematic") {
      ctx.beginPath();
      ctx.arc(this.parentPlanet.x, this.parentPlanet.y, this.orbitalRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.12)`;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const orientAngle =
      this.mode === "kinematic"
        ? this.angle + Math.PI / 2
        : Math.atan2(this.vy, this.vx) + Math.PI / 2;

    const s = this.width / 4; // render scale (equivalent to old radius)

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(orientAngle);

    this.drawSolarPanels(ctx, s);
    this.drawBody(ctx, s);
    this.drawAntenna(ctx, s);

    ctx.restore();
  }

  override onCollide = (
    _other: EnginePart,
    _nx: number,
    _ny: number,
    _impactSpeed: number,
  ): void => {
    if (this.mode === "kinematic") {
      this.mode = "physics";
    }
  };

  private drawSolarPanels(ctx: CanvasRenderingContext2D, s: number): void {
    const boomLen = s * 1.7;
    const boomW = s * 0.08;
    const panelW = s * 1.3;
    const panelH = s * 0.55;
    const panelGap = s * 0.12;

    for (const side of [-1, 1]) {
      const boomStartX = side * s * 0.38;
      const boomEndX = side * (s * 0.38 + boomLen);

      ctx.fillStyle = "rgba(160,165,180,0.9)";
      ctx.fillRect(
        Math.min(boomStartX, boomEndX),
        -boomW / 2,
        Math.abs(boomEndX - boomStartX),
        boomW,
      );

      for (let pi = 0; pi < 2; pi++) {
        const pStartX =
          side > 0
            ? boomStartX + panelGap + pi * (panelW + panelGap)
            : boomStartX - panelGap - (pi + 1) * panelW - pi * panelGap;

        ctx.fillStyle = "rgba(22, 44, 120, 0.95)";
        ctx.fillRect(pStartX, -panelH / 2, panelW * side, panelH);

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

        ctx.fillStyle = "rgba(100,160,255,0.10)";
        ctx.fillRect(pStartX, -panelH / 2, panelW * side, panelH * 0.4);

        ctx.strokeStyle = "rgba(140,170,255,0.5)";
        ctx.lineWidth = 0.8;
        ctx.strokeRect(pStartX, -panelH / 2, panelW * side, panelH);
      }
    }
  }

  private drawBody(ctx: CanvasRenderingContext2D, s: number): void {
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

  private drawAntenna(ctx: CanvasRenderingContext2D, s: number): void {
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
