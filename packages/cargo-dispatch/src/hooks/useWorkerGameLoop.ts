import { useCallback, useEffect, useRef } from "react";
import type { WorkerInbound, WorkerOutbound, WorldState } from "../types";
import { useStableRef } from "./useStableRef";

export function useWorkerGameLoop(options: {
  speed: number;
  onBootResult: (errors: string[]) => void;
  onTickResult: (world: WorldState, errors: string[], completed: boolean) => void;
  onTimeout: () => void;
}): {
  boot: (code: string, world: WorldState) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
} {
  const workerRef = useRef<Worker | null>(null);
  const rafRef = useRef<number | null>(null);
  const bootTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);
  const speedRef = useStableRef(options.speed);
  const onBootResultRef = useStableRef(options.onBootResult);
  const onTickResultRef = useStableRef(options.onTickResult);
  const onTimeoutRef = useStableRef(options.onTimeout);

  // tick is stored in a ref so RAF callbacks always call the latest version
  const tickFnRef = useRef<FrameRequestCallback>(() => {});

  const stop = useCallback(() => {
    isRunningRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (bootTimeoutRef.current !== null) {
      clearTimeout(bootTimeoutRef.current);
      bootTimeoutRef.current = null;
    }
    if (tickTimeoutRef.current !== null) {
      clearTimeout(tickTimeoutRef.current);
      tickTimeoutRef.current = null;
    }
    workerRef.current?.terminate();
    workerRef.current = null;
    lastTimeRef.current = null;
  }, []);

  const pause = useCallback(() => {
    isRunningRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (tickTimeoutRef.current !== null) {
      clearTimeout(tickTimeoutRef.current);
      tickTimeoutRef.current = null;
    }
  }, []);

  const resume = useCallback(() => {
    isRunningRef.current = true;
    lastTimeRef.current = null; // avoid dt spike after pause
    rafRef.current = requestAnimationFrame(tickFnRef.current);
  }, []);

  // Update tick fn each render — reads refs so always fresh
  tickFnRef.current = (timestamp: number) => {
    if (lastTimeRef.current === null) {
      lastTimeRef.current = timestamp;
    }
    const rawDt = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    const deltaTime = Math.min(rawDt, 0.1) * speedRef.current;

    workerRef.current?.postMessage({ type: "tick", deltaTime } satisfies WorkerInbound);

    if (tickTimeoutRef.current !== null) {
      clearTimeout(tickTimeoutRef.current);
    }
    tickTimeoutRef.current = setTimeout(() => {
      tickTimeoutRef.current = null;
      workerRef.current?.terminate();
      workerRef.current = null;
      isRunningRef.current = false;
      onTimeoutRef.current();
    }, 500);
  };

  const boot = useCallback(
    (code: string, world: WorldState) => {
      if (typeof Worker === "undefined") return;

      stop();

      const worker = new Worker(new URL("../lib/worker.ts", import.meta.url), {
        type: "module",
      });
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent<WorkerOutbound>) => {
        const msg = e.data;

        if (msg.type === "bootResult") {
          if (bootTimeoutRef.current !== null) {
            clearTimeout(bootTimeoutRef.current);
            bootTimeoutRef.current = null;
          }
          onBootResultRef.current(msg.errors);
        } else if (msg.type === "tickResult") {
          if (tickTimeoutRef.current !== null) {
            clearTimeout(tickTimeoutRef.current);
            tickTimeoutRef.current = null;
          }
          onTickResultRef.current(msg.world, msg.errors, msg.completed);
          if (isRunningRef.current) {
            rafRef.current = requestAnimationFrame(tickFnRef.current);
          }
        }
      };

      worker.onerror = () => {
        workerRef.current?.terminate();
        workerRef.current = null;
        isRunningRef.current = false;
        onTimeoutRef.current();
      };

      bootTimeoutRef.current = setTimeout(() => {
        bootTimeoutRef.current = null;
        workerRef.current?.terminate();
        workerRef.current = null;
        isRunningRef.current = false;
        onTimeoutRef.current();
      }, 5000);

      worker.postMessage({ type: "boot", code, world } satisfies WorkerInbound);
    },
    [stop, onTimeoutRef, onTickResultRef, onBootResultRef],
  );

  useEffect(() => {
    return stop;
  }, [stop]);

  return { boot, pause, resume, stop };
}
