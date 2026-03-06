import type { LevelConfig } from "../types";

export const TRUCK_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7"];
export const TRUCK_NAMES = ["Truck A", "Truck B", "Truck C", "Truck D", "Truck E"];

export const LEVELS: LevelConfig[] = [
  {
    day: 1,
    time: 42,
    aisleCount: 3,
    truckCount: 2,
    robotCount: 1,
    robotCapacity: 4,
    robotSpeed: 1.5,
    totalPackages: 20,
    spawnWindow: 32,
  },
  {
    day: 2,
    time: 54,
    aisleCount: 3,
    truckCount: 2,
    robotCount: 2,
    robotCapacity: 3,
    robotSpeed: 1.5,
    totalPackages: 32,
    spawnWindow: 44,
  },
  {
    day: 3,
    time: 78,
    aisleCount: 5,
    truckCount: 4,
    robotCount: 3,
    robotCapacity: 4,
    robotSpeed: 1.5,
    totalPackages: 48,
    spawnWindow: 65,
  },
  {
    day: 4,
    time: 80,
    aisleCount: 6,
    truckCount: 4,
    robotCount: 3,
    robotCapacity: 3,
    robotSpeed: 1.5,
    totalPackages: 60,
    spawnWindow: 68,
  },
  {
    day: 5,
    time: 100,
    aisleCount: 6,
    truckCount: 5,
    robotCount: 3,
    robotCapacity: 3,
    robotSpeed: 1.5,
    totalPackages: 80,
    spawnWindow: 88,
  },
];
