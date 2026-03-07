import type { StopId, WorldState } from "../types";
import type { CargoInfo, RobotController, WorldAPI } from "./api";

type IdleHandler = () => void;
type StopHandler = (stop: StopId) => void;

interface RobotHandlers {
  idle: IdleHandler[];
  stop: StopHandler[];
}

export class Sandbox {
  private robotHandlers = new Map<number, RobotHandlers>();
  private cargoReadyHandlers: Array<(cargo: CargoInfo) => void> = [];
  private world: WorldState | null = null;
  private errors: string[] = [];

  boot(userCode: string, world: WorldState): void {
    this.world = world;
    this.robotHandlers.clear();
    this.cargoReadyHandlers = [];
    this.errors = [];

    const robots = world.robots.map((r) => this.createRobotFacade(r.id));
    const worldApi = this.createWorldApi();
    const safeConsole = { log: (...args: unknown[]) => console.log("[user]", ...args) };

    try {
      const fn = new Function("robots", "world", "console", `${userCode}\ninit(robots, world);`);
      fn(robots, worldApi, safeConsole);
    } catch (err) {
      this.errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  getErrors(): string[] {
    return [...this.errors];
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

  fireCargoReady(cargo: CargoInfo): void {
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

  private createRobotFacade(robotId: number): RobotController {
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
      getId: () => robotId,
      getCurrentStop: (): StopId | null => {
        const robot = this.world?.robots.find((r) => r.id === robotId);
        if (!robot) {
          return null;
        }
        return Number.isInteger(robot.position) ? (robot.position as StopId) : null;
      },
      isIdle: () => {
        return this.world?.robots.find((r) => r.id === robotId)?.state === "idle";
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
      nextDeliveryStop: (): StopId | null => {
        const robot = this.world?.robots.find((r) => r.id === robotId);
        if (!robot || robot.cargo.length === 0) {
          return null;
        }
        return robot.cargo[0]!.to;
      },
      getDeliveryStops: (): StopId[] => {
        const robot = this.world?.robots.find((r) => r.id === robotId);
        if (!robot) {
          return [];
        }
        return [...new Set(robot.cargo.map((p) => p.to))];
      },
      getCargoSummary: () => {
        const robot = this.world?.robots.find((r) => r.id === robotId);
        if (!robot) {
          return { total: 0, byTruck: {} as Record<number, number> };
        }

        const byTruck: Record<number, number> = {};
        for (const pkg of robot.cargo) {
          byTruck[pkg.to] = (byTruck[pkg.to] ?? 0) + 1;
        }

        return { total: robot.cargo.length, byTruck };
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
    };
  }

  private createWorldApi(): WorldAPI {
    type AisleEntry = { stop: number; waiting: Array<{ to: number }> };

    const toAisleSummary = (aisle: AisleEntry) => ({
      stop: aisle.stop,
      waitingCount: aisle.waiting.length,
      destinations: aisle.waiting.reduce(
        (acc, p) => {
          acc[p.to] = (acc[p.to] ?? 0) + 1;
          return acc;
        },
        {} as Record<number, number>,
      ),
    });

    return {
      getTime: () => this.world?.time ?? 0,
      getAisles: () => (this.world?.aisles ?? []).map(toAisleSummary),
      getTrucks: () =>
        (this.world?.trucks ?? []).map((t) => ({ stop: t.stop, name: t.name, color: t.color })),
      getRobots: () =>
        (this.world?.robots ?? []).map((r) => ({
          id: r.id,
          currentStop: Number.isInteger(r.position) ? (r.position as StopId) : null,
          cargoCount: r.cargo.length,
          queuedStops: [...r.stopQueue],
          idle: r.state === "idle",
        })),
      getTotalWaitingCount: () =>
        (this.world?.aisles ?? []).reduce((sum, a) => sum + a.waiting.length, 0),
      getWaitingCount: (stop: number) =>
        this.world?.aisles.find((a) => a.stop === stop)?.waiting.length ?? 0,
      getBusiestAisle: () => {
        const aisles = this.world?.aisles ?? [];
        let best: AisleEntry | null = null;
        for (const a of aisles) {
          if (!best || a.waiting.length > best.waiting.length) best = a;
        }
        return best && best.waiting.length > 0 ? toAisleSummary(best) : null;
      },
      getNearestAisleWithWaiting: (fromStop: number) => {
        const aisles = (this.world?.aisles ?? []).filter((a) => a.waiting.length > 0);
        if (aisles.length === 0) return null;
        aisles.sort((a, b) => Math.abs(a.stop - fromStop) - Math.abs(b.stop - fromStop));
        return toAisleSummary(aisles[0]!);
      },
      onCargoReady: (cb: (cargo: CargoInfo) => void) => {
        this.cargoReadyHandlers.push(cb);
      },
    };
  }
}
