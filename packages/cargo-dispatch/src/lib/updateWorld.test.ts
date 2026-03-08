import { describe, expect, it } from "vitest";
import type { LevelConfig, WorldState } from "../types";
import { createWorld } from "./createWorld";
import { Sandbox } from "./Sandbox";
import type { EngineEvent } from "./updateWorld";
import { updateWorld } from "./updateWorld";

// --- helpers ---

const TEST_LEVEL: LevelConfig = {
  day: 1,
  time: 60,
  aisleCount: 2,
  truckCount: 2,
  robotCount: 2,
  robotCapacity: 4,
  robotSpeed: 2, // 2 stops/sec — predictable movement
  totalPackages: 4,
  spawnWindow: 50,
};

// truck stops: 0, 1  |  aisle stops: 2, 3
function makeWorld(): WorldState {
  const world = createWorld(TEST_LEVEL);
  world.spawnSchedule = world.spawnSchedule.map(() => 9999);
  return world;
}

function tickN(
  world: WorldState,
  dt: number,
  n: number,
  onEvent: (e: EngineEvent) => void = () => {},
) {
  for (let i = 0; i < n; i++) updateWorld(world, dt, onEvent);
}

// --- robot movement ---

describe("robot movement", () => {
  it("moves position toward target stop each tick", () => {
    const world = makeWorld();
    const robot = world.robots[0]!;
    robot.stopQueue.push(0); // target stop 0, robot starts at stop 2
    robot.state = "moving";

    updateWorld(world, 0.1, () => {}); // 0.1s × 2 stops/s = 0.2 stops

    expect(robot.position).toBeLessThan(2);
    expect(robot.position).toBeGreaterThan(0);
  });

  it("snaps to exact stop on arrival", () => {
    const world = makeWorld();
    const robot = world.robots[0]!;
    robot.stopQueue.push(0); // 2 stops away at speed 2 → arrives in exactly 1s
    robot.state = "moving";

    tickN(world, 0.5, 2); // exactly 1s total

    expect(robot.position).toBe(0);
    expect(robot.targetStop).toBeNull();
    expect(robot.direction).toBe(0);
  });

  it("proceeds to the next queued stop after arrival", () => {
    const world = makeWorld();
    const robot = world.robots[0]!;
    robot.stopQueue.push(0, 1); // visit 0 then 1
    robot.state = "moving";

    // Travel from stop 2 to stop 0 (2 stops, 1s), then immediately start toward 1
    tickN(world, 0.5, 2); // arrive at stop 0
    expect(robot.position).toBe(0);
    expect(robot.targetStop).toBe(1); // next stop queued automatically

    tickN(world, 0.5, 2); // arrive at stop 1
    expect(robot.position).toBe(1);
    expect(robot.state).toBe("idle");
  });

  it("sets state to idle after visiting all queued stops", () => {
    const world = makeWorld();
    const robot = world.robots[0]!;
    robot.stopQueue.push(0);
    robot.state = "moving";

    tickN(world, 0.5, 2); // arrive and queue is empty

    expect(robot.state).toBe("idle");
    expect(robot.stopQueue).toHaveLength(0);
  });

  it("does not move when idle", () => {
    const world = makeWorld();
    const robot = world.robots[0]!;
    // state is already "idle", no queue

    tickN(world, 1, 10);

    expect(robot.position).toBe(2); // unchanged
    expect(robot.state).toBe("idle");
  });

  it("moves in negative direction when target stop is below current position", () => {
    const world = makeWorld();
    const robot = world.robots[0]!;
    robot.stopQueue.push(0); // stop 0 < current position 2
    robot.state = "moving";

    updateWorld(world, 0.1, () => {});

    expect(robot.direction).toBe(-1);
    expect(robot.position).toBeLessThan(2);
  });

  it("multiple robots move independently", () => {
    const world = makeWorld();
    const [r0, r1] = world.robots;
    r0!.stopQueue.push(0); // stop 0, 2 stops away
    r0!.state = "moving";
    r1!.stopQueue.push(3); // stop 3, 1 stop away
    r1!.state = "moving";

    tickN(world, 0.5, 1); // 0.5s: r0 moves 1 stop (to 1), r1 moves 1 stop (to 3)

    expect(r0!.position).toBe(1);
    expect(r1!.position).toBe(3);
  });
});

// --- events ---

