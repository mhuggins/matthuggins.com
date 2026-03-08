export type StopId = number;
export type Direction = -1 | 0 | 1;
export type RobotState = "idle" | "moving";
export type StarRating = "bronze" | "silver" | "gold";
export type CompletionTime = Record<StarRating, number>;

export interface GamePackage {
  id: number;
  origin: StopId;
  destination: StopId;
  color: string;
  createdAt: number;
  pickedUpAt: number | null;
  deliveredAt: number | null;
}

export interface RobotData {
  id: number;
  position: number;
  targetStop: StopId | null;
  stopQueue: StopId[];
  direction: Direction;
  speed: number;
  capacity: number;
  cargo: GamePackage[];
  state: RobotState;
  label: string;
}

export interface AisleData {
  stop: StopId;
  waiting: GamePackage[];
}

export interface TruckData {
  stop: StopId;
  name: string;
  color: string;
  deliveredCount: number;
}

export interface LevelConfig {
  day: number;
  /** Seed for the deterministic PRNG — same seed means identical spawns every run. */
  seed: number;
  completionTime: CompletionTime;
  aisles: { count: number };
  trucks: { count: number };
  robots: { count: number; capacity: number; speed: number };
  packages: { count: number; spawnWindow: number };
}

export interface WorldState {
  time: number;
  stops: StopId[];
  aisles: AisleData[];
  trucks: TruckData[];
  robots: RobotData[];
  packages: GamePackage[];
  spawnedCount: number;
  deliveredCount: number;
  level: LevelConfig;
  spawnSchedule: number[];
  nextPackageId: number;
  completedAt: number | null;
  /** Current state of the deterministic PRNG — mutated each time a random value is drawn. */
  rngState: number;
}

export type GameStatus = "idle" | "running" | "paused" | "completed";

export type WorkerInbound =
  | { type: "boot"; code: string; world: WorldState }
  | { type: "tick"; deltaTime: number };

export type WorkerOutbound =
  | { type: "bootResult"; errors: string[] }
  | { type: "tickResult"; world: WorldState; errors: string[]; completed: boolean };
