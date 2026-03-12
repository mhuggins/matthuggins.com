import autoBind from "auto-bind";

export class Input {
  private keys = new Set<string>();
  private prevKeys = new Set<string>();

  constructor() {
    autoBind(this);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  protected handleKeyDown(e: KeyboardEvent): void {
    this.keys.add(e.code);
  }

  protected handleKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.code);
  }

  isDown(code: string): boolean {
    return this.keys.has(code);
  }

  justPressed(code: string): boolean {
    return this.keys.has(code) && !this.prevKeys.has(code);
  }

  justReleased(code: string): boolean {
    return !this.keys.has(code) && this.prevKeys.has(code);
  }

  endFrame(): void {
    this.prevKeys = new Set(this.keys);
  }

  destroy(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }
}
