import { rectPolygon } from "../helpers/rectPolygon";
import type { Point } from "../types";
import { Part } from "./Part";

const DEFAULT_PLAYER_WIDTH = 16;
const DEFAULT_PLAYER_HEIGHT = 24;

interface PlayerConfig {
  width?: number;
  height?: number;
}

export abstract class Player extends Part {
  private _halfWidth: number;
  private _halfHeight: number;

  jumpStrength: number = 7;
  gradability: number = Math.PI / 3; // 60° — max slope before player slides
  stepHeight: number = 0; // max vertical offset for stepping onto adjacent surfaces
  movementIntent: number = 0; // -1/0/1 — set by game from input each frame
  /** @internal Pre-collision x-velocity, saved so grounding can detect ascending players. */
  preColVx = 0;
  /** @internal Pre-collision y-velocity, saved so grounding can detect ascending players. */
  preColVy = 0;
  groundedOn: Part | null = null;
  groundedNormal: Point = { x: 0, y: -1 };
  surfaceTangent: Point = { x: 1, y: 0 };
  upX: number = 0;
  upY: number = -1;

  constructor(world: ConstructorParameters<typeof Part>[0], cfg: PlayerConfig = {}) {
    super(world);
    const w = cfg.width ?? DEFAULT_PLAYER_WIDTH;
    const h = cfg.height ?? DEFAULT_PLAYER_HEIGHT;
    this._halfWidth = w / 2;
    this._halfHeight = h / 2;
    this.polygon = rectPolygon(w, h);
  }

  get halfWidth() {
    return this._halfWidth;
  }

  get halfHeight() {
    return this._halfHeight;
  }

  // Override to veto grounding on a specific surface (e.g. cooldown)
  canGroundOn(_surface: Part): boolean {
    return true;
  }

  // Callbacks — override in game Player
  onLand(_surface: Part): void {}
  onLeaveGround(): void {}
  onStepUp(_surface: Part): void {}
}
