import { describe, expect, it } from "vitest";
import type { GamePackage, LevelConfig, WorldState } from "../types";
import { createWorld } from "./createWorld";
import { Sandbox } from "./Sandbox";
import { updateWorld } from "./updateWorld";

// --- helpers ---

const TEST_LEVEL: LevelConfig = {
  day: 1,
  time: 60,
  aisleCount: 2,
  truckCount: 2,
  robotCount: 2,
  robotCapacity: 4,
  robotSpeed: 10, // fast so robots reach stops quickly in tests
  totalPackages: 10,
  spawnWindow: 50,
};

// truck stops: 0, 1  |  aisle stops: 2, 3
function makeWorld(): WorldState {
  const world = createWorld(TEST_LEVEL);
  // Push all spawns far into the future so they don't interfere
  world.spawnSchedule = world.spawnSchedule.map(() => 9999);
  return world;
}

let nextId = 0;

function makePackage(origin: number, destination: number, color = "#ef4444"): GamePackage {
  return {
    id: nextId++,
    origin,
    destination,
    color,
    createdAt: 0,
    pickedUpAt: null,
    deliveredAt: null,
  };
}

function addPackageToAisle(
  world: WorldState,
  aisleIndex: number,
  destination: number,
): GamePackage {
  const aisle = world.aisles[aisleIndex]!;
  const pkg = makePackage(aisle.stop, destination);
  aisle.waiting.push(pkg);
  world.packages.push(pkg);
  return pkg;
}

function boot(world: WorldState, code: string): Sandbox {
  const sandbox = new Sandbox();
  sandbox.boot(code, world);
  return sandbox;
}

// --- robot controller ---

describe("robot.getId", () => {
  it("returns the correct robot id", () => {
    const world = makeWorld();
    boot(
      world,
      `function init(robots) {
        robots[0].goTo(robots[0].getId()); // getId() === 0, stop 0 is valid
      }`,
    );
    expect(world.robots[0]!.stopQueue).toContain(0);
  });
});

describe("robot.getCurrentStop", () => {
  it("returns stop id when robot is at an integer position", () => {
    const world = makeWorld();
    // robots start at aisle[0].stop = 2 (integer)
    // getCurrentStop() === 2, so goTo(2) queues stop 2
    boot(
      world,
      `function init(robots) {
        const stop = robots[0].getCurrentStop();
        if (stop !== null) robots[0].goTo(stop);
      }`,
    );
    expect(world.robots[0]!.stopQueue).toContain(2);
  });

  it("returns null when robot is between stops", () => {
    const world = makeWorld();
    world.robots[0]!.position = 2.5; // mid-travel
    boot(
      world,
      `function init(robots) {
        const stop = robots[0].getCurrentStop();
        if (stop !== null) robots[0].goTo(stop); // should NOT be called
      }`,
    );
    expect(world.robots[0]!.stopQueue).toHaveLength(0);
  });
});

describe("robot.isIdle / robot.isMoving", () => {
  it("robot starts idle and not moving", () => {
    const world = makeWorld();
    boot(
      world,
      `function init(robots) {
        const idle = robots[0].isIdle();
        const notMoving = !robots[0].isMoving();
        if (idle) robots[0].goTo(0);
        if (notMoving) robots[0].goTo(1);
      }`,
    );
    expect(world.robots[0]!.stopQueue).toEqual([0, 1]);
  });

  it("isMoving returns true after goTo is called on idle robot", () => {
    const world = makeWorld();
    boot(
      world,
      `function init(robots) {
        robots[0].goTo(0);
        if (robots[0].isMoving()) robots[1].goTo(0); // signal via robot[1]
      }`,
    );
    expect(world.robots[1]!.stopQueue).toContain(0);
  });

  it("isIdle returns false after goTo", () => {
    const world = makeWorld();
    boot(
      world,
      `function init(robots) {
        robots[0].goTo(0);
        if (!robots[0].isIdle()) robots[1].goTo(0); // signal via robot[1]
      }`,
    );
    expect(world.robots[1]!.stopQueue).toContain(0);
  });
});

