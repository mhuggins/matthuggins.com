import { type Point, rectPolygon } from "@matthuggins/platforming-engine";
import { surfaceRadiusAt } from "../../helpers/surfaceRadiusAt";
import { World } from "../World";
import { Part, RenderLayer } from "./Part";
import type { Planet } from "./Planet";

export interface PlatformConfig {
  planet: Planet;
  angle: number; // angle from planet center (radians)
  altitude: number; // gap above planet surface (0 = resting on surface)
  width: number;
  height: number;
  color: string;
}

export class Platform extends Part {
  readonly layer = RenderLayer.WORLD;
  override anchored = true;
  declare world: World;

  planet: Planet;
  angle: number;
  altitude: number;
  width: number;
  height: number;
  color: string;
  topNormal: Point;

  constructor(world: World, cfg: PlatformConfig) {
    super(world);
    this.planet = cfg.planet;
    this.angle = cfg.angle;
    this.altitude = cfg.altitude;
    this.width = cfg.width;
    this.height = cfg.height;
    this.color = cfg.color;
    this.mass = 1e9;

    this.polygon = rectPolygon(cfg.width, cfg.height);
    this.rotation = cfg.angle + Math.PI / 2;
    // topNormal: outward radial direction (the "up" side of the platform).
    this.topNormal = { x: Math.cos(cfg.angle), y: Math.sin(cfg.angle) };

    const surfR = surfaceRadiusAt(cfg.planet, cfg.angle);
    const centerRadius = surfR + cfg.altitude + cfg.height / 2;
    this.x = cfg.planet.x + Math.cos(cfg.angle) * centerRadius;
    this.y = cfg.planet.y + Math.sin(cfg.angle) * centerRadius;
  }

  /** Distance from planet center to the walkable top surface of this platform. */
  get topRadius(): number {
    return surfaceRadiusAt(this.planet, this.angle) + this.altitude + this.height;
  }

  /**
   * Permeable when the player center is on the underside of the platform AND
   * the contact normal points away from topNormal. Requiring both conditions
   * prevents corner contacts on tilted platforms from incorrectly passing through
   * when the player approaches from the side.
   */
  override isPermeable(nx: number, ny: number, cx?: number, cy?: number): boolean {
    const normalAway = nx * this.topNormal.x + ny * this.topNormal.y < 0;
    if (!normalAway) return false;
    if (cx === undefined || cy === undefined) return true;
    const playerSide = (cx - this.x) * this.topNormal.x + (cy - this.y) * this.topNormal.y;
    return playerSide < 0;
  }

  protected override doUpdate(): void {}

  protected override doRender(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    // Rotate so the rectangle is tangent to the planet surface:
    // tangent direction is angle + π/2, so width lies along the surface.
    ctx.rotate(this.angle + Math.PI / 2);

    const w = this.width;
    const h = this.height;

    // Drop shadow below platform (toward planet)
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(-w / 2 + 4, h / 2, w - 8, 6);

    // Main body
    ctx.fillStyle = this.color;
    ctx.fillRect(-w / 2, -h / 2, w, h);

    // Top surface highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
    ctx.fillRect(-w / 2, -h / 2, w, 5);

    // Bottom edge shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.fillRect(-w / 2, h / 2 - 5, w, 5);

    // Side edge lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.strokeRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1);

    ctx.restore();
  }
}
