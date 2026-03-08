/**
 * Gold Alternate Strategy — Static Priority-Based Dispatch
 *
 * Each robot is assigned a rotated priority list of truck destinations so
 * robots naturally specialise in different colours without competing.
 *
 * With 3 robots and 5 trucks (0–4), the lists look like:
 *   Robot 0: [0, 1, 2, 3, 4]
 *   Robot 1: [2, 3, 4, 0, 1]
 *   Robot 2: [4, 0, 1, 2, 3]
 *
 * Key behaviours:
 * 1. On becoming empty, a robot picks the highest-priority truck that still
 *    has packages waiting anywhere and locks onto it as its "focus".
 * 2. It fills to capacity from that truck's packages before delivering.
 * 3. With spare capacity and no more focus packages nearby, it picks up
 *    pass-by packages (trucks between focus stop and the aisle zone).
 * 4. En route to deliver, it sweeps every aisle it passes for relevant
 *    packages — zero extra travel since aisles sit above the truck zone.
 * 5. If new cargo spawns at an aisle below a robot's current target aisle,
 *    the robot inserts that aisle into its queue on the way down.
 */

const init: PlayerInit = (world) => {
  const robots = world.getRobots();
  const sortedTruckIds = world
    .getTrucks()
    .map((t) => t.id)
    .sort((a, b) => a - b);

  // Stagger each robot's priority list by a fixed step so primary targets differ.
  // step = round(truckCount / robotCount), e.g. 5 trucks / 3 robots → step 2.
  const step = Math.max(1, Math.round(sortedTruckIds.length / robots.length));

  // priorityOf maps robot.id → ordered list of truck stops, highest priority first.
  const priorityOf = new Map<number, StopId[]>(
    robots.map((r, i) => {
      const offset = (i * step) % sortedTruckIds.length;
      return [r.id, [...sortedTruckIds.slice(offset), ...sortedTruckIds.slice(0, offset)]];
    }),
  );

  // focusMap maps robot.id → the truck stop currently being loaded for.
  // null = unassigned; set when the robot becomes empty and arrives at an aisle.
  const focusMap = new Map<number, StopId | null>(robots.map((r) => [r.id, null]));

  robots.forEach((robot) => {
    robot.onStop((stop) => handleStop(robot, stop, world, robots, priorityOf, focusMap));
    robot.onIdle(() => handleIdle(robot, world, robots, priorityOf, focusMap));
  });

  world.onCargoReady((cargo) => {
    robots.forEach((r) => redirectStaleAisles(r, world, robots, priorityOf, focusMap));
    robots.forEach((r) => {
      if (r.isIdle()) sendToWork(r, world, robots, priorityOf, focusMap);
    });

    // Intercept: if new cargo spawns at an aisle below a robot's current target
    // aisle, insert it into the queue — it lies directly on the path down to the
    // trucks so the detour cost is zero.
    const aisleIds = new Set(world.getAisles().map((a) => a.id));
    const truckIdSet = new Set(sortedTruckIds);

    robots.forEach((robot) => {
      if (!robot.hasCargo() || robot.getAvailableCapacity() === 0) {
        return;
      }

      const focus = focusMap.get(robot.id) ?? null;
      if (focus === null) {
        return;
      }

      const targetStop = robot.getTargetStop();
      if (targetStop === null || truckIdSet.has(targetStop)) {
        return;
      }

      const newAisleId = cargo.aisle.id;
      if (targetStop === newAisleId || robot.getQueuedStops().includes(newAisleId)) {
        return;
      }
      if (newAisleId >= targetStop) {
        return;
      }

      const passByIds = new Set(sortedTruckIds.filter((id) => id > focus));
      if (cargo.destination !== focus && !passByIds.has(cargo.destination)) {
        return;
      }

      const queued = robot.getQueuedStops();
      robot.clearQueue();
      [...queued.filter((s) => aisleIds.has(s)), newAisleId]
        .sort((a, b) => b - a)
        .forEach((s) => robot.goTo(s));
      getOptimalDeliveryOrder(
        queued.filter((s) => truckIdSet.has(s)),
        newAisleId,
      ).forEach((d) => robot.goTo(d));
    });
  });
};

// ---------------------------------------------------------------------------
// Stop & idle handlers
// ---------------------------------------------------------------------------

