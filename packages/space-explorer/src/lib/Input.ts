import { Input as EngineInput } from "@matthuggins/platforming-engine";

type ResetCallback = () => void;

export class Input extends EngineInput {
  private onReset: ResetCallback;
  debugCollisions = false;

  constructor() {
    super();
    this.onReset = () => {};
    window.addEventListener("keydown", this.handleExtra);
  }

  private handleExtra = (e: KeyboardEvent) => {
    if (e.code === "Space") {
      e.preventDefault();
    } else if (e.code === "KeyR") {
      this.onReset();
    } else if (e.code === "Backquote") {
      this.debugCollisions = !this.debugCollisions;
    }
  };

  override destroy = () => {
    super.destroy();
    window.removeEventListener("keydown", this.handleExtra);
  };

  setResetCallback(fn: ResetCallback): void {
    this.onReset = fn;
  }
}
