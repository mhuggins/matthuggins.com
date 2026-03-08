/// <reference lib="webworker" />

import { assertNever } from "assert-never";
import type { WorkerInbound, WorkerOutbound, WorldState } from "../types";
import { Sandbox } from "./Sandbox";
import type { EngineEvent } from "./updateWorld";
import { updateWorld } from "./updateWorld";

// Fixed simulation step size in game-seconds.
// Every run with the same seed and strategy advances the world in identical
// increments, so results are independent of frame rate or speed setting.
const FIXED_DELTA_TIME = 1 / 60;

let world: WorldState | null = null;
let sandbox: Sandbox | null = null;
let accumulator = 0;

function handleEvent(event: EngineEvent): void {
  if (!sandbox) {
    return;
  }
  switch (event.type) {
    case "robotIdle":
      return sandbox.fireRobotIdle(event.robotId);
    case "robotStop":
      return sandbox.fireRobotStop(event.robotId, event.stop);
    case "cargoSpawned":
      return sandbox.fireCargoReady({ aisle: event.aisle, destination: event.destination });
    default:
      return assertNever(event);
  }
}

self.onmessage = (e: MessageEvent<WorkerInbound>) => {
  const msg = e.data;

  switch (msg.type) {
    case "boot": {
      world = msg.world;
      accumulator = 0;

      sandbox = new Sandbox();
      sandbox.boot(msg.code, world);

      const errors = sandbox.getErrors();
      const reply: WorkerOutbound = { type: "bootResult", errors };
      self.postMessage(reply);
      return;
    }
    case "tick": {
      if (!world || !sandbox) {
        return;
      }

      sandbox.clearErrors(); // Prevent stale errors from repeating every frame

      // Advance the simulation in fixed steps so the event sequence is identical
      // regardless of frame rate or speed setting.
      accumulator += msg.deltaTime;

      while (accumulator >= FIXED_DELTA_TIME) {
        updateWorld(world, FIXED_DELTA_TIME, handleEvent);

        accumulator -= FIXED_DELTA_TIME;

        if (world.completedAt !== null) {
          break;
        }
      }

      const errors = sandbox.getErrors();
      const completed = world.completedAt !== null;
      const reply: WorkerOutbound = { type: "tickResult", world, errors, completed };
      self.postMessage(reply);
      return;
    }
    default:
      return assertNever(msg);
  }
};
