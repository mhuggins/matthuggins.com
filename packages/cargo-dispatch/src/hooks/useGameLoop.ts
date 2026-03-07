import { useCallback, useEffect, useRef } from "react";
import { useStableRef } from "./useStableRef";

/**
 * Manages a requestAnimationFrame loop.
 *
 * @param speed - Simulation speed multiplier (e.g. 1, 2, 4).
 * @param onTick - Called each frame with the scaled delta time in seconds.
 *   Return true to continue the loop, false to stop it.
 */
export function useGameLoop(speed: number, onTick: (dt: number) => boolean) {
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const speedRef = useStableRef(speed);
  const onTickRef = useStableRef(onTick);

  const tick = useCallback(
    (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const rawDt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const dt = Math.min(rawDt, 0.1) * speedRef.current;
      const shouldContinue = onTickRef.current(dt);

      if (shouldContinue) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    },
    [onTickRef, speedRef],
  );

  const start = useCallback(() => {
    lastTimeRef.current = null;
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastTimeRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return { start, pause, resume: start, stop };
}
