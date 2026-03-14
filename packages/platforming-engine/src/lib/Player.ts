import { rectPolygon } from "../helpers/rectPolygon";
import type { Point } from "../types";
import { Part } from "./Part";

const PLAYER_WIDTH = 16;
const PLAYER_HEIGHT = 24;

export abstract class Player extends Part {
  constructor(world?: ConstructorParameters<typeof Part>[0]) {
    super(world);
    this.polygon = rectPolygon(PLAYER_WIDTH, PLAYER_HEIGHT);
  }

  jumpStrength: number = 7;
  gradability: number = Math.PI / 3; // 60° — max traversable slope
  groundedOn: Part | null = null;
  groundedNormal: Point = { x: 0, y: -1 };
  surfaceTangent: Point = { x: 1, y: 0 };
  upX: number = 0;
  upY: number = -1;

  // Override to veto grounding on a specific surface (e.g. cooldown)
  canGroundOn(_surface: Part): boolean {
    return true;
  }

  // Callbacks — override in game Player
  onLand(_surface: Part): void {}
  onLeaveGround(): void {}
}