function handleStop(
  robot: Robot,
  stop: StopId,
  world: WorldAPI,
  robots: Robot[],
  priorityOf: Map<number, StopId[]>,
  focusMap: Map<number, StopId | null>,
) {
  const isAisle = world.getAisles().some((a) => a.id === stop);

  if (isAisle) {
    // Assign focus when empty: highest-priority truck with packages still waiting.
    if (!robot.hasCargo()) {
      focusMap.set(robot.id, chooseFocus(priorityOf.get(robot.id)!, world));
    }

    const focus = focusMap.get(robot.id) ?? null;

    // Primary pickup: packages bound for the focus truck.
    if (focus !== null && robot.getAvailableCapacity() > 0) {
      robot.pickUp((pkg) => pkg.destination === focus);
    }

    // Pass-by fill: if still under capacity and no unclaimed focus aisles remain,
    // pick up packages for trucks we'll pass on the way (truckId > focus, since
    // all aisles sit above all trucks in the linear layout).
    if (robot.getAvailableCapacity() > 0 && focus !== null) {
      const moreFocusAisles = findAisleForFocus(world, stop, focus, robots, robot);
      if (!moreFocusAisles) {
        const passByIds = new Set(
          world
            .getTrucks()
            .map((t) => t.id)
            .filter((id) => id > focus),
        );
        if (passByIds.size > 0) {
          robot.pickUp((pkg) => passByIds.has(pkg.destination));
        }
      }
    }

    // If this aisle is now empty, free up other robots heading here.
    const thisAisle = world.getAisles().find((a) => a.id === stop);
    if (thisAisle && thisAisle.getWaitingCount() === 0) {
      robots.forEach((r) => {
        if (r !== robot) redirectStaleAisles(r, world, robots, priorityOf, focusMap);
      });
    }

    if (robot.hasCargo()) {
      planRoute(robot, world, robots, focusMap);
    } else {
      robot.clearQueue();
      sendToWork(robot, world, robots, priorityOf, focusMap);
    }
  } else {
    // Truck stop: drop off. Clear focus once fully empty so it's recomputed fresh.
    robot.dropOff();
    if (!robot.hasCargo()) {
      focusMap.set(robot.id, null);
    }
  }
}

function handleIdle(
  robot: Robot,
  world: WorldAPI,
  robots: Robot[],
  priorityOf: Map<number, StopId[]>,
  focusMap: Map<number, StopId | null>,
) {
  if (robot.hasCargo()) {
    planRoute(robot, world, robots, focusMap);
    return;
  }
  focusMap.set(robot.id, null);
  sendToWork(robot, world, robots, priorityOf, focusMap);
}

// ---------------------------------------------------------------------------
// Focus selection
// ---------------------------------------------------------------------------

/**
 * Returns the first truck in the robot's priority list that still has packages
 * waiting somewhere in an aisle.  Cascades automatically as trucks are exhausted.
 */