describe("robot.clearQueue", () => {
  it("removes all queued stops", () => {
    const world = makeWorld();
    boot(
      world,
      `function init(robots) {
        robots[0].goTo(0);
        robots[0].goTo(1);
        robots[0].clearQueue();
      }`,
    );
    expect(world.robots[0]!.stopQueue).toHaveLength(0);
  });
});

describe("robot.getQueuedStops", () => {
  it("returns a copy of the current queue", () => {
    const world = makeWorld();
    boot(
      world,
      `function init(robots) {
        robots[0].goTo(0);
        robots[0].goTo(1);
        // queue a third stop only if getQueuedStops() sees 2
        if (robots[0].getQueuedStops().length === 2) robots[0].goTo(0);
      }`,
    );
    expect(world.robots[0]!.stopQueue).toEqual([0, 1, 0]);
  });
});

describe("robot.setLabel", () => {
  it("sets the robot label", () => {
    const world = makeWorld();
    boot(world, `function init(robots) { robots[0].setLabel("Hauler"); }`);
    expect(world.robots[0]!.label).toBe("Hauler");
  });

  it("truncates labels longer than 20 characters", () => {
    const world = makeWorld();
    boot(world, `function init(robots) { robots[0].setLabel("This label is way too long"); }`);
    expect(world.robots[0]!.label).toBe("This label is way to");
  });
});

describe("robot.hasCargo / getCargoCount / getCapacity / getAvailableCapacity", () => {
  it("hasCargo returns false when no cargo", () => {
    const world = makeWorld();
    boot(
      world,
      `function init(robots) {
        if (!robots[0].hasCargo()) robots[0].goTo(0);
      }`,
    );
    expect(world.robots[0]!.stopQueue).toContain(0);
  });

  it("hasCargo returns true after pickUp", () => {
    const world = makeWorld();
    world.robots[0]!.position = world.aisles[0]!.stop;
    addPackageToAisle(world, 0, 0);
    boot(
      world,
      `function init(robots) {
        robots[0].pickUp();
        if (robots[0].hasCargo()) robots[0].goTo(0);
      }`,
    );
    expect(world.robots[0]!.stopQueue).toContain(0);
  });

  it("getCargoCount and getAvailableCapacity are consistent", () => {
    const world = makeWorld();
    world.robots[0]!.position = world.aisles[0]!.stop;
    addPackageToAisle(world, 0, 0);
    addPackageToAisle(world, 0, 1);
    boot(
      world,
      `function init(robots) {
        robots[0].pickUp();
        const count = robots[0].getCargoCount();       // 2
        const avail = robots[0].getAvailableCapacity(); // 4 - 2 = 2
        for (let i = 0; i < count; i++) robots[0].goTo(0);
        for (let i = 0; i < avail; i++) robots[0].goTo(1);
      }`,
    );
    // 2 zeros + 2 ones
    expect(world.robots[0]!.stopQueue).toEqual([0, 0, 1, 1]);
  });

  it("getCapacity returns the robot capacity", () => {
    const world = makeWorld();
    boot(
      world,
      `function init(robots) {
        const cap = robots[0].getCapacity();
        for (let i = 0; i < cap; i++) robots[0].goTo(0);
      }`,
    );
    expect(world.robots[0]!.stopQueue).toHaveLength(TEST_LEVEL.robotCapacity);
  });
});