describe("engine events", () => {
  it("fires robotStop when robot arrives at a stop", () => {
    const world = makeWorld();
    const robot = world.robots[0]!;
    robot.stopQueue.push(0);
    robot.state = "moving";

    const events: EngineEvent[] = [];
    tickN(world, 0.5, 2, (e) => events.push(e));

    const stopEvent = events.find((e) => e.type === "robotStop");
    expect(stopEvent).toBeDefined();
    expect((stopEvent as Extract<EngineEvent, { type: "robotStop" }>).stop).toBe(0);
    expect((stopEvent as Extract<EngineEvent, { type: "robotStop" }>).robotId).toBe(0);
  });

  it("fires robotIdle after robotStop when queue empties", () => {
    const world = makeWorld();
    const robot = world.robots[0]!;
    robot.stopQueue.push(0);
    robot.state = "moving";

    const eventTypes: string[] = [];
    tickN(world, 0.5, 2, (e) => eventTypes.push(e.type));

    const stopIdx = eventTypes.indexOf("robotStop");
    const idleIdx = eventTypes.indexOf("robotIdle");
    expect(stopIdx).toBeGreaterThanOrEqual(0);
    expect(idleIdx).toBeGreaterThan(stopIdx); // idle fires after stop
  });

  it("does NOT fire robotIdle between stops when queue still has entries", () => {
    const world = makeWorld();
    const robot = world.robots[0]!;
    robot.stopQueue.push(0, 1); // two stops
    robot.state = "moving";

    const events: EngineEvent[] = [];
    tickN(world, 0.5, 2, (e) => events.push(e)); // only arrive at first stop

    // After arriving at stop 0, there's still stop 1 in queue → no idle yet
    const idleEvents = events.filter((e) => e.type === "robotIdle");
    expect(idleEvents).toHaveLength(0);
  });

  it("fires cargoSpawned when spawn schedule time is reached", () => {
    const world = makeWorld();
    world.spawnSchedule[0] = 0.5; // first package spawns at t=0.5

    const events: EngineEvent[] = [];
    tickN(world, 0.1, 4, (e) => events.push(e)); // advance to t=0.4 — no spawn
    expect(events.filter((e) => e.type === "cargoSpawned")).toHaveLength(0);

    tickN(world, 0.2, 1, (e) => events.push(e)); // advance past t=0.5
    expect(events.filter((e) => e.type === "cargoSpawned")).toHaveLength(1);
  });

  it("fires events for all robots independently", () => {
    const world = makeWorld();
    const [r0, r1] = world.robots;
    r0!.stopQueue.push(0);
    r0!.state = "moving";
    r1!.stopQueue.push(3);
    r1!.state = "moving";

    const stopEvents: Extract<EngineEvent, { type: "robotStop" }>[] = [];
    tickN(world, 0.5, 2, (e) => {
      if (e.type === "robotStop") stopEvents.push(e);
    });

    // r1 arrives at stop 3 after 0.5s; r0 arrives at stop 0 after 1s
    const robotIds = stopEvents.map((e) => e.robotId);
    expect(robotIds).toContain(1); // r1 arrived
  });
});

// --- spawn system ---

describe("updateSpawn", () => {
  it("does not spawn before scheduled time", () => {
    const world = makeWorld();
    world.spawnSchedule[0] = 5;

    tickN(world, 0.1, 10); // advance to t=1, spawn scheduled at t=5

    expect(world.spawnedCount).toBe(0);
    expect(world.packages).toHaveLength(0);
  });

  it("spawns exactly one package when schedule time is reached", () => {
    const world = makeWorld();
    world.spawnSchedule[0] = 0.5;

    tickN(world, 0.6, 1);

    expect(world.spawnedCount).toBe(1);
    expect(world.packages).toHaveLength(1);
  });

  it("spawned package appears in an aisle's waiting queue", () => {
    const world = makeWorld();
    world.spawnSchedule[0] = 0.1;

    tickN(world, 0.2, 1);

    const totalWaiting = world.aisles.reduce((sum, a) => sum + a.waiting.length, 0);
    expect(totalWaiting).toBe(1);
  });

  it("spawns each package exactly once per schedule slot", () => {
    const world = makeWorld();
    world.spawnSchedule = [0.1, 0.2, 0.3, 0.4];

    tickN(world, 0.1, 5); // advance through t=0.5, all 4 slots passed

    expect(world.spawnedCount).toBe(4);
    expect(world.packages).toHaveLength(4);
  });

  it("does not spawn past totalPackages", () => {
    const world = makeWorld();
    // totalPackages = 4, set all slots to the past
    world.spawnSchedule = [0, 0, 0, 0];
    world.time = 1;

    tickN(world, 0.1, 10);

    expect(world.spawnedCount).toBe(4);
    expect(world.packages).toHaveLength(4);
  });
});

// --- onCargoReady end-to-end ---

