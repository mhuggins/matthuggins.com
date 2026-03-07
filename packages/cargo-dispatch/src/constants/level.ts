import type { LevelConfig } from "../types";

export const TRUCK_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7"];
export const TRUCK_NAMES = ["Truck A", "Truck B", "Truck C", "Truck D", "Truck E"];

export const LEVELS: LevelConfig[] = [
  {
    day: 1,
    time: 45,
    aisleCount: 3,
    truckCount: 2,
    robotCount: 1,
    robotCapacity: 4,
    robotSpeed: 1.5,
    totalPackages: 20,
    spawnInterval: [1.5, 3.0],
  },
  {
    day: 2,
    time: 60,
    aisleCount: 5,
    truckCount: 3,
    robotCount: 2,
    robotCapacity: 4,
    robotSpeed: 1.5,
    totalPackages: 32,
    spawnInterval: [1.2, 2.8],
  },
  {
    day: 3,
    time: 90,
    aisleCount: 5,
    truckCount: 4,
    robotCount: 3,
    robotCapacity: 4,
    robotSpeed: 1.5,
    totalPackages: 48,
    spawnInterval: [0.9, 2.2],
  },
  {
    day: 4,
    time: 90,
    aisleCount: 6,
    truckCount: 4,
    robotCount: 3,
    robotCapacity: 3,
    robotSpeed: 1.5,
    totalPackages: 60,
    spawnInterval: [0.7, 1.8],
  },
  {
    day: 5,
    time: 120,
    aisleCount: 6,
    truckCount: 5,
    robotCount: 3,
    robotCapacity: 4,
    robotSpeed: 1.5,
    totalPackages: 80,
    spawnInterval: [0.6, 1.5],
  },
];
