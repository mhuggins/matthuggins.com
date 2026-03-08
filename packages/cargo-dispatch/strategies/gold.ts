/**
 * Gold Strategy — Coordinated Color-Focused Dispatch
 *
 * Key behaviors:
 * 1. Each robot picks a "focus destination" (truck) when it becomes empty.
 *    It only picks up packages bound for that truck, so delivery is always
 *    a single truck stop rather than a multi-stop sweep.
 * 2. Focus assignment is coordinated: each robot looks at how many packages
 *    per destination are waiting vs. already being carried or targeted by
 *    other robots, then claims whichever destination has the most uncovered
 *    demand.
 * 3. With spare capacity after a focused load, detour to a nearby aisle that
 *    also has focus-destination packages before heading to the truck.
 * 4. If no focus-destination packages exist, fall back to the best unclaimed
 *    aisle; if nothing anywhere, park at the center aisle.
 * 5. After any pickup that drains an aisle, redirect other robots whose
 *    queued stops include that now-empty aisle.
 */

const init: PlayerInit = (world) => {
  const robots = world.getRobots();

  // Maps robot.id → the truck stop this robot is currently focused on.
  // null means unassigned; recomputed whenever the robot becomes empty.
  const focusMap = new Map<number, StopId | null>(robots.map((r) => [r.id, null]));

  robots.forEach((robot) => {
    robot.onStop((stop) => handleStop(robot, stop, world, robots, focusMap));
    robot.onIdle(() => handleIdle(robot, world, robots, focusMap));
  });

  world.onCargoReady((cargo) => {
    robots.forEach((robot) => redirectStaleAisles(robot, world, robots, focusMap));
    robots.forEach((robot) => {
      if (robot.isIdle()) sendToWork(robot, world, robots, focusMap);
    });

    // Scenario 2: cargo spawned while a robot is already committed to a
    // downward path through the aisle zone. If the new aisle lies below the
    // robot's current target aisle (i.e. between it and the truck zone) and
    // the package destination is relevant, insert it into the queue so the
    // robot stops there on the way down — zero extra travel cost.
    const aisleIds = new Set(world.getAisles().map((a) => a.id));
    const truckIds = new Set(world.getTrucks().map((t) => t.id));

    robots.forEach((robot) => {
      if (!robot.hasCargo() || robot.getAvailableCapacity() === 0) {
        return;
      }

      const focus = focusMap.get(robot.id) ?? null;
      if (focus === null) {
        return;
      }

      // Only intercept while the robot is still visiting aisles (not yet in truck zone).
      const targetStop = robot.getTargetStop();
      if (targetStop === null || truckIds.has(targetStop)) {
        return;
      }

      const newAisleId = cargo.aisle.id;

      // Skip if already in the plan.
      if (targetStop === newAisleId || robot.getQueuedStops().includes(newAisleId)) {
        return;
      }

      // Only useful if the new aisle is below the current target (on the way down).
      if (newAisleId >= targetStop) {
        return;
      }

      // Only pick up if the package goes somewhere we care about.
      const passByIds = new Set([...truckIds].filter((id) => id > focus));
      if (cargo.destination !== focus && !passByIds.has(cargo.destination)) {
        return;
      }

      // Rebuild queue: insert new aisle in descending-ID order, then trucks.
      const queued = robot.getQueuedStops();
      const queuedAisles = queued.filter((s) => aisleIds.has(s));
      const queuedTrucks = queued.filter((s) => truckIds.has(s));

      robot.clearQueue();

      [...queuedAisles, newAisleId]
        .sort((a, b) => b - a) // descending: visit nearest-to-robot first
        .forEach((s) => robot.goTo(s));

      getOptimalDeliveryOrder(queuedTrucks, newAisleId).forEach((d) => robot.goTo(d));
    });
  });
};

// ---------------------------------------------------------------------------
// Stop handler
// ---------------------------------------------------------------------------

function handleStop(
  robot: Robot,
  stop: StopId,
  world: WorldAPI,
  robots: Robot[],
  focusMap: Map<number, StopId | null>,
) {
  const isAisle = world.getAisles().some((a) => a.id === stop);

  if (isAisle) {
    // Choose a focus destination the moment we arrive empty.
    if (!robot.hasCargo()) {
      focusMap.set(robot.id, chooseFocus(robot, world, robots, focusMap));
    }

    const focus = focusMap.get(robot.id) ?? null;

    // Primary pick: packages bound for our focus destination.
    if (focus !== null && robot.getAvailableCapacity() > 0) {
      robot.pickUp((pkg) => pkg.destination === focus);
    }

    // Secondary fill: only if no unclaimed focus aisles remain elsewhere, pick
    // up packages for trucks we'll pass on the way to the focus truck.
    // Pass-by trucks are those with IDs between the focus truck and the aisle
    // zone (i.e. truckId > focus, since all aisles have higher stop IDs than
    // all trucks in the linear layout).
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

    // If this aisle is now empty, redirect other robots heading here.
    const thisAisle = world.getAisles().find((a) => a.id === stop);
    if (thisAisle && thisAisle.getWaitingCount() === 0) {
      robots.forEach((r) => {
        if (r !== robot) redirectStaleAisles(r, world, robots, focusMap);
      });
    }

    if (robot.hasCargo()) {
      planRoute(robot, world, robots, focusMap);
    } else {
      robot.clearQueue();
      sendToWork(robot, world, robots, focusMap);
    }
  } else {
    // Truck stop: drop off. Clear focus once the robot is fully empty so a
    // fresh focus is chosen at the next aisle.
    robot.dropOff();
    if (!robot.hasCargo()) {
      focusMap.set(robot.id, null);
    }
  }
}

// ---------------------------------------------------------------------------
// Idle handler
// ---------------------------------------------------------------------------

