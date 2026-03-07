import type { AisleData, LevelConfig, RobotData, TruckData, WorldState } from "../types";
import { TRUCK_COLORS, TRUCK_NAMES } from "./level";

export function createWorld(level: LevelConfig): WorldState {
  const trucks: TruckData[] = Array.from({ length: level.truckCount }, (_, i) => ({
    stop: i,
    name: TRUCK_NAMES[i] ?? `Truck ${i + 1}`,
    color: TRUCK_COLORS[i] ?? "#6b7280",
    deliveredCount: 0,
  }));

  const aisles: AisleData[] = Array.from({ length: level.aisleCount }, (_, i) => ({
    stop: level.truckCount + i,
    waiting: [],
  }));

  const stops = [...trucks.map((t) => t.stop), ...aisles.map((a) => a.stop)];
  const startStop = aisles[0]?.stop ?? level.truckCount;

  const robots: RobotData[] = Array.from({ length: level.robotCount }, (_, i) => ({
    id: i,
    position: startStop,
    targetStop: null,
    stopQueue: [],
    direction: 0,
    speed: level.robotSpeed,
    capacity: level.robotCapacity,
    cargo: [],
    state: "idle",
    label: `Bot ${i + 1}`,
  }));

  return {
    time: 0,
    stops,
    aisles,
    trucks,
    robots,
    packages: [],
    spawnedCount: 0,
    deliveredCount: 0,
    level,
    nextSpawnIn: 0,
    nextPackageId: 0,
    completedAt: null,
  };
}