function chooseFocus(priority: StopId[], world: WorldAPI): StopId | null {
  const waiting = new Map<StopId, number>();
  for (const aisle of world.getAisles()) {
    for (const [dest, count] of Object.entries(aisle.getDestinations())) {
      const d = Number(dest);
      waiting.set(d, (waiting.get(d) ?? 0) + count);
    }
  }
  for (const truckId of priority) {
    if ((waiting.get(truckId) ?? 0) > 0) {
      return truckId;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Route planning
// ---------------------------------------------------------------------------

function planRoute(
  robot: Robot,
  world: WorldAPI,
  robots: Robot[],
  focusMap: Map<number, StopId | null>,
) {
  robot.clearQueue();

  const currentStop = robot.getCurrentStop() ?? 0;
  const focus = focusMap.get(robot.id) ?? null;
  const availCap = robot.getAvailableCapacity();

  // Priority 1: keep visiting unclaimed focus aisles until full.
  if (availCap > 0 && focus !== null) {
    const focusAisle = findAisleForFocus(world, currentStop, focus, robots, robot);
    if (focusAisle) {
      robot.goTo(focusAisle.id);
      return;
    }
  }

  // Priority 2: sweep aisles that sit directly on the path to the truck zone
  // (id < currentStop). They cost zero extra distance and may carry focus or
  // pass-by packages we haven't loaded yet.
  if (availCap > 0 && focus !== null) {
    const passByIds = new Set(
      world
        .getTrucks()
        .map((t) => t.id)
        .filter((id) => id > focus),
    );
    const pathAisles = world
      .getAisles()
      .filter((a) => {
        if (a.id >= currentStop || a.getWaitingCount() === 0) {
          return false;
        }
        const dests = a.getDestinations();
        return Object.keys(dests).some((d) => {
          const dest = Number(d);
          return dest === focus || passByIds.has(dest);
        });
      })
      .sort((a, b) => b.id - a.id); // descending: nearest to robot first

    if (pathAisles.length > 0) {
      pathAisles.forEach((a) => robot.goTo(a.id));
      return;
    }
  }

  // Priority 3: deliver in optimal linear-sweep order.
  getOptimalDeliveryOrder(robot.getDeliveryStops(), currentStop).forEach((d) => robot.goTo(d));
}

function getOptimalDeliveryOrder(stops: StopId[], currentStop: StopId): StopId[] {
  if (stops.length <= 1) {
    return [...stops];
  }

  const sorted = [...stops].sort((a, b) => a - b);
  const min = sorted[0]!;
  const max = sorted[sorted.length - 1]!;

  const goLowFirst = Math.abs(currentStop - min) + (max - min);
  const goHighFirst = Math.abs(currentStop - max) + (max - min);

  return goLowFirst <= goHighFirst ? sorted : [...sorted].reverse();
}

// ---------------------------------------------------------------------------
// Aisle selection & dispatch
// ---------------------------------------------------------------------------

function sendToWork(
  robot: Robot,
  world: WorldAPI,
  robots: Robot[],
  priorityOf: Map<number, StopId[]>,
  focusMap: Map<number, StopId | null>,
) {
  const fromStop = robot.getCurrentStop() ?? robot.getTargetStop() ?? 0;
  const priority = priorityOf.get(robot.id)!;

  // Ensure a focus is assigned.
  let focus = focusMap.get(robot.id) ?? null;
  if (focus === null) {
    focus = chooseFocus(priority, world);
    focusMap.set(robot.id, focus);
  }

  // Head to the nearest unclaimed aisle carrying focus packages.
  if (focus !== null) {
    const focusAisle = findAisleForFocus(world, fromStop, focus, robots, robot);
    if (focusAisle) {
      robot.goTo(focusAisle.id);
      return;
    }
  }

  // Fallback: best unclaimed aisle by packages-per-distance score.
  const aisle = pickBestAisle(world, fromStop, robots, robot);
  if (aisle) {
    robot.goTo(aisle.id);
    return;
  }

  // Nothing to do — park at center aisle for faster response to spawns.
  const center = getCenterAisle(world);
  if (center && robot.getCurrentStop() !== center.id) {
    robot.goTo(center.id);
  }
}

/** Nearest unclaimed aisle that holds packages for the focus truck. */
function findAisleForFocus(
  world: WorldAPI,
  fromStop: StopId,
  focus: StopId,
  robots: Robot[],
  excludeRobot: Robot,
): Aisle | null {
  const claimed = getClaimedStops(robots, excludeRobot);
  const candidates = world.getAisles().filter((a) => {
    if (claimed.has(a.id)) {
      return false;
    }
    return (a.getDestinations()[focus] ?? 0) > 0;
  });

  if (candidates.length === 0) {
    return null;
  }
  return candidates.reduce((best, a) =>
    Math.abs(a.id - fromStop) < Math.abs(best.id - fromStop) ? a : best,
  );
}

/** Best unclaimed aisle by packages-per-distance (fallback when no focus aisle exists). */
function pickBestAisle(
  world: WorldAPI,
  fromStop: StopId,
  robots: Robot[],
  excludeRobot: Robot,
): Aisle | null {
  const claimed = getClaimedStops(robots, excludeRobot);
  const withPackages = world.getAisles().filter((a) => a.getWaitingCount() > 0);
  if (withPackages.length === 0) {
    return null;
  }

  const unclaimed = withPackages.filter((a) => !claimed.has(a.id));
  const candidates = unclaimed.length > 0 ? unclaimed : withPackages;

  const score = (a: Aisle) => a.getWaitingCount() / (Math.abs(a.id - fromStop) || 0.1);
  return candidates.reduce((best, a) => (score(a) > score(best) ? a : best));
}

/** Middle aisle by stop ID — good parking spot when idle with nothing to do. */
function getCenterAisle(world: WorldAPI): Aisle | null {
  const aisles = world.getAisles();
  if (aisles.length === 0) {
    return null;
  }
  const sorted = [...aisles].sort((a, b) => a.id - b.id);
  return sorted[Math.floor(sorted.length / 2)]!;
}

// ---------------------------------------------------------------------------
// Multi-robot coordination
// ---------------------------------------------------------------------------

/** Strip empty aisles from a robot's queue; dispatch it if left with no work. */
function redirectStaleAisles(
  robot: Robot,
  world: WorldAPI,
  robots: Robot[],
  priorityOf: Map<number, StopId[]>,
  focusMap: Map<number, StopId | null>,
) {
  const emptyAisleIds = new Set(
    world
      .getAisles()
      .filter((a) => a.getWaitingCount() === 0)
      .map((a) => a.id),
  );
  const aisleIds = new Set(world.getAisles().map((a) => a.id));

  const queued = robot.getQueuedStops();
  if (!queued.some((s) => emptyAisleIds.has(s))) {
    return;
  }

  const cleaned = queued.filter((s) => !emptyAisleIds.has(s));
  robot.clearQueue();
  cleaned.forEach((s) => robot.goTo(s));

  if (!cleaned.some((s) => aisleIds.has(s)) && !robot.hasCargo()) {
    sendToWork(robot, world, robots, priorityOf, focusMap);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getClaimedStops(robots: Robot[], excludeRobot: Robot): Set<StopId> {
  const claimed = new Set<StopId>();
  for (const r of robots) {
    if (r === excludeRobot) continue;
    const target = r.getTargetStop();
    if (target !== null) claimed.add(target);
    r.getQueuedStops().forEach((s) => claimed.add(s));
  }
  return claimed;
}
