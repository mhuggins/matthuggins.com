import type { AisleData, StopId, WorldState } from "../types";
import type { Aisle, CargoInfo, Robot, WaitingPackage, WorldAPI } from "./api";

const toAisle = (aisle: AisleData): Aisle => ({
  get id() {
    return aisle.stop;
  },
  getWaitingCount: () => aisle.waiting.length,
  getDestinations: () =>
    aisle.waiting.reduce(
      (acc, p) => {
        acc[p.destination] = (acc[p.destination] ?? 0) + 1;
        return acc;
      },
      {} as Record<StopId, number>,
    ),
  getWaitingPackages: () =>
    aisle.waiting.map((p) => ({ destination: p.destination, color: p.color })),
});

type IdleHandler = () => void;
type StopHandler = (stop: StopId) => void;

interface RobotHandlers {
  idle: IdleHandler[];
  stop: StopHandler[];
}

export class Sandbox {
  private robotHandlers = new Map<number, RobotHandlers>();
  private cargoReadyHandlers: Array<(cargo: CargoInfo) => void> = [];
  private robotFacades: Robot[] = [];
  private world: WorldState | null = null;
  private errors: string[] = [];

  boot(userCode: string, world: WorldState): void {
    this.world = world;
    this.robotHandlers.clear();
    this.cargoReadyHandlers = [];
    this.robotFacades = world.robots.map((r) => this.createRobotFacade(r.id));
    this.errors = [];

    const worldApi = this.createWorldApi();
    const safeConsole = { log: (...args: unknown[]) => console.log("[user]", ...args) };

    try {
      const fn = new Function("world", "console", `${userCode}\ninit(world);`);
      fn(worldApi, safeConsole);
    } catch (err) {
      this.errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  getErrors(): string[] {
    return [...this.errors];
  }

  clearErrors() {
    this.errors = [];
  }

  fireRobotIdle(robotId: number): void {
    const handlers = this.robotHandlers.get(robotId);
    if (!handlers) return;
    for (const handler of handlers.idle) {
      try {
        handler();
      } catch (err) {
        this.errors.push(`onIdle error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  fireRobotStop(robotId: number, stop: StopId): void {
    const handlers = this.robotHandlers.get(robotId);
    if (!handlers) {
      return;
    }
    for (const handler of handlers.stop) {
      try {
        handler(stop);
      } catch (err) {
        this.errors.push(`onStop error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  fireCargoReady(event: { aisle: StopId; destination: StopId }): void {
    const aisleEntry = this.world?.aisles.find((a) => a.stop === event.aisle);
    if (!aisleEntry) return;
    const cargo: CargoInfo = { aisle: toAisle(aisleEntry), destination: event.destination };
    for (const handler of this.cargoReadyHandlers) {
      try {
        handler(cargo);
      } catch (err) {
        this.errors.push(`onCargoReady error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  private getHandlers(robotId: number): RobotHandlers {
    let handlers = this.robotHandlers.get(robotId);
    if (!handlers) {
      handlers = { idle: [], stop: [] };
      this.robotHandlers.set(robotId, handlers);
    }
    return handlers;
  }

  private createRobotFacade(robotId: number): Robot {
    return {
      onIdle: (cb: IdleHandler) => {
        this.getHandlers(robotId).idle.push(cb);
      },
      onStop: (cb: StopHandler) => {
        this.getHandlers(robotId).stop.push(cb);
      },
      goTo: (stop: number) => {
        const world = this.world;
        if (!world) {
          return;
        }

        const robot = world.robots.find((r) => r.id === robotId);
        if (!robot) {
          return;
        }
        if (!Number.isInteger(stop) || !world.stops.includes(stop)) {
          return;
        }
        if (robot.stopQueue.length >= 10) {
          return;
        }

        robot.stopQueue.push(stop);

        if (robot.state === "idle") {
          robot.state = "moving";
        }
      },
      clearQueue: () => {
        const robot = this.world?.robots.find((r) => r.id === robotId);
        if (robot) {
          robot.stopQueue = [];
        }
      },
      get id() {
        return robotId;
      },
      getCurrentStop: (): StopId | null => {
        const robot = this.world?.robots.find((r) => r.id === robotId);
        if (!robot) {
          return null;
        }
        return Number.isInteger(robot.position) ? robot.position : null;
      },
      isIdle: () => {
        return this.world?.robots.find((r) => r.id === robotId)?.state === "idle";
      },
      isMoving: () => {
        return this.world?.robots.find((r) => r.id === robotId)?.state === "moving";
      },
      getTargetStop: (): StopId | null => {
        return this.world?.robots.find((r) => r.id === robotId)?.targetStop ?? null;
      },
      hasCargo: () => {
        return (this.world?.robots.find((r) => r.id === robotId)?.cargo.length ?? 0) > 0;
      },
      getCargoCount: () => {
        return this.world?.robots.find((r) => r.id === robotId)?.cargo.length ?? 0;
      },
      getCapacity: () => {
        return this.world?.robots.find((r) => r.id === robotId)?.capacity ?? 0;
      },
      getAvailableCapacity: () => {
        const robot = this.world?.robots.find((r) => r.id === robotId);
        return robot ? robot.capacity - robot.cargo.length : 0;
      },
      getNextDeliveryStop: (): StopId | null => {
        const robot = this.world?.robots.find((r) => r.id === robotId);
        if (!robot || robot.cargo.length === 0) {
          return null;
        }
        return robot.cargo[0]!.destination;
      },
      getDeliveryStops: (): StopId[] => {
        const robot = this.world?.robots.find((r) => r.id === robotId);
        if (!robot) {
          return [];
        }
        return [...new Set(robot.cargo.map((p) => p.destination))];
      },
      getCargoSummary: () => {
        const robot = this.world?.robots.find((r) => r.id === robotId);
        if (!robot) {
          return { total: 0, destinations: {} };
        }

        const destinations: Record<StopId, number> = {};
        for (const pkg of robot.cargo) {
          destinations[pkg.destination] = (destinations[pkg.destination] ?? 0) + 1;
        }

        return { total: robot.cargo.length, destinations };
      },
      getQueuedStops: (): StopId[] => {
        return [...(this.world?.robots.find((r) => r.id === robotId)?.stopQueue ?? [])];
      },
      setLabel: (text: string) => {
        const robot = this.world?.robots.find((r) => r.id === robotId);
        if (robot) {
          robot.label = String(text).slice(0, 20);
        }
      },
      dropOff: () => {
        const world = this.world;
        const robot = world?.robots.find((r) => r.id === robotId);
        if (!world || !robot) return;
        const stop = Number.isInteger(robot.position) ? robot.position : null;
        if (stop === null) return;
        const truck = world.trucks.find((t) => t.stop === stop);
        if (!truck) return;
        const toDeliver = robot.cargo.filter((p) => p.destination === stop);
        for (const pkg of toDeliver) {
          pkg.deliveredAt = world.time;
          truck.deliveredCount++;
          world.deliveredCount++;
        }
        robot.cargo = robot.cargo.filter((p) => p.destination !== stop);
      },
      pickUp: (filter?: (pkg: WaitingPackage) => boolean) => {
        const world = this.world;
        const robot = world?.robots.find((r) => r.id === robotId);
        if (!world || !robot) return;
        const stop = Number.isInteger(robot.position) ? robot.position : null;
        if (stop === null) return;
        const aisle = world.aisles.find((a) => a.stop === stop);
        if (!aisle || aisle.waiting.length === 0) return;
        const available = robot.capacity - robot.cargo.length;
        if (available <= 0) return;
        let picked = 0;
        const remaining: typeof aisle.waiting = [];
        for (const pkg of aisle.waiting) {
          if (picked < available) {
            const wp: WaitingPackage = { destination: pkg.destination, color: pkg.color };
            if (!filter || filter(wp)) {
              pkg.pickedUpAt = world.time;
              robot.cargo.push(pkg);
              picked++;
              continue;
            }
          }
          remaining.push(pkg);
        }
        aisle.waiting = remaining;
      },
    };
  }

  private createWorldApi(): WorldAPI {
    return {
      getTime: () => this.world?.time ?? 0,
      getAisles: () => (this.world?.aisles ?? []).map(toAisle),
      getTrucks: () =>
        (this.world?.trucks ?? []).map((t) => ({
          get id() {
            return t.stop;
          },
          name: t.name,
          color: t.color,
        })),
      getRobots: () => [...this.robotFacades],
      getWaitingCount: () =>
        (this.world?.aisles ?? []).reduce((sum, a) => sum + a.waiting.length, 0),
      getBusiestAisle: () => {
        const aisles = this.world?.aisles ?? [];
        let best: AisleData | null = null;
        for (const a of aisles) {
          if (!best || a.waiting.length > best.waiting.length) best = a;
        }
        return best && best.waiting.length > 0 ? toAisle(best) : null;
      },
      getNearestAisleWithWaiting: (fromStop: number) => {
        const aisles = (this.world?.aisles ?? []).filter((a) => a.waiting.length > 0);
        if (aisles.length === 0) return null;
        aisles.sort((a, b) => Math.abs(a.stop - fromStop) - Math.abs(b.stop - fromStop));
        return toAisle(aisles[0]!);
      },
      onCargoReady: (cb: (cargo: CargoInfo) => void) => {
        this.cargoReadyHandlers.push(cb);
      },
    };
  }
}
