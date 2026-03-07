import type { RobotData, StopId, WorldState } from "../types";
import { updateSpawn } from "./updateSpawn";

export type EngineEvent =
  | { type: "robotIdle"; robotId: number }
  | { type: "robotStop"; robotId: number; stop: StopId }
  | { type: "cargoSpawned"; aisle: number; destination: number };

type EventHandler = (event: EngineEvent) => void;

export function updateWorld(world: WorldState, deltaTime: number, onEvent: EventHandler): void {
  world.time += deltaTime;
  const spawned = updateSpawn(world, deltaTime);
  if (spawned) {
    onEvent({ type: "cargoSpawned", aisle: spawned.aisle, destination: spawned.destination });
  }
  for (const robot of world.robots) {
    updateRobot(robot, deltaTime, onEvent);
  }
  checkVictory(world);
}

function updateRobot(robot: RobotData, deltaTime: number, onEvent: EventHandler): void {
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
  const step = robot.speed * deltaTime;

  if (Math.abs(dist) <= step) {
    robot.position = robot.targetStop;
    robot.targetStop = null;
    robot.direction = 0;

    const stop: StopId = robot.position;

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

function checkVictory(world: WorldState): void {
  if (world.completedAt !== null) return;
  if (world.spawnedCount < world.level.totalPackages) return;
  const allDelivered = world.robots.every((r) => r.cargo.length === 0);
  const noneWaiting = world.aisles.every((a) => a.waiting.length === 0);
  if (allDelivered && noneWaiting) {
    world.completedAt = world.time;
  }
}