describe("robot.pickUp", () => {
  it("picks up packages from the current aisle up to capacity", () => {
    const world = makeWorld();
    const aisle = world.aisles[0]!;
    world.robots[0]!.position = aisle.stop;
    for (let i = 0; i < 6; i++) addPackageToAisle(world, 0, 0); // 6 packages, capacity 4

    boot(world, `function init(robots) { robots[0].pickUp(); }`);

    expect(world.robots[0]!.cargo).toHaveLength(4);
    expect(aisle.waiting).toHaveLength(2);
  });

  it("does nothing when robot is not at an aisle", () => {
    const world = makeWorld();
    world.robots[0]!.position = 0; // truck stop
    addPackageToAisle(world, 0, 1);

    boot(world, `function init(robots) { robots[0].pickUp(); }`);

    expect(world.robots[0]!.cargo).toHaveLength(0);
  });

  it("respects a filter predicate", () => {
    const world = makeWorld();
    const aisle = world.aisles[0]!;
    world.robots[0]!.position = aisle.stop;
    const p1 = makePackage(aisle.stop, 0, "#ef4444");
    const p2 = makePackage(aisle.stop, 1, "#3b82f6");
    const p3 = makePackage(aisle.stop, 0, "#ef4444");
    aisle.waiting.push(p1, p2, p3);
    world.packages.push(p1, p2, p3);

    boot(
      world,
      `function init(robots) {
        robots[0].pickUp((pkg) => pkg.destination === 0);
      }`,
    );

    expect(world.robots[0]!.cargo).toHaveLength(2);
    expect(world.robots[0]!.cargo.every((p) => p.destination === 0)).toBe(true);
    expect(aisle.waiting).toHaveLength(1);
    expect(aisle.waiting[0]!.destination).toBe(1);
  });
});

describe("robot.dropOff", () => {
  it("delivers cargo destined for the current truck stop", () => {
    const world = makeWorld();
    const truck = world.trucks[0]!;
    world.robots[0]!.position = truck.stop;
    const pkg = makePackage(world.aisles[0]!.stop, truck.stop);
    pkg.pickedUpAt = 1;
    world.robots[0]!.cargo.push(pkg);
    world.packages.push(pkg);

    boot(world, `function init(robots) { robots[0].dropOff(); }`);

    expect(world.robots[0]!.cargo).toHaveLength(0);
    expect(truck.deliveredCount).toBe(1);
    expect(world.deliveredCount).toBe(1);
    expect(pkg.deliveredAt).not.toBeNull();
  });

  it("leaves cargo for other trucks untouched", () => {
    const world = makeWorld();
    const truck0 = world.trucks[0]!;
    const truck1 = world.trucks[1]!;
    world.robots[0]!.position = truck0.stop;
    const pkgFor0 = makePackage(world.aisles[0]!.stop, truck0.stop);
    const pkgFor1 = makePackage(world.aisles[0]!.stop, truck1.stop);
    pkgFor0.pickedUpAt = pkgFor1.pickedUpAt = 1;
    world.robots[0]!.cargo.push(pkgFor0, pkgFor1);

    boot(world, `function init(robots) { robots[0].dropOff(); }`);

    expect(world.robots[0]!.cargo).toHaveLength(1);
    expect(world.robots[0]!.cargo[0]!.destination).toBe(truck1.stop);
    expect(truck0.deliveredCount).toBe(1);
  });

  it("does nothing when robot is not at a truck stop", () => {
    const world = makeWorld();
    world.robots[0]!.position = world.aisles[0]!.stop;
    const pkg = makePackage(world.aisles[0]!.stop, world.trucks[0]!.stop);
    pkg.pickedUpAt = 1;
    world.robots[0]!.cargo.push(pkg);

    boot(world, `function init(robots) { robots[0].dropOff(); }`);

    expect(world.robots[0]!.cargo).toHaveLength(1);
    expect(world.trucks[0]!.deliveredCount).toBe(0);
  });
});

