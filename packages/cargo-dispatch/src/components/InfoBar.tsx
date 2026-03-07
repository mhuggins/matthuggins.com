import { PackageIcon } from "@phosphor-icons/react";
import type { WorldState } from "../types";

interface InfoBarProps {
  world: WorldState;
}

export function InfoBar({ world }: InfoBarProps) {
  const { robots } = world;

  return (
    <div className="flex flex-col gap-2 border-gray-300 border-t-2 px-4 py-2.5 text-gray-600 text-xs">
      {/* Robot states */}
      <div className="flex flex-wrap items-center justify-evenly gap-x-4 gap-y-1">
        {robots.map((robot) => {
          // Group cargo by color in arrival order
          const cargoGroups: { color: string; count: number }[] = [];
          const seen = new Map<string, number>();
          for (const pkg of robot.cargo) {
            const i = seen.get(pkg.color);
            if (i !== undefined) {
              cargoGroups[i]!.count++;
            } else {
              seen.set(pkg.color, cargoGroups.length);
              cargoGroups.push({ color: pkg.color, count: 1 });
            }
          }

          return (
            <div key={robot.id} className="flex items-center justify-evenly gap-1.5">
              <span className="font-medium text-gray-700">{robot.label}</span>
              <span className="text-gray-400">
                {robot.state === "idle" ? "idle" : `→ stop ${robot.targetStop ?? "?"}`}
              </span>
              {cargoGroups.length > 0 && (
                <span className="flex items-center gap-[3px]">
                  {cargoGroups.map(({ color, count }) => (
                    <span key={color} className="flex items-center gap-[1px]">
                      <PackageIcon size={14} weight="fill" style={{ color }} />
                      <span className="text-gray-500">{count}</span>
                    </span>
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
