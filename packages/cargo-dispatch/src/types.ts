export type StopId = number;
export type Direction = -1 | 0 | 1;
export type RobotState = "idle" | "moving";

export interface GamePackage {
  id: number;
  from: StopId;
  to: StopId;
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
  aisleCount: number;
  truckCount: number;
  robotCount: number;
  robotCapacity: number;
  robotSpeed: number;
  totalPackages: number;
  spawnInterval: [number, number];
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
  nextSpawnIn: number;
  nextPackageId: number;
  completedAt: number | null;
}