function handleIdle(
  robot: Robot,
  world: WorldAPI,
  robots: Robot[],
  focusMap: Map<number, StopId | null>,
) {
  if (robot.hasCargo()) {
    planRoute(robot, world, robots, focusMap);
    return;
  }
  focusMap.set(robot.id, null);
  sendToWork(robot, world, robots, focusMap);
}

// ---------------------------------------------------------------------------
// Focus selection
// ---------------------------------------------------------------------------

/**
 * Choose which truck destination this robot should specialise in.
 *
 * Scores each destination as:
 *   uncovered = waiting packages for that dest
 *             - packages already carried by other robots for that dest
 *             - available capacity of robots that are already focused on that dest
 *
 * Highest uncovered demand wins; proximity to the truck breaks ties.
 */
function chooseFocus(
  robot: Robot,
  world: WorldAPI,
  robots: Robot[],
  focusMap: Map<number, StopId | null>,
): StopId | null {
  // Tally waiting packages per destination across all aisles.
  const waiting = new Map<StopId, number>();
  for (const aisle of world.getAisles()) {
    for (const [dest, count] of Object.entries(aisle.getDestinations())) {
      const d = Number(dest);
      waiting.set(d, (waiting.get(d) ?? 0) + count);
    }
  }

  if (waiting.size === 0) {
    return null;
  }

  // Count demand already covered by other robots.
  const covered = new Map<StopId, number>();
  for (const r of robots) {
    if (r === robot) {
      continue;
    }

    // Packages currently on board.
    for (const [dest, count] of Object.entries(r.getCargoSummary().destinations)) {
      const d = Number(dest);
      covered.set(d, (covered.get(d) ?? 0) + count);
    }

    // Capacity being reserved toward another robot's focus.
    const rFocus = focusMap.get(r.id) ?? null;
    if (rFocus !== null) {
      covered.set(rFocus, (covered.get(rFocus) ?? 0) + r.getAvailableCapacity());
    }
  }

  // Pick destination with most uncovered demand; break ties by truck proximity.
  const fromStop = robot.getCurrentStop() ?? robot.getTargetStop() ?? 0;
  let bestDest: StopId | null = null;
  let bestScore = -Infinity;

  for (const [dest, count] of waiting) {
    const uncovered = count - (covered.get(dest) ?? 0);
    // Weight uncovered demand heavily; subtract a small fraction for truck distance.
    const score = uncovered * 100 - Math.abs(dest - fromStop);
    if (score > bestScore) {
      bestScore = score;
      bestDest = dest;
    }
  }

  return bestDest;
}

// ---------------------------------------------------------------------------
// Route planning
// ---------------------------------------------------------------------------

/**
 * Plan the robot's next moves after loading at an aisle.
 * With spare capacity, detour to a nearby aisle that has more focus packages
 * before heading to the truck.
 */
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

  // Priority 2 (scenario 1): no focus aisles left, but the robot may still have
  // spare capacity. Sweep every aisle that sits between the current stop and the
  // truck zone (id < currentStop) and carries focus or pass-by packages — these
  // stops are literally on the path so they cost zero extra travel distance.
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
      // handleStop at each aisle re-plans; the last one queues delivery.
      return;
    }
  }

  // Priority 3: deliver in optimal linear-sweep order (covers focus + pass-by trucks).
  getOptimalDeliveryOrder(robot.getDeliveryStops(), currentStop).forEach((d) => robot.goTo(d));
}

/**
 * Sort delivery stops for a linear sweep starting from currentStop.
 */
function getOptimalDeliveryOrder(stops: StopId[], currentStop: StopId) {
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
// Aisle selection
// ---------------------------------------------------------------------------

/**
 * Dispatch an idle, empty robot toward work.
 * Prefers aisles that have packages for the robot's chosen focus destination.
 */
function sendToWork(
  robot: Robot,
  world: WorldAPI,
  robots: Robot[],
  focusMap: Map<number, StopId | null>,
) {
  const fromStop = robot.getCurrentStop() ?? robot.getTargetStop() ?? 0;

  // Ensure a focus is assigned.
  let focus = focusMap.get(robot.id) ?? null;
  if (focus === null) {
    focus = chooseFocus(robot, world, robots, focusMap);
    focusMap.set(robot.id, focus);
  }

  // Head to the nearest unclaimed aisle that has focus-destination packages.
  if (focus !== null) {
    const focusAisle = findAisleForFocus(world, fromStop, focus, robots, robot);
    if (focusAisle) {
      robot.goTo(focusAisle.id);
      return;
    }
  }

  // Fallback: best available aisle by packages-per-distance score.
  const aisle = pickBestAisle(world, fromStop, robots, robot);
  if (aisle) {
    robot.goTo(aisle.id);
    return;
  }

  // No packages anywhere — park at center aisle for faster response to spawns.
  const center = getCenterAisle(world);
  if (center && robot.getCurrentStop() !== center.id) {
    robot.goTo(center.id);
  }
}

/**
 * Nearest unclaimed aisle that holds at least one package for the focus destination.
 */
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

/**
 * Best unclaimed aisle by packages-per-distance score (fallback when no focus aisle exists).
 */
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

/**
 * Middle aisle by stop ID — good parking spot when idle.
 */
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

/**
 * Remove any now-empty aisles from a robot's queued stops.
 * If the robot is left with no aisle to visit and no cargo, dispatch it.
 */
function redirectStaleAisles(
  robot: Robot,
  world: WorldAPI,
  robots: Robot[],
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

  const hasAisleQueued = cleaned.some((s) => aisleIds.has(s));
  if (!hasAisleQueued && !robot.hasCargo()) {
    sendToWork(robot, world, robots, focusMap);
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
