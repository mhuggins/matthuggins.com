export class Input {
  private keys = new Set<string>();
  private prevKeys = new Set<string>();
  private handleKeydown: (e: KeyboardEvent) => void;
  private handleKeyup: (e: KeyboardEvent) => void;

  constructor(onReset: () => void) {
    this.handleKeydown = (e: KeyboardEvent) => {
      this.keys.add(e.code);
      if (e.code === "Space") e.preventDefault();
      if (e.code === "KeyR") onReset();
    };
    this.handleKeyup = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
    };
    window.addEventListener("keydown", this.handleKeydown);
    window.addEventListener("keyup", this.handleKeyup);
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
    window.removeEventListener("keydown", this.handleKeydown);
    window.removeEventListener("keyup", this.handleKeyup);
  }
}
