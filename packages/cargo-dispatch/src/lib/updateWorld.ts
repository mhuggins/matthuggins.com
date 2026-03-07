import type { RobotData, StopId, WorldState } from "../types";
import { updateSpawn } from "./updateSpawn";

export type EngineEvent =
  | { type: "robotIdle"; robotId: number }
  | { type: "robotStop"; robotId: number; stop: StopId }
  | { type: "cargoSpawned"; aisle: number; destination: number };

type EventHandler = (event: EngineEvent) => void;

export function updateWorld(world: WorldState, dt: number, onEvent: EventHandler): void {
  world.time += dt;
  const spawned = updateSpawn(world, dt);
  if (spawned) {
    onEvent({ type: "cargoSpawned", aisle: spawned.aisle, destination: spawned.destination });
  }
  for (const robot of world.robots) {
    updateRobot(robot, world, dt, onEvent);
  }
  checkVictory(world);
}

function updateRobot(robot: RobotData, world: WorldState, dt: number, onEvent: EventHandler): void {
  if (robot.state === "idle") return;

  if (robot.targetStop === null) {
    if (robot.stopQueue.length === 0) {
      robot.state = "idle";
      robot.direction = 0;
      onEvent({ type: "robotIdle", robotId: robot.id });
      return;
    }
    robot.targetStop = robot.stopQueue.shift()!;
    robot.direction = robot.targetStop > robot.position ? 1 : -1;
  }

  const dist = robot.targetStop - robot.position;
  const step = robot.speed * dt;

  if (Math.abs(dist) <= step) {
    robot.position = robot.targetStop;
    robot.targetStop = null;
    robot.direction = 0;

    const stop: StopId = robot.position;

    doPickupDropoff(robot, world, stop);
    onEvent({ type: "robotStop", robotId: robot.id, stop });

    if (robot.stopQueue.length > 0) {
      robot.targetStop = robot.stopQueue.shift()!;
      robot.direction = robot.targetStop > robot.position ? 1 : -1;
    } else {
      robot.state = "idle";
      onEvent({ type: "robotIdle", robotId: robot.id });
    }
  } else {
    robot.position += robot.direction * step;
  }
}

function doPickupDropoff(robot: RobotData, world: WorldState, stop: StopId): void {
  const truck = world.trucks.find((t) => t.stop === stop);
  if (truck) {
    const toDeliver = robot.cargo.filter((p) => p.to === stop);
    for (const pkg of toDeliver) {
      pkg.deliveredAt = world.time;
      truck.deliveredCount++;
      world.deliveredCount++;
    }
    robot.cargo = robot.cargo.filter((p) => p.to !== stop);
  }

  const aisle = world.aisles.find((a) => a.stop === stop);
  if (aisle && aisle.waiting.length > 0) {
    const available = robot.capacity - robot.cargo.length;
    if (available > 0) {
      const toPickup = aisle.waiting.splice(0, available);
      for (const pkg of toPickup) {
        pkg.pickedUpAt = world.time;
        robot.cargo.push(pkg);
      }
    }
  }
}

function checkVictory(world: WorldState): void {
  if (world.completedAt !== null) return;
  if (world.spawnedCount < world.level.totalPackages) return;
  const allDelivered = world.robots.every((r) => r.cargo.length === 0);
  const noneWaiting = world.aisles.every((a) => a.waiting.length === 0);
  if (allDelivered && noneWaiting) {
    world.completedAt = world.time;
  }
}
