export type SoundSetup = (ctx: AudioContext) => void | (() => void);

export class AudioManager {
  private context: AudioContext | null = null;
  private registry = new Map<string, SoundSetup>();
  private loops = new Map<string, () => void>();

  getContext(): AudioContext | null {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      if (!this.context) {
        this.context = new AudioContext();
        // Browsers suspend AudioContext until a user gesture. Register a one-time
        // listener so it resumes as soon as the user interacts with the page.
        if (this.context.state === "suspended") {
          const resume = () => {
            void this.context?.resume();
            window.removeEventListener("keydown", resume);
            window.removeEventListener("pointerdown", resume);
          };
          window.addEventListener("keydown", resume, { once: true });
          window.addEventListener("pointerdown", resume, { once: true });
        }
      }
      if (this.context.state === "suspended") {
        void this.context.resume();
      }
      return this.context;
    } catch {
      return null;
    }
  }

  register(key: string, setup: SoundSetup): void {
    this.registry.set(key, setup);
  }

  play(key: string): void {
    const ctx = this.getContext();
    const setup = this.registry.get(key);

    if (ctx && setup) {
      setup(ctx);
    }
  }

  startLoop(key: string): void {
    if (this.loops.has(key)) {
      return;
    }

    const ctx = this.getContext();
    const setup = this.registry.get(key);
    if (!ctx || !setup) {
      return;
    }

    const cleanup = setup(ctx) as (() => void) | undefined;
    if (cleanup) {
      this.loops.set(key, cleanup);
    }
  }

  stopLoop(key: string): void {
    this.loops.get(key)?.();
    this.loops.delete(key);
  }
}
