import { cn } from "@matthuggins/ui";
import {
  ArrowCounterClockwiseIcon,
  CalendarBlankIcon,
  ClockIcon,
  CodeIcon,
  type Icon,
  PackageIcon,
  PauseIcon,
  PlayIcon,
  RobotIcon,
  TruckIcon,
  WarehouseIcon,
} from "@phosphor-icons/react";
import { memo, type ReactNode } from "react";
import type { GameStatus, WorldState } from "../types";
import { Button } from "./Button";

interface ControlsBarProps {
  status: GameStatus;
  speed: number;
  world: WorldState;
  canRun: boolean;
  onRun: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onEdit?: () => void;
}

export const ControlsBar = memo(function ControlsBar({
  status,
  speed,
  world,
  canRun,
  onRun,
  onPause,
  onResume,
  onReset,
  onSpeedChange,
  onEdit,
}: ControlsBarProps) {
  return (
    <div className="mb-4 flex flex-col justify-between gap-4">
      <div className="flex items-center gap-2">
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
            <Button title="Reset" onClick={onReset}>
              <ArrowCounterClockwiseIcon size={15} />
            </Button>
          )}
          {onEdit && (
            <Button onClick={onEdit} title="Edit code">
              <CodeIcon size={15} />
              Edit
            </Button>
          )}
        </div>

        {(status === "running" || status === "paused") && (
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
        )}
      </div>

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
    </div>
  );
});

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
