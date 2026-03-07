import { cn } from "@matthuggins/ui";
import type { WorldState } from "../types";

const ROW_HEIGHT = 64;
const STOP_PANEL_WIDTH = 340;
const ROBOT_LANE_WIDTH = 72;

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
      <div className="relative shrink-0" style={{ width: STOP_PANEL_WIDTH }}>
        {/* Truck rows */}
        {trucks.map((truck) => (
          <div
            key={truck.stop}
            className="absolute right-0 left-0 flex items-center border-gray-200 border-b bg-gray-50 px-4"
            style={{ top: truck.stop * ROW_HEIGHT, height: ROW_HEIGHT }}
          >
            <span
              className="mr-2 inline-block h-3 w-3 shrink-0 rounded-full"
              style={{ background: truck.color, boxShadow: `0 0 0 2px ${truck.color}33` }}
            />
            <span className="min-w-[72px] font-semibold text-[13px] text-gray-900">
              {truck.name}
            </span>
            <span className="ml-auto text-gray-500 text-xs">
              {truck.deliveredCount > 0 ? `✓ ${truck.deliveredCount}` : ""}
            </span>
          </div>
        ))}

        {/* Divider between trucks and aisles */}
        <div
          className="absolute right-0 left-0 z-10 bg-[#d1d5db]"
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
              {aisle.waiting.slice(0, 14).map((pkg) => {
                const truck = world.trucks.find((t) => t.stop === pkg.to);
                return (
                  <div
                    key={pkg.id}
                    title={truck?.name}
                    className="h-[10px] w-[10px] rounded-[2px]"
                    style={{ background: pkg.color, border: "1px solid rgba(0,0,0,0.12)" }}
                  />
                );
              })}
              {aisle.waiting.length > 14 && (
                <span className="text-[10px] text-gray-400 leading-[10px]">
                  +{aisle.waiting.length - 14}
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
        {/* Center track */}
        <div className="-translate-x-1/2 absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-300" />

        {/* Stop markers */}
        {Array.from({ length: totalStops }, (_, i) => (
          <div
            key={i}
            className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 h-1.5 w-1.5 rounded-full bg-gray-400"
            style={{ top: i * ROW_HEIGHT + ROW_HEIGHT / 2 }}
          />
        ))}

        {/* Robots */}
        {robots.map((robot, idx) => {
          const yPx = robot.position * ROW_HEIGHT + ROW_HEIGHT / 2;
          const xOffset = idx % 2 === 0 ? -14 : 14;
          const isMoving = robot.state === "moving";
          return (
            <div
              key={robot.id}
              title={`${robot.label} | ${robot.cargo.length}/${robot.capacity} packages`}
              className="absolute left-1/2 z-10 flex flex-col items-center"
              style={{ top: yPx, transform: `translate(calc(-50% + ${xOffset}px), -50%)` }}
            >
              <div
                className={cn(
                  "box-border flex size-[26px] flex-wrap items-center justify-center gap-px rounded border-2 p-[3px] transition-colors duration-100",
                  isMoving
                    ? "border-blue-400 bg-blue-700 shadow-[0_0_6px_#60a5fa66]"
                    : "border-blue-500 bg-[#1e3a5f] shadow-none",
                )}
              >
                {robot.cargo.slice(0, 4).map((pkg) => (
                  <div
                    key={pkg.id}
                    className="size-[5px] shrink-0 rounded-[1px]"
                    style={{ background: pkg.color }}
                  />
                ))}
              </div>
              <div className="mt-0.5 max-w-8 overflow-hidden text-ellipsis whitespace-nowrap text-center text-[9px] text-gray-500">
                {robot.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info panel */}
      <div className="flex-1 border-gray-200 border-l p-3 px-4 text-gray-700 text-xs">
        <div className="mb-2 font-semibold text-[13px]">Trucks</div>
        {trucks.map((truck) => (
          <div key={truck.stop} className="mb-1 flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ background: truck.color }}
            />
            <span className="text-[11px]">
              {truck.name}: <strong>{truck.deliveredCount}</strong>
            </span>
          </div>
        ))}

        <div className="mt-3 mb-2 font-semibold text-[13px]">Robots</div>
        {robots.map((robot) => (
          <div key={robot.id} className="mb-1.5">
            <div className="font-medium text-[11px]">{robot.label}</div>
            <div className="text-[10px] text-gray-500">
              {robot.state === "idle" ? "idle" : `moving → ${robot.targetStop ?? "?"}`}
              {" | "}cargo: {robot.cargo.length}/{robot.capacity}
            </div>
            {robot.cargo.length > 0 && (
              <div className="mt-0.5 flex gap-0.5">
                {robot.cargo.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="h-2 w-2 rounded-[1px]"
                    style={{ background: pkg.color, border: "1px solid rgba(0,0,0,0.1)" }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
