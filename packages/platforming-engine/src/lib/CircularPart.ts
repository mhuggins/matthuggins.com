import { Part } from "./Part";

export abstract class CircularPart extends Part {
  override readonly shape = "circle" as const;

  radius: number = 0;

  surfaceRadiusToward(_x: number, _y: number): number {
    return this.radius;
  }
}