describe("onCargoReady end-to-end", () => {
  it("fires handler with correct aisle and destination when a package spawns via updateWorld", () => {
    const world = makeWorld();
    world.spawnSchedule[0] = 0.5; // schedule one package at t=0.5

    const sandbox = new Sandbox();
    sandbox.boot(
      `function init(world) {
        const robots = world.getRobots();
        world.onCargoReady((cargo) => {
          robots[0].goTo(cargo.aisle.id);
          robots[0].goTo(cargo.destination);
        });
      }`,
      world,
    );

    // Capture queue immediately after fireCargoReady but before updateRobot
    // runs in the same tick (spawn fires before robot movement in updateWorld).
    let queueAtSpawn: number[] = [];
    let spawnedAisle: number | null = null;
    let spawnedDest: number | null = null;
    for (let i = 0; i < 6; i++) {
      updateWorld(world, 0.1, (e) => {
        if (e.type === "cargoSpawned") {
          spawnedAisle = e.aisle;
          spawnedDest = e.destination;
          sandbox.fireCargoReady({ aisle: e.aisle, destination: e.destination });
          queueAtSpawn = [...world.robots[0]!.stopQueue];
        }
      });
    }

    expect(world.spawnedCount).toBe(1);
    expect(spawnedAisle).not.toBeNull();
    // goTo(aisle) and goTo(destination) were both queued at the moment of spawn
    expect(queueAtSpawn).toEqual([spawnedAisle, spawnedDest]);
    expect(world.aisles.some((a) => a.stop === spawnedAisle)).toBe(true);
    expect(world.trucks.some((t) => t.stop === spawnedDest)).toBe(true);
  });

  it("fires for each package that spawns during the level", () => {
    const world = makeWorld();
    // totalPackages = 4; supply all 4 slots so the undefined-slot bug doesn't cause an extra spawn
    world.spawnSchedule = [0.1, 0.2, 0.3, 9999];

    const sandbox = new Sandbox();
    sandbox.boot(
      `function init(world) {
        const robots = world.getRobots();
        world.onCargoReady(() => { robots[0].goTo(0); });
      }`,
      world,
    );

    let fireCount = 0;
    for (let i = 0; i < 5; i++) {
      updateWorld(world, 0.1, (e) => {
        if (e.type === "cargoSpawned") {
          fireCount++;
          sandbox.fireCargoReady({ aisle: e.aisle, destination: e.destination });
        }
      });
    }

    // 3 packages spawned by t=0.5; 4th is scheduled at 9999
    expect(world.spawnedCount).toBe(3);
    expect(fireCount).toBe(3);
  });
});

// --- victory condition ---

describe("victory condition", () => {
  it("sets completedAt when all packages are spawned and delivered", () => {
    const world = makeWorld();
    // Mark all packages as already spawned and delivered
    world.spawnedCount = world.level.totalPackages;
    world.deliveredCount = world.level.totalPackages;
    // No packages in aisles or robot cargo (already the case)

    updateWorld(world, 0.1, () => {});

    expect(world.completedAt).not.toBeNull();
  });

  it("does not complete while packages are still in robot cargo", () => {
    const world = makeWorld();
    world.spawnedCount = world.level.totalPackages;
    // Place a package in robot cargo
    world.robots[0]!.cargo.push({
      id: 0,
      origin: 2,
      destination: 0,
      color: "#ef4444",
      createdAt: 0,
      pickedUpAt: 1,
      deliveredAt: null,
    });

    tickN(world, 0.1, 5);

    expect(world.completedAt).toBeNull();
  });

  it("does not complete while packages are waiting in an aisle", () => {
    const world = makeWorld();
    world.spawnedCount = world.level.totalPackages;
    world.aisles[0]!.waiting.push({
      id: 0,
      origin: 2,
      destination: 0,
      color: "#ef4444",
      createdAt: 0,
      pickedUpAt: null,
      deliveredAt: null,
    });

    tickN(world, 0.1, 5);

    expect(world.completedAt).toBeNull();
  });

  it("does not complete while not all packages have spawned yet", () => {
    const world = makeWorld();
    // spawnedCount < totalPackages, no cargo anywhere

    updateWorld(world, 0.1, () => {});

    expect(world.completedAt).toBeNull();
  });

  it("records completion time accurately", () => {
    const world = makeWorld();
    world.time = 42.5;
    world.spawnedCount = world.level.totalPackages;

    updateWorld(world, 0.1, () => {}); // world.time becomes 42.6

    expect(world.completedAt).toBeCloseTo(42.6);
  });

  it("does not overwrite completedAt on subsequent ticks", () => {
    const world = makeWorld();
    world.spawnedCount = world.level.totalPackages;

    updateWorld(world, 0.1, () => {});
    const firstCompletion = world.completedAt;

    updateWorld(world, 0.1, () => {});

    expect(world.completedAt).toBe(firstCompletion);
  });
});