describe("robot.nextDeliveryStop / getDeliveryStops / getCargoSummary", () => {
  it("nextDeliveryStop returns null when no cargo", () => {
    const world = makeWorld();
    boot(
      world,
      `function init(robots) {
        if (robots[0].nextDeliveryStop() === null) robots[0].goTo(0);
      }`,
    );
    expect(world.robots[0]!.stopQueue).toContain(0);
  });

  it("nextDeliveryStop returns first cargo destination", () => {
    const world = makeWorld();
    const pkg = makePackage(world.aisles[0]!.stop, 1);
    pkg.pickedUpAt = 1;
    world.robots[0]!.cargo.push(pkg);

    boot(
      world,
      `function init(robots) {
        robots[0].goTo(robots[0].nextDeliveryStop());
      }`,
    );
    expect(world.robots[0]!.stopQueue).toContain(1);
  });

  it("getDeliveryStops returns unique truck stops", () => {
    const world = makeWorld();
    const p1 = makePackage(world.aisles[0]!.stop, 0);
    const p2 = makePackage(world.aisles[0]!.stop, 0);
    const p3 = makePackage(world.aisles[0]!.stop, 1);
    p1.pickedUpAt = p2.pickedUpAt = p3.pickedUpAt = 1;
    world.robots[0]!.cargo.push(p1, p2, p3);

    boot(
      world,
      `function init(robots) {
        robots[0].getDeliveryStops().forEach(s => robots[0].goTo(s));
      }`,
    );
    expect(world.robots[0]!.stopQueue).toHaveLength(2);
    expect(world.robots[0]!.stopQueue).toContain(0);
    expect(world.robots[0]!.stopQueue).toContain(1);
  });

  it("getCargoSummary reflects total and destinations", () => {
    const world = makeWorld();
    const p1 = makePackage(world.aisles[0]!.stop, 0);
    const p2 = makePackage(world.aisles[0]!.stop, 0);
    const p3 = makePackage(world.aisles[0]!.stop, 1);
    p1.pickedUpAt = p2.pickedUpAt = p3.pickedUpAt = 1;
    world.robots[0]!.cargo.push(p1, p2, p3);

    boot(
      world,
      `function init(robots) {
        const s = robots[0].getCargoSummary();
        for (let i = 0; i < s.total; i++) robots[0].goTo(0);        // 3 times
        for (let i = 0; i < s.destinations[0]; i++) robots[0].goTo(1); // 2 times
      }`,
    );
    expect(world.robots[0]!.stopQueue).toHaveLength(5);
  });
});

describe("robot.onIdle", () => {
  it("fires when triggered via sandbox.fireRobotIdle", () => {
    const world = makeWorld();
    const sandbox = new Sandbox();
    sandbox.boot(
      `function init(robots) {
        robots[0].onIdle(() => { robots[0].goTo(1); });
      }`,
      world,
    );
    sandbox.fireRobotIdle(0);
    expect(world.robots[0]!.stopQueue).toContain(1);
  });

  it("fires via updateWorld when robot arrives and queue empties", () => {
    const world = makeWorld();
    const sandbox = new Sandbox();
    sandbox.boot(
      `function init(robots) {
        robots[0].onIdle(() => { robots[0].goTo(0); });
      }`,
      world,
    );

    // Queue robot to travel to stop 0 (truck)
    world.robots[0]!.stopQueue.push(0);
    world.robots[0]!.state = "moving";

    // Tick until robot arrives (speed=10, distance=2 stops, 0.3s is enough)
    for (let i = 0; i < 10; i++) {
      updateWorld(world, 0.05, (e) => {
        if (e.type === "robotIdle") {
          sandbox.fireRobotIdle(e.robotId);
        }
        if (e.type === "robotStop") {
          sandbox.fireRobotStop(e.robotId, e.stop);
        }
      });
    }

    expect(world.robots[0]!.stopQueue).toContain(0);
  });
});

describe("robot.onStop", () => {
  it("fires with the stop id when triggered", () => {
    const world = makeWorld();
    const sandbox = new Sandbox();
    sandbox.boot(
      `function init(robots) {
        robots[0].onStop((stop) => { robots[0].goTo(stop); });
      }`,
      world,
    );
    sandbox.fireRobotStop(0, 1);
    expect(world.robots[0]!.stopQueue).toContain(1);
  });
});

// --- world API ---

describe("world.getTime", () => {
  it("returns the current world time", () => {
    const world = makeWorld();
    world.time = 7;
    boot(
      world,
      `function init(robots, world) {
        const t = world.getTime();
        for (let i = 0; i < t; i++) robots[0].goTo(0);
      }`,
    );
    expect(world.robots[0]!.stopQueue).toHaveLength(7);
  });
});

