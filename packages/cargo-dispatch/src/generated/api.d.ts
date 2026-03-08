// AUTO-GENERATED — do not edit manually.
// Source: packages/cargo-dispatch/src/lib/api.ts
// Regenerated automatically by the type-generator Vite plugin.

/**
 * Player-facing API types — single source of truth.
 *
 * This file is compiled to a .d.ts ambient declaration string by
 * scripts/generate-api-types.ts, which writes the result to generated/api.ts
 * for injection into the Monaco editor. Do not import internal simulation
 * types here; keep it self-contained so the emitted .d.ts has no imports.
 */
declare type StopId = number;
declare interface Aisle {
    readonly id: StopId;
    getWaitingCount(): number;
    /** Package count per destination truck stop. */
    getDestinations(): Record<StopId, number>;
    getWaitingPackages(): WaitingPackage[];
}
declare interface Truck {
    readonly id: StopId;
    readonly name: string;
    readonly color: string;
}
declare interface CargoInfo {
    /** The aisle where the cargo spawned. */
    readonly aisle: Aisle;
    /** The truck stop this cargo needs to be delivered to. */
    readonly destination: StopId;
}
declare interface WaitingPackage {
    /** The truck stop this package needs to be delivered to. */
    readonly destination: StopId;
    readonly color: string;
}
declare interface CargoSummary {
    readonly total: number;
    /** Package count per destination truck stop. */
    readonly destinations: Record<StopId, number>;
}
declare interface Robot {
    /** Unique robot id. */
    readonly id: number;
    /** Called when the robot has no queued stops and is ready for work. */
    onIdle(callback: () => void): void;
    /** Called after the robot arrives at a stop. Call dropOff() and/or pickUp() here. */
    onStop(callback: (stop: StopId) => void): void;
    /** Queue a stop to visit. If idle, the robot begins moving immediately. */
    goTo(stop: StopId): void;
    /** Remove all future queued stops. */
    clearQueue(): void;
    /** Current stop if exactly aligned, otherwise null. */
    getCurrentStop(): StopId | null;
    /** Whether the robot has no queued stops. */
    isIdle(): boolean;
    /** Whether the robot is currently traveling between stops. */
    isMoving(): boolean;
    /** The stop the robot is currently traveling toward, or null if idle. */
    getTargetStop(): StopId | null;
    /** Whether the robot is carrying any packages. */
    hasCargo(): boolean;
    /** Number of packages currently onboard. */
    getCargoCount(): number;
    /** Maximum packages the robot can carry. */
    getCapacity(): number;
    /** Remaining cargo slots. */
    getAvailableCapacity(): number;
    /** Next truck stop to deliver to, or null if no cargo. */
    getNextDeliveryStop(): StopId | null;
    /** All unique truck stops with cargo onboard. */
    getDeliveryStops(): StopId[];
    /** Onboard cargo grouped by destination truck stop. */
    getCargoSummary(): CargoSummary;
    /** Currently queued stops (not including the in-progress target). */
    getQueuedStops(): StopId[];
    /** Set a display label shown on the robot in the UI. */
    setLabel(text: string): void;
    /**
     * Drop off all cargo destined for the current stop (if it's a truck stop).
     * Does nothing if the robot is not at a truck stop.
     */
    dropOff(): void;
    /**
     * Pick up packages from the current stop (if it's an aisle), up to remaining capacity.
     * An optional filter predicate lets you selectively pick up packages by color, destination, etc.
     */
    pickUp(filter?: (pkg: WaitingPackage) => boolean): void;
}
declare interface WorldAPI {
    /** Current simulation time in seconds. */
    getTime(): number;
    /** All aisles in the level. */
    getAisles(): Aisle[];
    /** All trucks in the level. */
    getTrucks(): Truck[];
    /** All robots in the level. */
    getRobots(): Robot[];
    /** Total waiting packages across all aisles. */
    getWaitingCount(): number;
    /** Aisle with the highest waiting package count, or null if none waiting. */
    getBusiestAisle(): Aisle | null;
    /** Nearest aisle with waiting packages relative to fromStop, or null. */
    getNearestAisleWithWaiting(fromStop: StopId): Aisle | null;
    /** Called whenever new cargo spawns into an aisle — useful for waking idle robots. */
    onCargoReady(callback: (cargo: CargoInfo) => void): void;
}
/** Entry point — define this function in your strategy. */
declare type PlayerInit = (world: WorldAPI) => void;
