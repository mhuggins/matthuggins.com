import { cn } from "@matthuggins/ui";
import {
  ClockIcon,
  HandCoinsIcon,
  type Icon,
  PackageIcon,
  RobotIcon,
  TruckIcon,
  WarehouseIcon,
} from "@phosphor-icons/react";
import { memo, type ReactNode } from "react";
import type { WorldState } from "../types";
import { Tooltip } from "./Tooltip";

interface StatusBarProps {
  world: WorldState;
  className?: string;
}

export const StatusBar = memo(function StatusBar({ world, className }: StatusBarProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex flex-1 items-center gap-4 text-[13px] text-gray-700">
        <Metric icon={TruckIcon} label="Trucks">
          {world.level.truckCount}
        </Metric>
        <Metric icon={WarehouseIcon} label="Aisles">
          {world.level.aisleCount}
        </Metric>
        <Metric icon={RobotIcon} label="Robots">
          {world.level.robotCount}
        </Metric>
        <Metric icon={HandCoinsIcon} label="Robot capacity">
          {world.level.robotCapacity}
        </Metric>
      </div>
      <div className="flex items-center gap-4 text-[13px] text-gray-700">
        <Metric icon={ClockIcon} label="Time remaining">
          <strong className={cn(world.level.time - world.time <= 0 && "text-red-800")}>
            {(world.level.time - world.time).toLocaleString(undefined, {
              maximumFractionDigits: 1,
              roundingMode: "floor",
            })}
            s
          </strong>
        </Metric>
        <Metric icon={PackageIcon} label="Packages delivered">
          <strong>{world.deliveredCount}</strong> of {world.level.totalPackages}
        </Metric>
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
  <Tooltip content={label}>
    <span className={cn("flex items-center gap-1 whitespace-nowrap", className)}>
      <MetricIcon size={18} weight="regular" aria-label={label} className="text-gray-600" />
      <span>{children}</span>
    </span>
  </Tooltip>
);
