import { CircularPart } from "./CircularPart";
import { Part } from "./Part";

export abstract class Player extends CircularPart {
  override readonly isPlayer = true;
  jumpStrength: number = 7;
  gradability: number = Math.PI / 3; // 60° — max traversable slope
  groundedOn: Part | null = null;
  groundedNormal: { x: number; y: number } = { x: 0, y: -1 };
  surfaceTangent: { x: number; y: number } = { x: 1, y: 0 };
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
