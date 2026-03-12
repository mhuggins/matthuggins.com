import { Modifier as EngineModifier } from "@matthuggins/platforming-engine";
import type { Part } from "../parts/Part";

export abstract class Modifier extends EngineModifier {
  // Narrow parent type to the concrete SpacePart for access to space-specific fields.
  declare parent: Part;
}
