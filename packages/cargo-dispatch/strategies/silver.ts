/**
 * Silver Strategy
 *
 * Key behaviors:
 * 1. At an aisle: first pick up packages matching current cargo destinations,
 *    then fill remaining capacity with any packages.
 * 2. After loading, plan a linear-sweep delivery route (fewest direction changes).
 * 3. Before delivering, check if a nearby unclaimed aisle has packages going to
 *    the same destinations — detour there if the overhead is small.
 * 4. After any pickup that drains an aisle, redirect other robots that have
 *    that aisle queued — remove the stale stop and find new work for them.
 * 5. On cargo-ready: sweep all robots for stale empty-aisle targets, then
 *    wake any idle robots.
 * 6. When truly idle with no packages anywhere, park at the center aisle so
 *    the robot is well-positioned for the next spawn.
 */

const init: PlayerInit = (world) => {
  const robots = world.getRobots();

  robots.forEach((robot) => {
    robot.onStop((stop) => handleStop(robot, stop, world, robots));
    robot.onIdle(() => handleIdle(robot, world, robots));
  });

  world.onCargoReady(() => {
    // Redirect any robot whose queued aisle is now empty, then wake idle ones.
    robots.forEach((robot) => redirectStaleAisles(robot, world, robots));
    robots.forEach((robot) => {
      if (robot.isIdle()) sendToWork(robot, world, robots);
    });
  });
};

// ---------------------------------------------------------------------------
// Stop handler
// ---------------------------------------------------------------------------

function handleStop(robot: Robot, stop: StopId, world: WorldAPI, robots: Robot[]) {
  const isAisle = world.getAisles().some((a) => a.id === stop);

  if (isAisle) {
    const currentDests = new Set(robot.getDeliveryStops());

    // Priority pick: packages that consolidate with cargo already on board.
    if (currentDests.size > 0) {
      robot.pickUp((pkg) => currentDests.has(pkg.destination));
    }

    // Fill any remaining capacity with whatever is available.
    if (robot.getAvailableCapacity() > 0) {
      robot.pickUp();
    }

    // If this aisle is now empty, redirect other robots that were heading here.
    const thisAisle = world.getAisles().find((a) => a.id === stop);
    if (thisAisle && thisAisle.getWaitingCount() === 0) {
      robots.forEach((r) => {
        if (r !== robot) redirectStaleAisles(r, world, robots);
      });
    }

    if (robot.hasCargo()) {
      planRoute(robot, world, robots);
    } else {
      // Arrived at an empty aisle with no cargo — find new work immediately.
      robot.clearQueue();
      sendToWork(robot, world, robots);
    }
  } else {
    // Truck stop: drop off cargo for this stop.
    // The queue will carry the robot to remaining truck stops automatically.
    // onIdle fires when the queue empties.
    robot.dropOff();
  }
}

// ---------------------------------------------------------------------------
// Idle handler
// ---------------------------------------------------------------------------

function handleIdle(robot: Robot, world: WorldAPI, robots: Robot[]) {
  if (robot.hasCargo()) {
    // Shouldn't happen often, but handle gracefully.
    planRoute(robot, world, robots);
    return;
  }
  sendToWork(robot, world, robots);
}

// ---------------------------------------------------------------------------
// Route planning
// ---------------------------------------------------------------------------

/**
 * Plan the robot's next moves after loading at an aisle.
 * Optionally detours to a nearby aisle with matching-destination cargo
 * before heading to the trucks.
 */
function planRoute(robot: Robot, world: WorldAPI, robots: Robot[]) {
  robot.clearQueue();

  const currentStop = robot.getCurrentStop() ?? 0;
  const myDests = new Set(robot.getDeliveryStops());
  const availCap = robot.getAvailableCapacity();

  // If we have spare capacity, try to find a close aisle with matching cargo.
  if (availCap > 0) {
    const matchAisle = findMatchingAisle(world, currentStop, myDests, robots, robot);
    if (matchAisle) {
      const deliveries = getOptimalDeliveryOrder(robot.getDeliveryStops(), currentStop);
      const directDist = routeDistance(currentStop, deliveries);
      const detourDist = routeDistance(currentStop, [matchAisle.id, ...deliveries]);

      // Allow detour if overhead is at most 2 extra stop-lengths.
      if (detourDist <= directDist + 2) {
        robot.goTo(matchAisle.id);
        // onStop at the aisle will re-plan with the updated cargo load.
        return;
      }
    }
  }

  // Queue deliveries in optimal linear-sweep order (fewest direction changes).
  const deliveries = getOptimalDeliveryOrder(robot.getDeliveryStops(), currentStop);
  deliveries.forEach((d) => robot.goTo(d));
}

/**
 * Sort delivery stops for a linear sweep starting from currentStop.
 * Chooses the direction (low-first or high-first) that minimises total travel.
 */
