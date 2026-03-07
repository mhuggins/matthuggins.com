import type { StopId, WorldState } from "../types";

interface InfoBarProps {
  world: WorldState;
}

export function InfoBar({ world }: InfoBarProps) {
  const { robots } = world;

  return (
    <div className="flex flex-col gap-2 border-gray-300 border-t-2 bg-gray-100 px-4 py-2.5 text-gray-600 text-xs">
      {/* Robot states */}
      <div className="flex flex-wrap items-center justify-evenly gap-x-4 gap-y-1">
        {robots.map((robot) => (
          <div key={robot.id} className="flex items-center justify-evenly gap-1.5">
            <span className="font-medium text-gray-700">{robot.label}</span>
            <span className="text-gray-400">
              {robot.state === "idle" ? "idle" : `→ ${getStopName(robot.targetStop, world)}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getStopName(stop: StopId | null, world: WorldState) {
  if (stop === null) {
    return "?";
  }

  const truck = world.trucks[stop];
  if (truck) {
    return truck.name;
  }

  const aisle = world.aisles[stop - world.trucks.length];
  if (aisle) {
    return `Aisle ${aisle.stop - 1}`;
  }

  return "?";
}
