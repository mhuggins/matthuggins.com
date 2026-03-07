import { cn } from "@matthuggins/ui";
import { PackageIcon, RobotIcon, TruckIcon, WarningIcon } from "@phosphor-icons/react";
import type { WorldState } from "../types";

const ROW_HEIGHT = 64;
const ROBOT_LANE_WIDTH = 110;

interface Props {
  world: WorldState;
}

export function GameRenderer({ world }: Props) {
  const { trucks, aisles, robots } = world;
  const totalStops = trucks.length + aisles.length;
  const trackHeight = totalStops * ROW_HEIGHT;

  return (
    <div className="flex bg-white" style={{ minHeight: trackHeight }}>
      {/* Stop panel */}
      <div className="relative flex-1">
        {/* Truck rows */}
        {trucks.map((truck) => (
          <div
            key={truck.stop}
            className="absolute right-0 left-0 flex items-center border-gray-200 border-b bg-gray-50 px-4"
            style={{ top: truck.stop * ROW_HEIGHT, height: ROW_HEIGHT }}
          >
            <TruckIcon
              weight="fill"
              size={24}
              className="mr-2 shrink-0"
              style={{ color: truck.color }}
            />
            <span className="min-w-[72px] font-semibold text-[13px] text-gray-900">
              {truck.name}
            </span>
            {truck.deliveredCount > 0 && (
              <span className="ml-auto flex items-center gap-1 text-gray-500 text-sm">
                <PackageIcon size={24} />
                {truck.deliveredCount}
              </span>
            )}
          </div>
        ))}

        {/* Divider between trucks and aisles */}
        <div
          className="absolute right-0 left-0 z-10 bg-gray-300"
          style={{ top: trucks.length * ROW_HEIGHT, height: 3 }}
        />

        {/* Aisle rows */}
        {aisles.map((aisle, i) => (
          <div
            key={aisle.stop}
            className={cn(
              "absolute right-0 left-0 flex items-center border-gray-100 border-b px-4",
              i % 2 === 0 ? "bg-white" : "bg-[#fafafa]",
            )}
            style={{ top: aisle.stop * ROW_HEIGHT, height: ROW_HEIGHT }}
          >
            <span className="min-w-[72px] text-[13px] text-gray-700">Aisle {i + 1}</span>
            <div className="mx-2 flex flex-1 flex-wrap gap-[3px]">
              {aisle.waiting.slice(0, 16).map((pkg) => {
                const truck = world.trucks.find((t) => t.stop === pkg.to);
                return (
                  <PackageIcon
                    key={pkg.id}
                    weight="fill"
                    size={24}
                    aria-label={truck?.name}
                    style={{ color: pkg.color }}
                  />
                );
              })}
              {aisle.waiting.length > 16 && (
                <span className="text-[10px] text-gray-400 leading-[12px]">
                  +{aisle.waiting.length - 16}
                </span>
              )}
            </div>
            {aisle.waiting.length > 0 && (
              <span className="shrink-0 text-[11px] text-gray-400">{aisle.waiting.length}</span>
            )}
          </div>
        ))}
      </div>

      {/* Robot lane */}
      <div
        className="relative shrink-0 border-gray-300 border-x-2 bg-gray-100"
        style={{ width: ROBOT_LANE_WIDTH }}
      >
        {/* Robot labels header */}
        <div className="absolute top-0 right-0 left-0 z-20 flex justify-evenly border-gray-300 border-b bg-gray-200 px-1 py-0.5">
          {robots.map((robot) => (
            <span
              key={robot.id}
              className="overflow-hidden text-ellipsis whitespace-nowrap text-[9px] text-gray-500"
            >
              {robot.label}
            </span>
          ))}
        </div>

        {/* Per-robot column tracks */}
        {robots.map((robot, idx) => {
          const colCenter = ((idx + 0.5) * ROBOT_LANE_WIDTH) / robots.length;
          return (
            <div
              key={robot.id}
              className="-translate-x-1/2 absolute top-0 bottom-0 w-0.5 bg-gray-300"
              style={{ left: colCenter }}
            />
          );
        })}

        {/* Stop markers */}
        {robots.map((robot, robotIdx) => {
          const colCenter = ((robotIdx + 0.5) * ROBOT_LANE_WIDTH) / robots.length;
          return Array.from({ length: totalStops }, (_, i) => (
            <div
              key={`${robot.id}-${i}`}
              className="-translate-x-1/2 -translate-y-1/2 absolute h-1.5 w-1.5 rounded-full bg-gray-400"
              style={{ left: colCenter, top: i * ROW_HEIGHT + ROW_HEIGHT / 2 }}
            />
          ));
        })}

        {/* Robots */}
        {robots.map((robot, idx) => {
          const colWidth = ROBOT_LANE_WIDTH / robots.length;
          const colCenter = (idx + 0.5) * colWidth;
          const iconSize = Math.min(32, Math.floor(colWidth * 0.55));
          const yPx = robot.position * ROW_HEIGHT + ROW_HEIGHT / 2;

          // Group cargo by color, preserving insertion order of first occurrence
          const cargoGroups: { color: string; count: number }[] = [];
          const seen = new Map<string, number>();
          for (const pkg of robot.cargo) {
            const existing = seen.get(pkg.color);
            if (existing !== undefined) {
              cargoGroups[existing]!.count++;
            } else {
              seen.set(pkg.color, cargoGroups.length);
              cargoGroups.push({ color: pkg.color, count: 1 });
            }
          }

          const atCapacity = robot.cargo.length >= robot.capacity;

          return (
            <div
              key={robot.id}
              title={`${robot.label} | ${robot.cargo.length}/${robot.capacity} packages`}
              className="-translate-x-1/2 -translate-y-1/2 absolute z-10"
              style={{ left: colCenter, top: yPx, width: iconSize, height: iconSize }}
            >
              {atCapacity && (
                <div className="-translate-x-1/2 absolute bottom-full left-1/2 pb-0.5">
                  <WarningIcon weight="fill" size={12} className="text-red-500" />
                </div>
              )}
              <RobotIcon
                weight="duotone"
                size={iconSize}
                className="text-[#1e3a5f] transition-colors duration-100"
              />
              {cargoGroups.length > 0 && (
                <div className="-translate-x-1/2 absolute top-full left-1/2 mt-0.5 flex flex-wrap justify-center gap-x-1.5 gap-y-0.5 rounded bg-white/80 px-1 py-0.5 shadow-sm ring-1 ring-gray-200">
                  {cargoGroups.map(({ color, count }) => (
                    <span key={color} className="flex items-center gap-[3px]">
                      <PackageIcon size={14} weight="fill" style={{ color }} />
                      <span className="font-medium text-gray-600 text-sm leading-none">
                        {count}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