describe("world.getAisles", () => {
  it("returns aisle summaries with correct stop ids", () => {
    const world = makeWorld();
    boot(
      world,
      `function init(robots, world) {
        world.getAisles().forEach(a => robots[0].goTo(a.stop));
      }`,
    );
    expect(world.robots[0]!.stopQueue).toEqual([2, 3]);
  });

  it("includes waiting package counts", () => {
    const world = makeWorld();
    addPackageToAisle(world, 0, 0);
    addPackageToAisle(world, 0, 1);
    boot(
      world,
      `function init(robots, world) {
        const count = world.getAisles()[0].waitingCount;
        for (let i = 0; i < count; i++) robots[0].goTo(0);
      }`,
    );
    expect(world.robots[0]!.stopQueue).toHaveLength(2);
  });
});

describe("world.getTrucks", () => {
  it("returns truck summaries with correct stop ids", () => {
    const world = makeWorld();
    boot(
      world,
      `function init(robots, world) {
        world.getTrucks().forEach(t => robots[0].goTo(t.stop));
      }`,
    );
    expect(world.robots[0]!.stopQueue).toEqual([0, 1]);
  });
});

describe("world.getRobots", () => {
  it("returns summaries for all robots", () => {
    const world = makeWorld();
    boot(
      world,
      `function init(robots, world) {
        const rs = world.getRobots();
        for (let i = 0; i < rs.length; i++) robots[0].goTo(0);
      }`,
    );
    expect(world.robots[0]!.stopQueue).toHaveLength(2);
  });

  it("includes idle=true and moving=false for a freshly created robot", () => {
    const world = makeWorld();
    boot(
      world,
      `function init(robots, world) {
        const r = world.getRobots()[0];
        if (r.idle) robots[0].goTo(0);
        if (!r.moving) robots[0].goTo(1);
      }`,
    );
    expect(world.robots[0]!.stopQueue).toEqual([0, 1]);
  });

  it("reflects moving=true after goTo", () => {
    const world = makeWorld();
    boot(
      world,
      `function init(robots, world) {
        robots[1].goTo(0);
        if (world.getRobots()[1].moving) robots[0].goTo(0);
      }`,
    );
    expect(world.robots[0]!.stopQueue).toContain(0);
  });
});

describe("world.getTotalWaitingCount / getWaitingCount", () => {
  it("getTotalWaitingCount sums across all aisles", () => {
    const world = makeWorld();
    addPackageToAisle(world, 0, 0);
    addPackageToAisle(world, 0, 1);
    addPackageToAisle(world, 1, 0);
    boot(
      world,
      `function init(robots, world) {
        const total = world.getTotalWaitingCount();
        for (let i = 0; i < total; i++) robots[0].goTo(0);
      }`,
    );
    expect(world.robots[0]!.stopQueue).toHaveLength(3);
  });

  it("getWaitingCount returns count for a specific aisle stop", () => {
    const world = makeWorld();
    const aisleStop = world.aisles[0]!.stop;
    addPackageToAisle(world, 0, 0);
    addPackageToAisle(world, 0, 1);
    boot(
      world,
      `function init(robots, world) {
        const count = world.getWaitingCount(${aisleStop});
        for (let i = 0; i < count; i++) robots[0].goTo(0);
      }`,
    );
    expect(world.robots[0]!.stopQueue).toHaveLength(2);
  });

  it("getWaitingCount returns 0 for a truck stop", () => {
    const world = makeWorld();
    boot(
      world,
      `function init(robots, world) {
        const count = world.getWaitingCount(0);
        for (let i = 0; i < count; i++) robots[0].goTo(0);
      }`,
    );
    expect(world.robots[0]!.stopQueue).toHaveLength(0);
  });
});

