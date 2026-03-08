import { TRUCK_COLORS, TRUCK_NAMES } from "../constants/level";
import type { AisleData, LevelConfig, RobotData, TruckData, WorldState } from "../types";
import { randNext } from "./rng";

export function createWorld(level: LevelConfig): WorldState {
  const trucks: TruckData[] = Array.from({ length: level.trucks.count }, (_, i) => ({
    stop: i,
    name: TRUCK_NAMES[i] ?? `Truck ${i + 1}`,
    color: TRUCK_COLORS[i] ?? "#6b7280",
    deliveredCount: 0,
  }));

  const aisles: AisleData[] = Array.from({ length: level.aisles.count }, (_, i) => ({
    stop: level.trucks.count + i,
    waiting: [],
  }));

  const stops = [...trucks.map((t) => t.stop), ...aisles.map((a) => a.stop)];
  const startStop = aisles[0]?.stop ?? level.trucks.count;

  const robots: RobotData[] = Array.from({ length: level.robots.count }, (_, i) => ({
    id: i,
    position: startStop,
    targetStop: null,
    stopQueue: [],
    direction: 0,
    speed: level.robots.speed,
    capacity: level.robots.capacity,
    cargo: [],
    state: "idle",
    label: `Bot ${i + 1}`,
  }));

  // Use a seeded PRNG so every run of the same level has identical spawn timing.
  const rng = { rngState: level.seed };
  const slotDuration = level.packages.spawnWindow / level.packages.count;
  const spawnSchedule = Array.from(
    { length: level.packages.count },
    (_, i) => i * slotDuration + randNext(rng) * slotDuration,
  );

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
    spawnSchedule,
    nextPackageId: 0,
    completedAt: null,
    rngState: rng.rngState,
  };
}
