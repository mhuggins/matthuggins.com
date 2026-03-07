import { cn } from "@matthuggins/ui";
import {
  ArrowCounterClockwiseIcon,
  CalendarBlankIcon,
  ClockIcon,
  Icon,
  PackageIcon,
  PauseIcon,
  PlayIcon,
  RobotIcon,
  TruckIcon,
  WarehouseIcon,
} from "@phosphor-icons/react";
import { ReactNode } from "react";
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
    <div className="mb-4 flex flex-col justify-between gap-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2">
          {(status === "idle" || status === "completed") && (
            <button
              onClick={onRun}
              disabled={!canRun}
              className={cn(
                "flex items-center gap-1.5 rounded-md border-none px-4 py-1.5 font-semibold text-[13px] text-white",
                canRun ? "cursor-pointer bg-blue-600" : "cursor-default bg-blue-300",
              )}
            >
              <PlayIcon weight="fill" size={13} />
              Run
            </button>
          )}
          {status === "running" && (
            <button
              onClick={onPause}
              className="flex cursor-pointer items-center gap-1.5 rounded-md border-none bg-amber-400 px-4 py-1.5 font-semibold text-[13px] text-white"
            >
              <PauseIcon weight="fill" size={13} />
              Pause
            </button>
          )}
          {status === "paused" && (
            <button
              onClick={onResume}
              className="flex cursor-pointer items-center gap-1.5 rounded-md border-none bg-blue-600 px-4 py-1.5 font-semibold text-[13px] text-white"
            >
              <PlayIcon weight="fill" size={13} />
              Resume
            </button>
          )}
          {status !== "idle" && (
            <button
              onClick={onReset}
              title="Reset"
              className="flex cursor-pointer items-center rounded-md border border-gray-300 bg-gray-100 px-2.5 py-1.5 text-gray-700"
            >
              <ArrowCounterClockwiseIcon size={15} />
            </button>
          )}
        </div>

        {(status === "running" || status === "paused") && (
          <div className="flex items-center gap-1.5">
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
      </div>

      {world && (
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-4 text-[13px] text-gray-700">
            <Metric icon={CalendarBlankIcon} label="Day number">
              Day <strong>{world.level.day}</strong>
            </Metric>
            <Metric icon={RobotIcon} label="Robots">
              {world.level.robotCount}
            </Metric>
            <Metric icon={WarehouseIcon} label="Aisles">
              {world.level.aisleCount}
            </Metric>
            <Metric icon={TruckIcon} label="Trucks">
              {world.level.truckCount}
            </Metric>
          </div>
          <div className="flex items-center gap-4 text-[13px] text-gray-700">
            <Metric icon={ClockIcon} label="Time remaining">
              <strong className={cn(world.level.time - world.time <= 0 && "text-red-800")}>
                {(world.level.time - world.time).toFixed(1)}s
              </strong>
            </Metric>
            <Metric icon={PackageIcon} label="Packages delivered">
              <strong>{world.deliveredCount}</strong> of {world.level.totalPackages}
            </Metric>
          </div>
        </div>
      )}
    </div>
  );
}

const Metric = ({
  icon: MetricIcon,
  label,
  children,
  className,
}: {
  icon: Icon;
  label: string;
  children: ReactNode;
  className?: string;
}) => (
  <span title={label} className={cn("flex items-center gap-1 whitespace-nowrap", className)}>
    <MetricIcon size={18} weight="regular" aria-label={label} className="text-gray-600" />
    <span>{children}</span>
  </span>
);
