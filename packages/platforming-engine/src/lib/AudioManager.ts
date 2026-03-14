export type SoundParams = Record<string, number>;
export type SoundSetup<T extends SoundParams = SoundParams> = (
  ctx: AudioContext,
  params?: T,
) => void | (() => void);

export interface SpatialSource {
  readonly x: number;
  readonly y: number;
}

export interface SpatialOptions {
  source: SpatialSource;
  /** Distance at which volume is 1 (default 200). */
  refDistance?: number;
  /** Distance beyond which volume is 0 (default 2000). */
  maxDistance?: number;
}

interface ActiveSpatialSound {
  gain: GainNode;
  source: SpatialSource;
  refDistance: number;
  maxDistance: number;
  cleanup?: () => void;
}

const DEFAULT_REF_DISTANCE = 200;
const DEFAULT_MAX_DISTANCE = 2000;

export class AudioManager {
  private context: AudioContext | null = null;
  // biome-ignore lint/suspicious/noExplicitAny: setup can contain any type of params depending on the sound
  private registry = new Map<string, SoundSetup<any>>();
  private loops = new Map<string, () => void>();
  private spatialLoops = new Map<string, ActiveSpatialSound>();
  private listenerX = 0;
  private listenerY = 0;

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

  setListenerPosition(x: number, y: number): void {
    this.listenerX = x;
    this.listenerY = y;
  }

  /** Call once per frame to update spatial loop volumes based on listener distance. */
  update(): void {
    for (const [key, spatial] of this.spatialLoops) {
      if (!this.loops.has(key)) {
        this.spatialLoops.delete(key);
        continue;
      }
      spatial.gain.gain.value = this.computeSpatialGain(spatial);
    }
  }

  register<T extends SoundParams>(
    key: string,
    setup: SoundSetup<T>,
  ): {
    play: (params?: T, spatial?: SpatialOptions) => void;
    startLoop: (params?: T, spatial?: SpatialOptions) => void;
    stopLoop: () => void;
  } {
    this.registry.set(key, setup);

    const play = (params?: T, spatial?: SpatialOptions) => this.play(key, params, spatial);
    const startLoop = (params?: T, spatial?: SpatialOptions) =>
      this.startLoop(key, params, spatial);
    const stopLoop = () => this.stopLoop(key);

    return { play, startLoop, stopLoop };
  }

  play<T extends SoundParams>(key: string, params?: T, spatial?: SpatialOptions): void {
    const ctx = this.getContext();
    const setup = this.registry.get(key);

    if (ctx && setup) {
      if (spatial) {
        const gainNode = ctx.createGain();
        gainNode.connect(ctx.destination);
        const refDistance = spatial.refDistance ?? DEFAULT_REF_DISTANCE;
        const maxDistance = spatial.maxDistance ?? DEFAULT_MAX_DISTANCE;
        gainNode.gain.value = this.computeSpatialGain({
          source: spatial.source,
          refDistance,
          maxDistance,
        });
        setup(this.proxyContext(ctx, gainNode), params);
      } else {
        setup(ctx, params);
      }
    }
  }

  startLoop<T extends SoundParams>(key: string, params?: T, spatial?: SpatialOptions): void {
    if (this.loops.has(key)) {
      return;
    }

    const ctx = this.getContext();
    const setup = this.registry.get(key);
    if (!ctx || !setup) {
      return;
    }

    if (spatial) {
      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);
      const entry: ActiveSpatialSound = {
        gain: gainNode,
        source: spatial.source,
        refDistance: spatial.refDistance ?? DEFAULT_REF_DISTANCE,
        maxDistance: spatial.maxDistance ?? DEFAULT_MAX_DISTANCE,
      };
      gainNode.gain.value = this.computeSpatialGain(entry);

      const cleanup = setup(this.proxyContext(ctx, gainNode), params);
      if (cleanup) {
        entry.cleanup = cleanup;
        this.loops.set(key, () => {
          cleanup();
          this.spatialLoops.delete(key);
        });
      }
      this.spatialLoops.set(key, entry);
    } else {
      const cleanup = setup(ctx, params);
      if (cleanup) {
        this.loops.set(key, cleanup);
      }
    }
  }

  stopLoop(key: string): void {
    this.loops.get(key)?.();
    this.loops.delete(key);
    this.spatialLoops.delete(key);
  }

  private computeSpatialGain(spatial: Omit<ActiveSpatialSound, "gain" | "cleanup">): number {
    const dx = spatial.source.x - this.listenerX;
    const dy = spatial.source.y - this.listenerY;
    const dist = Math.hypot(dx, dy);

    if (dist <= spatial.refDistance) return 1;
    if (dist >= spatial.maxDistance) return 0;

    // Linear falloff between refDistance and maxDistance.
    return 1 - (dist - spatial.refDistance) / (spatial.maxDistance - spatial.refDistance);
  }

  /** Create a proxy AudioContext that redirects `destination` to a spatial gain node. */
  private proxyContext(ctx: AudioContext, gainNode: GainNode): AudioContext {
    return new Proxy(ctx, {
      get(target, prop) {
        if (prop === "destination") return gainNode;
        const value = Reflect.get(target, prop, target);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
  }
}
