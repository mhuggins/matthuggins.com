import { LEVEL_1 } from "../lib/level";

export function APIReference() {
  return (
    <details className="mt-3">
      <summary className="cursor-pointer select-none text-gray-500 text-xs">API Reference</summary>
      <div className="mt-2 rounded-md bg-gray-50 p-3 font-mono text-gray-700 text-xs leading-[1.8]">
        <div className="mb-1 font-semibold">robot</div>
        <div className="text-gray-500">
          robot.onIdle(callback) — called when robot has no queued stops
          <br />
          robot.onStop(callback) — called after robot arrives at a stop, receives StopId
          <br />
          robot.dropOff() — deliver cargo destined for current truck stop
          <br />
          robot.pickUp(filter?) — pick up packages at current aisle (optional filter)
          <br />
          robot.goTo(stop) — queue a stop to visit
          <br />
          robot.clearQueue() — remove queued stops
          <br />
          robot.getCurrentStop() → StopId | null
          <br />
          robot.hasCargo() → boolean
          <br />
          robot.getCargoCount() → number
          <br />
          robot.nextDeliveryStop() → StopId | null
          <br />
          robot.getDeliveryStops() → StopId[]
          <br />
          robot.getCargoSummary() → {"{ total, destinations }"}
          <br />
          robot.getQueuedStops() → StopId[]
          <br />
          robot.isIdle() → boolean
          <br />
          robot.getId() → number
          <br />
          robot.setLabel(text) — set display label
        </div>
        <div className="mt-2 mb-1 font-semibold">world</div>
        <div className="text-gray-500">
          world.onCargoReady(callback) — called when cargo spawns, receives{" "}
          {"{ aisle, destination }"}
          <br />
          world.getBusiestAisle() → {"{ stop, waitingCount, destinations } | null"}
          <br />
          world.getNearestAisleWithWaiting(fromStop) → aisle | null
          <br />
          world.getTotalWaitingCount() → number
          <br />
          world.getWaitingCount(stop) → number
          <br />
          world.getWaitingPackages(stop) → {"{ destination, color }[]"}
          <br />
          world.getAisles() → {"{ stop, waitingCount, destinations }[]"}
          <br />
          world.getTrucks() → {"{ stop, name, color }[]"}
          <br />
          world.getRobots() → {"{ id, currentStop, cargoCount, destinations, queuedStops, idle }[]"}
          <br />
          world.getTime() → number
        </div>
        <div className="mt-2 mb-1 font-semibold">StopId values for day {LEVEL_1.day}</div>
        <div className="text-gray-500">
          Stops 0-{LEVEL_1.truckCount - 1}: trucks
          <br />
          Stops {LEVEL_1.truckCount}-{LEVEL_1.truckCount + LEVEL_1.aisleCount - 1}: aisles
        </div>
      </div>
    </details>
  );
}
