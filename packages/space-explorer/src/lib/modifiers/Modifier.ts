import type { Part } from "../parts/Part";

export abstract class Modifier {
  constructor(public parent: Part) {}
  abstract update(): void;
}