describe("world.getBusiestAisle", () => {
  it("returns null when no packages are waiting", () => {
    const world = makeWorld();
    boot(
      world,
      `function init(robots, world) {
        if (world.getBusiestAisle() === null) robots[0].goTo(0);
      }`,
    );
    expect(world.robots[0]!.stopQueue).toContain(0);
  });

  it("returns the aisle with the most waiting packages", () => {
    const world = makeWorld();
    addPackageToAisle(world, 0, 0); // aisle[0]: 1 pkg
    addPackageToAisle(world, 1, 0); // aisle[1]: 3 pkgs
    addPackageToAisle(world, 1, 0);
    addPackageToAisle(world, 1, 1);
    boot(
      world,
      `function init(robots, world) {
        const busiest = world.getBusiestAisle();
        if (busiest) robots[0].goTo(busiest.stop);
      }`,
    );
    expect(world.robots[0]!.stopQueue).toContain(world.aisles[1]!.stop);
  });
});

describe("world.getNearestAisleWithWaiting", () => {
  it("returns null when no aisles have waiting packages", () => {
    const world = makeWorld();
    boot(
      world,
      `function init(robots, world) {
        if (world.getNearestAisleWithWaiting(0) === null) robots[0].goTo(0);
      }`,
    );
    expect(world.robots[0]!.stopQueue).toContain(0);
  });

  it("returns the nearest aisle relative to fromStop", () => {
    const world = makeWorld();
    // aisle stops: 2 and 3; from stop 3, nearest with packages is aisle[1] (stop 3)
    addPackageToAisle(world, 0, 0); // stop 2
    addPackageToAisle(world, 1, 0); // stop 3
    boot(
      world,
      `function init(robots, world) {
        const nearest = world.getNearestAisleWithWaiting(3);
        if (nearest) robots[0].goTo(nearest.stop);
      }`,
    );
    expect(world.robots[0]!.stopQueue).toContain(3);
  });
});

describe("world.getWaitingPackages", () => {
  it("returns packages at the given aisle stop", () => {
    const world = makeWorld();
    const aisle = world.aisles[0]!;
    addPackageToAisle(world, 0, 0);
    addPackageToAisle(world, 0, 1);
    boot(
      world,
      `function init(robots, world) {
        world.getWaitingPackages(${aisle.stop}).forEach(p => robots[0].goTo(p.destination));
      }`,
    );
    expect(world.robots[0]!.stopQueue).toEqual([0, 1]);
  });

  it("returns empty array for a non-aisle stop", () => {
    const world = makeWorld();
    boot(
      world,
      `function init(robots, world) {
        const pkgs = world.getWaitingPackages(0); // truck stop
        for (let i = 0; i < pkgs.length; i++) robots[0].goTo(0);
      }`,
    );
    expect(world.robots[0]!.stopQueue).toHaveLength(0);
  });
});

describe("world.onCargoReady", () => {
  it("fires callback with aisle and destination when triggered", () => {
    const world = makeWorld();
    const sandbox = new Sandbox();
    sandbox.boot(
      `function init(robots, world) {
        world.onCargoReady((cargo) => {
          robots[0].goTo(cargo.aisle);
          robots[0].goTo(cargo.destination);
        });
      }`,
      world,
    );
    const aisleStop = world.aisles[0]!.stop;
    sandbox.fireCargoReady({ aisle: aisleStop, destination: 1 });
    expect(world.robots[0]!.stopQueue).toEqual([aisleStop, 1]);
  });
});

// --- sandbox lifecycle ---

