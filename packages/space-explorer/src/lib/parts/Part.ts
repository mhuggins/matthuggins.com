import { Part as EnginePart } from "@matthuggins/platforming-engine";
import type { World } from "../World";

export enum RenderLayer {
  WORLD = 0,
  PLAYER = 1,
  HUD = 2,
}

export abstract class Part extends EnginePart {
  // Narrow world type to the concrete SpaceWorld for access to game-specific methods.
  declare world: World;

  abstract readonly layer: RenderLayer;
  zIndex = 0;
  upX = 0;
  upY = -1;
}
