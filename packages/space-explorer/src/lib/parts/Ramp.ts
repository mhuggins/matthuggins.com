import { type Point } from "@matthuggins/platforming-engine";
import { surfaceRadiusAt } from "../../helpers/surfaceRadiusAt";
import { World } from "../World";
import { Part, RenderLayer } from "./Part";
import type { Planet } from "./Planet";

export interface RampConfig {
  planet: Planet;
  angle: number; // angle from planet center (radians)
  altitude: number; // gap above planet surface (0 = resting on surface)
  width: number;
  height: number;
  color: string;
  flip?: boolean; // if true, slope faces the other direction
}

export class Ramp extends Part {
  readonly layer = RenderLayer.WORLD;
  override anchored = true;
  declare world: World;

  planet: Planet;
  angle: number;
  altitude: number;
  width: number;
  height: number;
  color: string;

  /** Outward normal of the slope face (world space). */
  slopeNormal: Point;
  /** Direction along the slope from low end to high end (world space, unit). */
  slopeTangent: Point;
  /** World position of the low end of the slope (at planet surface). */
  slopeStart: Point;
  /** World position of the high end of the slope. */
  slopeEnd: Point;
  /** Length of the slope edge. */
  slopeLength: number;

  constructor(world: World, cfg: RampConfig) {
    super(world);
    this.planet = cfg.planet;
    this.angle = cfg.angle;
    this.altitude = cfg.altitude;
    this.width = cfg.width;
    this.height = cfg.height;
    this.color = cfg.color;
    this.mass = 1e9;
    this.restitution = 0;

    const hw = cfg.width / 2;
    const hh = cfg.height / 2;

    // Triangle polygon in local space.
    // After rotation (angle + PI/2), local -y points away from planet.
    if (cfg.flip) {
      this.polygon = [
        { x: -hw, y: hh }, // bottom-left (on surface)
        { x: hw, y: hh }, // bottom-right (on surface)
        { x: hw, y: -hh }, // top-right (tall side)
      ];
    } else {
      this.polygon = [
        { x: -hw, y: hh }, // bottom-left (on surface)
        { x: hw, y: hh }, // bottom-right (on surface)
        { x: -hw, y: -hh }, // top-left (tall side)
      ];
    }

    this.rotation = cfg.angle + Math.PI / 2;

    const surfR = surfaceRadiusAt(cfg.planet, cfg.angle);
    const centerRadius = surfR + cfg.altitude + cfg.height / 2;
    this.x = cfg.planet.x + Math.cos(cfg.angle) * centerRadius;
    this.y = cfg.planet.y + Math.sin(cfg.angle) * centerRadius;

    // Compute slope geometry in world space.
    this.slopeLength = Math.hypot(cfg.width, cfg.height);

    const rot = cfg.angle + Math.PI / 2;
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);

    // Slope outward normal (perpendicular to the hypotenuse, pointing away
    // from the triangle interior).
    // Non-flipped: slope edge from (-hw,-hh) to (hw,hh), direction (w,h).
    //   Outward normal = (h, -w) normalized.
    // Flipped: slope edge from (hw,-hh) to (-hw,hh), direction (-w,h).
    //   Outward normal = (h, w) normalized.
    const localNx = cfg.height / this.slopeLength;
    const localNy = (cfg.flip ? cfg.width : -cfg.width) / this.slopeLength;
    this.slopeNormal = {
      x: localNx * cosR - localNy * sinR,
      y: localNx * sinR + localNy * cosR,
    };

    // Slope tangent from low end (at planet surface) to high end.
    // Non-flipped: low=(hw,hh) → high=(-hw,-hh), local dir=(-w,-h)/len
    // Flipped:     low=(-hw,hh) → high=(hw,-hh),  local dir=(w,-h)/len
    const localTx = (cfg.flip ? cfg.width : -cfg.width) / this.slopeLength;
    const localTy = -cfg.height / this.slopeLength;
    this.slopeTangent = {
      x: localTx * cosR - localTy * sinR,
      y: localTx * sinR + localTy * cosR,
    };

    // Slope endpoints in world space.
    const lowLX = cfg.flip ? -hw : hw;
    const lowLY = hh;
    const highLX = cfg.flip ? hw : -hw;
    const highLY = -hh;
    this.slopeStart = {
      x: this.x + lowLX * cosR - lowLY * sinR,
      y: this.y + lowLX * sinR + lowLY * cosR,
    };
    this.slopeEnd = {
      x: this.x + highLX * cosR - highLY * sinR,
      y: this.y + highLX * sinR + highLY * cosR,
    };
  }

  protected override doUpdate(): void {}

  protected override doRender(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle + Math.PI / 2);

    const verts = this.polygon;

    // Drop shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.moveTo(verts[0].x + 3, verts[0].y + 4);
    ctx.lineTo(verts[1].x + 3, verts[1].y + 4);
    ctx.lineTo(verts[2].x + 3, verts[2].y + 4);
    ctx.closePath();
    ctx.fill();

    // Main body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(verts[0].x, verts[0].y);
    ctx.lineTo(verts[1].x, verts[1].y);
    ctx.lineTo(verts[2].x, verts[2].y);
    ctx.closePath();
    ctx.fill();

    // Edge outline
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }
}