describe("Sandbox lifecycle", () => {
  it("re-booting resets handlers from the previous boot", () => {
    const world = makeWorld();
    const sandbox = new Sandbox();

    // First boot registers an onIdle handler
    sandbox.boot(
      `function init(robots) {
        robots[0].onIdle(() => { robots[0].goTo(0); });
      }`,
      world,
    );
    sandbox.fireRobotIdle(0);
    expect(world.robots[0]!.stopQueue).toContain(0);

    // Clear queue then re-boot with different handler
    world.robots[0]!.stopQueue = [];
    world.robots[0]!.state = "idle";
    sandbox.boot(
      `function init(robots) {
        robots[0].onIdle(() => { robots[0].goTo(1); });
      }`,
      world,
    );
    sandbox.fireRobotIdle(0);

    // Should only see stop 1, not stop 0 from the old handler
    expect(world.robots[0]!.stopQueue).toEqual([1]);
  });

  it("multiple onIdle registrations all fire", () => {
    const world = makeWorld();
    const sandbox = new Sandbox();
    sandbox.boot(
      `function init(robots) {
        robots[0].onIdle(() => { robots[0].goTo(0); });
        robots[0].onIdle(() => { robots[0].goTo(1); });
      }`,
      world,
    );
    sandbox.fireRobotIdle(0);
    expect(world.robots[0]!.stopQueue).toEqual([0, 1]);
  });

  it("handlers for different robots are independent", () => {
    const world = makeWorld();
    const sandbox = new Sandbox();
    sandbox.boot(
      `function init(robots) {
        robots[0].onIdle(() => { robots[0].goTo(0); });
        robots[1].onIdle(() => { robots[1].goTo(1); });
      }`,
      world,
    );

    sandbox.fireRobotIdle(0);
    expect(world.robots[0]!.stopQueue).toEqual([0]);
    expect(world.robots[1]!.stopQueue).toHaveLength(0); // robot[1] not fired yet

    sandbox.fireRobotIdle(1);
    expect(world.robots[1]!.stopQueue).toEqual([1]);
    expect(world.robots[0]!.stopQueue).toEqual([0]); // unchanged
  });

  it("firing idle for one robot does not trigger another robot's handler", () => {
    const world = makeWorld();
    const sandbox = new Sandbox();
    sandbox.boot(
      `function init(robots) {
        robots[1].onIdle(() => { robots[1].goTo(0); });
      }`,
      world,
    );

    sandbox.fireRobotIdle(0); // fire for robot 0, not robot 1
    expect(world.robots[1]!.stopQueue).toHaveLength(0);
  });
});

// --- goTo limits ---

describe("robot.goTo queue cap", () => {
  it("silently ignores goTo calls beyond 10 queued stops", () => {
    const world = makeWorld();
    boot(
      world,
      `function init(robots) {
        for (let i = 0; i < 15; i++) robots[0].goTo(0);
      }`,
    );
    expect(world.robots[0]!.stopQueue).toHaveLength(10);
  });
});

// --- error handling ---

describe("Sandbox error handling", () => {
  it("captures runtime errors thrown from init", () => {
    const world = makeWorld();
    const sandbox = boot(world, `function init() { throw new Error("oops"); }`);
    expect(sandbox.getErrors()).toHaveLength(1);
    expect(sandbox.getErrors()[0]).toContain("oops");
  });

  it("captures errors thrown inside onIdle handler", () => {
    const world = makeWorld();
    const sandbox = new Sandbox();
    sandbox.boot(
      `function init(robots) {
        robots[0].onIdle(() => { throw new Error("idle error"); });
      }`,
      world,
    );
    sandbox.fireRobotIdle(0);
    expect(sandbox.getErrors().some((e) => e.includes("idle error"))).toBe(true);
  });

  it("captures errors thrown inside onStop handler", () => {
    const world = makeWorld();
    const sandbox = new Sandbox();
    sandbox.boot(
      `function init(robots) {
        robots[0].onStop(() => { throw new Error("stop error"); });
      }`,
      world,
    );
    sandbox.fireRobotStop(0, 0);
    expect(sandbox.getErrors().some((e) => e.includes("stop error"))).toBe(true);
  });

  it("clearErrors resets the error list", () => {
    const world = makeWorld();
    const sandbox = boot(world, `function init() { throw new Error("boom"); }`);
    expect(sandbox.getErrors()).toHaveLength(1);
    sandbox.clearErrors();
    expect(sandbox.getErrors()).toHaveLength(0);
  });

  it("ignores goTo with an invalid stop id, no error thrown", () => {
    const world = makeWorld();
    const sandbox = boot(
      world,
      `function init(robots) {
        robots[0].goTo(999); // not a valid stop
      }`,
    );
    expect(world.robots[0]!.stopQueue).toHaveLength(0);
    expect(sandbox.getErrors()).toHaveLength(0);
  });
});
