export type SoundParams = Record<string, number>;
export type SoundSetup<T extends SoundParams = SoundParams> = (
  ctx: AudioContext,
  params?: T,
) => void | (() => void);

export class AudioManager {
  private context: AudioContext | null = null;
  // biome-ignore lint/suspicious/noExplicitAny: setup can contain any type of params depending on the sound
  private registry = new Map<string, SoundSetup<any>>();
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

  register<T extends SoundParams>(
    key: string,
    setup: SoundSetup<T>,
  ): {
    play: (params?: T) => void;
    startLoop: (params?: T) => void;
    stopLoop: () => void;
  } {
    this.registry.set(key, setup);

    const play = (params?: T) => this.play(key, params);
    const startLoop = (params?: T) => this.startLoop(key, params);
    const stopLoop = () => this.stopLoop(key);

    return { play, startLoop, stopLoop };
  }

  play<T extends SoundParams>(key: string, params?: T): void {
    const ctx = this.getContext();
    const setup = this.registry.get(key);

    if (ctx && setup) {
      setup(ctx, params);
    }
  }

  startLoop<T extends SoundParams>(key: string, params?: T): void {
    if (this.loops.has(key)) {
      return;
    }

    const ctx = this.getContext();
    const setup = this.registry.get(key);
    if (!ctx || !setup) {
      return;
    }

    const cleanup = setup(ctx, params);
    if (cleanup) {
      this.loops.set(key, cleanup);
    }
  }

  stopLoop(key: string): void {
    this.loops.get(key)?.();
    this.loops.delete(key);
  }
}
