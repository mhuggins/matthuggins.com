import type { LevelConfig } from "../types";

export const TRUCK_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7"];
export const TRUCK_NAMES = ["Truck A", "Truck B", "Truck C", "Truck D", "Truck E"];

export const LEVELS: LevelConfig[] = [
  {
    day: 1,
    seed: 0x4a3d_3d6e,
    completionTime: { bronze: 40, silver: 30, gold: 20 },
    aisles: { count: 3 },
    trucks: { count: 2 },
    robots: { count: 1, capacity: 4, speed: 1.5 },
    packages: { count: 20, spawnWindow: 27 },
  },
  {
    day: 2,
    seed: 0x7c8b_9a0e,
    completionTime: { bronze: 46, silver: 43, gold: 40 },
    aisles: { count: 3 },
    trucks: { count: 2 },
    robots: { count: 2, capacity: 3, speed: 1.5 },
    packages: { count: 32, spawnWindow: 38 },
  },
  {
    day: 3,
    seed: 0x1f5c_3d8b,
    completionTime: { bronze: 75, silver: 70, gold: 65 },
    aisles: { count: 5 },
    trucks: { count: 4 },
    robots: { count: 3, capacity: 4, speed: 1.5 },
    packages: { count: 48, spawnWindow: 54 },
  },
  {
    day: 4,
    seed: 0x8e2a_6f4c,
    completionTime: { bronze: 85, silver: 80, gold: 75 },
    aisles: { count: 6 },
    trucks: { count: 4 },
    robots: { count: 3, capacity: 3, speed: 1.5 },
    packages: { count: 60, spawnWindow: 57 },
  },
  {
    day: 5,
    seed: 0xb3d7_1e92,
    completionTime: { bronze: 110, silver: 105, gold: 100 },
    aisles: { count: 6 },
    trucks: { count: 5 },
    robots: { count: 3, capacity: 3, speed: 1.5 },
    packages: { count: 80, spawnWindow: 73 },
  },
];
