import autoBind from "auto-bind";

export class Camera {
  constructor() {
    autoBind(this);
  }

  reset(): void {}

  update(): void {}
}
