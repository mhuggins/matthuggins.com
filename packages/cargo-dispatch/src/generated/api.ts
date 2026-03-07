// AUTO-GENERATED — do not edit manually.
// Source: packages/cargo-dispatch/src/lib/api.ts
// Regenerated automatically by the type-generator Vite plugin.

export const GAME_API_TYPES = `/**
 * Player-facing API types — single source of truth.
 *
 * This file is compiled to a .d.ts ambient declaration string by
 * scripts/generate-api-types.ts, which writes the result to api-types.ts
 * for injection into the Monaco editor. Do not import internal simulation
 * types here; keep it self-contained so the emitted .d.ts has no imports.
 */
declare type StopId = number;
declare interface AisleSummary {
    readonly stop: StopId;
    readonly waitingCount: number;
    /** Package count per destination truck stop. */
    readonly destinations: Record<StopId, number>;
}
declare interface TruckSummary {
    readonly stop: StopId;
    readonly name: string;
    readonly color: string;
}
declare interface RobotSummary {
    readonly id: number;
    readonly currentStop: StopId | null;
    readonly cargoCount: number;
    readonly queuedStops: StopId[];
    readonly idle: boolean;
}
declare interface CargoInfo {
    /** The aisle stop where the cargo spawned. */
    readonly aisle: StopId;
    /** The truck stop this cargo needs to be delivered to. */
    readonly destination: StopId;
}
declare interface CargoSummary {
    readonly total: number;
    /** Package count per destination truck stop. */
    readonly byTruck: Record<StopId, number>;
}
declare interface RobotController {
    /** Called when the robot has no queued stops and is ready for work. */
    onIdle(callback: () => void): void;
    /** Called after the robot arrives at a stop and auto pickup/dropoff completes. */
    onStop(callback: (stop: StopId) => void): void;
    /** Queue a stop to visit. If idle, the robot begins moving immediately. */
    goTo(stop: StopId): void;
    /** Remove all future queued stops. */
    clearQueue(): void;
    /** Unique robot id. */
    getId(): number;
    /** Current stop if exactly aligned, otherwise null. */
    getCurrentStop(): StopId | null;
    /** Whether the robot has no queued stops. */
    isIdle(): boolean;
    /** Whether the robot is carrying any packages. */
    hasCargo(): boolean;
    /** Number of packages currently onboard. */
    getCargoCount(): number;
    /** Maximum packages the robot can carry. */
    getCapacity(): number;
    /** Remaining cargo slots. */
    getAvailableCapacity(): number;
    /** Next truck stop to deliver to, or null if no cargo. */
    nextDeliveryStop(): StopId | null;
    /** All unique truck stops with cargo onboard. */
    getDeliveryStops(): StopId[];
    /** Onboard cargo grouped by destination truck stop. */
    getCargoSummary(): CargoSummary;
    /** Currently queued stops (not including the in-progress target). */
    getQueuedStops(): StopId[];
    /** Set a display label shown on the robot in the UI. */
    setLabel(text: string): void;
}
declare interface WorldAPI {
    /** Current simulation time in seconds. */
    getTime(): number;
    /** All aisles in the level. */
    getAisles(): AisleSummary[];
    /** All trucks in the level. */
    getTrucks(): TruckSummary[];
    /** Read-only summaries of all robots. */
    getRobots(): RobotSummary[];
    /** Total waiting packages across all aisles. */
    getTotalWaitingCount(): number;
    /** Waiting package count at a specific stop. */
    getWaitingCount(stop: StopId): number;
    /** Aisle with the highest waiting package count, or null if none waiting. */
    getBusiestAisle(): AisleSummary | null;
    /** Nearest aisle with waiting packages relative to fromStop, or null. */
    getNearestAisleWithWaiting(fromStop: StopId): AisleSummary | null;
    /** Called whenever new cargo spawns into an aisle — useful for waking idle robots. */
    onCargoReady(callback: (cargo: CargoInfo) => void): void;
}
/** Entry point — define this function in your strategy. */
declare type PlayerInit = (robots: RobotController[], world: WorldAPI) => void;`;