function getOptimalDeliveryOrder(stops: StopId[], currentStop: StopId) {
  if (stops.length <= 1) {
    return [...stops];
  }

  const sorted = [...stops].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  const goLowFirst = Math.abs(currentStop - min) + (max - min);
  const goHighFirst = Math.abs(currentStop - max) + (max - min);

  return goLowFirst <= goHighFirst ? sorted : [...sorted].reverse();
}

// ---------------------------------------------------------------------------
// Aisle selection
// ---------------------------------------------------------------------------

/**
 * Send an idle (cargo-free) robot to the best available aisle.
 * If no packages exist anywhere, park at the center aisle to stay positioned.
 */
function sendToWork(robot: Robot, world: WorldAPI, robots: Robot[]) {
  const fromStop = robot.getCurrentStop() ?? robot.getTargetStop() ?? 0;
  const aisle = pickBestAisle(world, fromStop, robots, robot);

  if (aisle) {
    robot.goTo(aisle.id);
    return;
  }

  // No work — park at center aisle so we're ready for the next spawn.
  const center = getCenterAisle(world);
  if (center && robot.getCurrentStop() !== center.id) {
    robot.goTo(center.id);
  }
}

function pickBestAisle(world: WorldAPI, fromStop: StopId, robots: Robot[], excludeRobot: Robot) {
  const claimed = getClaimedStops(robots, excludeRobot);
  const withPackages = world.getAisles().filter((a) => a.getWaitingCount() > 0);

  if (withPackages.length === 0) {
    return null;
  }

  const unclaimed = withPackages.filter((a) => !claimed.has(a.id));
  const candidates = unclaimed.length > 0 ? unclaimed : withPackages;

  // Score: packages per unit of travel distance.
  const score = (a: Aisle) => a.getWaitingCount() / (Math.abs(a.id - fromStop) || 0.1);
  return candidates.reduce((best, aisle) => (score(aisle) > score(best) ? aisle : best));
}

/**
 * Find the nearest unclaimed aisle that has packages going to our destinations.
 */
function findMatchingAisle(
  world: WorldAPI,
  fromStop: StopId,
  myDests: Set<StopId>,
  robots: Robot[],
  excludeRobot: Robot,
) {
  const claimed = getClaimedStops(robots, excludeRobot);

  const candidates = world.getAisles().filter((aisle) => {
    if (aisle.id === fromStop) {
      return false;
    }
    if (aisle.getWaitingCount() === 0) {
      return false;
    }
    if (claimed.has(aisle.id)) {
      return false;
    }

    const dests = aisle.getDestinations();
    return Object.keys(dests).some((d) => myDests.has(Number(d)));
  });

  if (candidates.length === 0) {
    return null;
  }

  return candidates.reduce((best, aisle) =>
    Math.abs(aisle.id - fromStop) < Math.abs(best.id - fromStop) ? aisle : best,
  );
}

/**
 * Middle aisle by stop ID — good parking spot when idle.
 */
function getCenterAisle(world: WorldAPI) {
  const aisles = world.getAisles();
  if (aisles.length === 0) {
    return null;
  }

  const sorted = [...aisles].sort((a, b) => a.id - b.id);
  return sorted[Math.floor(sorted.length / 2)];
}

// ---------------------------------------------------------------------------
// Multi-robot coordination
// ---------------------------------------------------------------------------

/**
 * Inspect a robot's queued stops and remove any aisles that are now empty.
 * If the robot's queue changes and it has no remaining aisle to visit
 * (and no cargo), dispatch it to new work.
 */
function redirectStaleAisles(robot: Robot, world: WorldAPI, robots: Robot[]) {
  const emptyAisleIds = new Set(
    world
      .getAisles()
      .filter((a) => a.getWaitingCount() === 0)
      .map((a) => a.id),
  );
  const aisleIds = new Set(world.getAisles().map((a) => a.id));

  const queued = robot.getQueuedStops();
  const hasStale = queued.some((s) => emptyAisleIds.has(s));
  if (!hasStale) {
    return;
  }

  // Rebuild queue without empty aisles.
  const cleaned = queued.filter((s) => !emptyAisleIds.has(s));
  robot.clearQueue();
  cleaned.forEach((s) => robot.goTo(s));

  // If no aisle remains in the queue and the robot has no cargo, find new work.
  const hasAisleQueued = cleaned.some((s) => aisleIds.has(s));
  if (!hasAisleQueued && !robot.hasCargo()) {
    sendToWork(robot, world, robots);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the set of stop IDs currently targeted or queued by all robots
 * except the excluded one — used for coordination.
 */
function getClaimedStops(robots: Robot[], excludeRobot: Robot) {
  const claimed = new Set<StopId>();
  for (const r of robots) {
    if (r === excludeRobot) continue;
    const target = r.getTargetStop();
    if (target !== null) claimed.add(target);
    r.getQueuedStops().forEach((s) => claimed.add(s));
  }
  return claimed;
}

function routeDistance(start: StopId, stops: StopId[]) {
  let total = 0;
  let pos = start;
  for (const stop of stops) {
    total += Math.abs(stop - pos);
    pos = stop;
  }
  return total;
}
