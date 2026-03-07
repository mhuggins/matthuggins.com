import { cn } from "@matthuggins/ui";
import type { WorldState } from "../types";

type GameStatus = "idle" | "running" | "paused" | "completed";

interface ControlsBarProps {
  status: GameStatus;
  speed: number;
  world: WorldState | null;
  canRun: boolean;
  onRun: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

export function ControlsBar({
  status,
  speed,
  world,
  canRun,
  onRun,
  onPause,
  onResume,
  onReset,
  onSpeedChange,
}: ControlsBarProps) {
  return (
    <div className="mb-4 flex items-center gap-2">
      {(status === "idle" || status === "completed") && (
        <button
          onClick={onRun}
          disabled={!canRun}
          className={cn(
            "rounded-md border-none px-4 py-1.5 font-semibold text-[13px] text-white",
            canRun ? "cursor-pointer bg-blue-600" : "cursor-default bg-blue-300",
          )}
        >
          ▶ Run
        </button>
      )}
      {status === "running" && (
        <button
          onClick={onPause}
          className="cursor-pointer rounded-md border-none bg-amber-400 px-4 py-1.5 font-semibold text-[13px] text-white"
        >
          ⏸ Pause
        </button>
      )}
      {status === "paused" && (
        <button
          onClick={onResume}
          className="cursor-pointer rounded-md border-none bg-blue-600 px-4 py-1.5 font-semibold text-[13px] text-white"
        >
          ▶ Resume
        </button>
      )}
      {status !== "idle" && (
        <button
          onClick={onReset}
          className="cursor-pointer rounded-md border border-gray-300 bg-gray-100 px-3 py-1.5 text-[13px] text-gray-700"
        >
          ↺ Reset
        </button>
      )}

      {(status === "running" || status === "paused") && (
        <div className="ml-2 flex items-center gap-1.5">
          <span className="text-gray-500 text-xs">Speed:</span>
          {[0.5, 1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={cn(
                "cursor-pointer rounded border px-2 py-0.5 text-xs",
                speed === s
                  ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
                  : "border-gray-300 bg-gray-100 text-gray-700",
              )}
            >
              {s}&#x00d7;
            </button>
          ))}
        </div>
      )}

      {world && (
        <div className="ml-auto text-[13px] text-gray-700">
          <span className="mr-4">
            <strong>{world.time.toFixed(1)}s</strong>
          </span>
          <span>
            {world.deliveredCount}/{world.level.totalPackages} delivered
          </span>
          {world.spawnedCount < world.level.totalPackages && (
            <span className="ml-3 text-gray-500 text-xs">({world.spawnedCount} spawned)</span>
          )}
        </div>
      )}
    </div>
  );
}
