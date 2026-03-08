import { cn } from "@matthuggins/ui";
import { ArrowCounterClockwiseIcon, CodeIcon, PauseIcon, PlayIcon } from "@phosphor-icons/react";
import { memo } from "react";
import type { GameStatus } from "../types";
import { Button } from "./Button";
import { Tooltip } from "./Tooltip";

interface ControlsBarProps {
  status: GameStatus;
  speed: number;
  canRun: boolean;
  onRun: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onEdit?: () => void;
  className?: string;
}

export const ControlsBar = memo(function ControlsBar({
  status,
  speed,
  canRun,
  onRun,
  onPause,
  onResume,
  onReset,
  onSpeedChange,
  onEdit,
  className,
}: ControlsBarProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex flex-1 items-stretch gap-2">
        {(status === "idle" || status === "completed") && (
          <Button intent="primary" onClick={onRun} disabled={!canRun}>
            <PlayIcon weight="fill" size={13} />
            Run
          </Button>
        )}
        {status === "running" && (
          <Button
            intent="primary"
            onClick={onPause}
            className="bg-amber-400 text-white disabled:bg-amber-200"
          >
            <PauseIcon weight="fill" size={13} />
            Pause
          </Button>
        )}
        {status === "paused" && (
          <Button intent="primary" onClick={onResume}>
            <PlayIcon weight="fill" size={13} />
            Resume
          </Button>
        )}
        {status !== "idle" && (
          <Tooltip content="Reset">
            <Button onClick={onReset}>
              <ArrowCounterClockwiseIcon size={15} />
            </Button>
          </Tooltip>
        )}
        {onEdit && (
          <Button onClick={onEdit} title="Edit code">
            <CodeIcon size={15} />
            Edit
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-gray-500 text-xs">Speed:</span>
        {[0.5, 1, 2, 4].map((s) => (
          <Button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={cn(
              "px-2 py-0.5 text-xs",
              speed === s && "bg-[#1e3a5f] text-white ring-[#1e3a5f]",
            )}
          >
            {s}&#x00d7;
          </Button>
        ))}
      </div>
    </div>
  );
});
