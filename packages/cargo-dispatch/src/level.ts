import type { LevelConfig } from "./types.js";

export const TRUCK_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7"];
export const TRUCK_NAMES = ["Truck A", "Truck B", "Truck C", "Truck D", "Truck E"];

export const LEVEL_1: LevelConfig = {
  aisleCount: 5,
  truckCount: 3,
  robotCount: 2,
  robotCapacity: 4,
  robotSpeed: 1.5,
  totalPackages: 30,
  spawnInterval: [1.0, 2.5],
};
