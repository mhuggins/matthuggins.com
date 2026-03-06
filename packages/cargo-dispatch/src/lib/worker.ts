/// <reference lib="webworker" />

import { assertNever } from "assert-never";
import type { WorkerInbound, WorkerOutbound, WorldState } from "../types";
import { Sandbox } from "./Sandbox";
import type { EngineEvent } from "./updateWorld";
import { updateWorld } from "./updateWorld";

let world: WorldState | null = null;
let sandbox: Sandbox | null = null;

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
      updateWorld(world, msg.deltaTime, handleEvent);

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
