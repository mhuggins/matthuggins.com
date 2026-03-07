# Cargo Dispatch

A Warehouse Version of Elevator Saga

## Core Entities

| Elevator Saga         | Warehouse Version |
| --------------------- | ----------------- |
| Elevator              | Delivery robot    |
| Floor                 | Aisle             |
| Passenger             | Package           |
| Passenger destination | Truck bay         |
| Elevator capacity     | Robot cargo slots |

---

## Where Packages Come From

You were thinking correctly: **packages should spawn randomly over time**, just like passengers.

The easiest mental model:

> Workers in aisles finish packing boxes and place them on a staging belt.

So packages appear like this:

```
time 0s: aisle 3 → truck B
time 4s: aisle 1 → truck A
time 7s: aisle 5 → truck C
time 9s: aisle 3 → truck B
```

Exactly like:

```
floor 3 → floor 8
floor 1 → floor 2
```

---

## Spawn Model Options

### Option 1 — Pure Random (Closest to Elevator Saga)

Every few seconds:

```
spawn package:
  aisle = random
  truck = random
```

Pros:

* simple
* unpredictable
* endless mode

Cons:

* less strategic.

---

### Option 2 — Queue Per Aisle (Very Clean Mechanically)

Each aisle maintains a **package queue**.

Example:

```
Aisle 1: [Truck B, Truck C]
Aisle 2: []
Aisle 3: [Truck A]
Aisle 4: [Truck A, Truck B, Truck B]
```

Robots pull packages when they stop there.

Spawn logic:

```
every 2–4 seconds
  pick random aisle
  add package with random truck
```

---

### Option 3 — Waves (Great for Score-Based Levels)

Instead of infinite spawn:

```
Level 1:
20 packages total

Level 2:
40 packages
```

This lets you measure **completion speed**.

This fits your idea of a **finish condition**.

---

## Robot Behavior (Simple Model)

Robots move on a **single warehouse lane**.

Example layout:

```
Truck A
Truck B
Truck C
=========
Aisle 1
Aisle 2
Aisle 3
Aisle 4
Aisle 5
```

Robots move vertically.

Stops are:

```
Aisle 1
Aisle 2
...
Truck A
Truck B
Truck C
```

So it's basically **floors again**.

---

## Robot Capacity

Example:

```
robot.maxCapacity = 4
```

Packages stay inside until reaching their truck.

---

## Events for Player Code

Exactly like Elevator Saga.

Example API:

```javascript
robot.onIdle(function() {
    robot.goToAisle(3);
});

robot.onPackageAvailable(function(aisle) {
    robot.goToAisle(aisle);
});

robot.onArrive(function(location) {
    robot.pickupPackages();
    robot.dropoffPackages();
});
```

---

## Visual Layout (Very Simple)

You could render it like:

```
Truck A   [ ]
Truck B   [ ]
Truck C   [ ]

--------------
Aisle 1   📦📦
Aisle 2   📦
Aisle 3
Aisle 4   📦📦📦
Aisle 5
```

Robots move between rows.

---

## Difficulty Scaling

Easy ways to increase difficulty:

### 1. More aisles

```
5 → 10 → 20
```

### 2. More robots

### 3. Truck deadlines

```
Truck B departs in 30 seconds
```

### 4. Package priority

```
🚨 urgent shipment
```

---

## What's Best About This Idea

Compared to traffic lights, this version has:

✅ **clear goals**
✅ **easy visual logic**
✅ **perfect analogy to Elevator Saga**
✅ **simple grid world**
✅ **easy scoring**

Traffic lights are great but become **simulation-heavy** quickly.

---

## One Twist That Would Make This Game Really Good

Give packages **colors matching trucks**.

Example:

```
🔴 Truck A
🔵 Truck B
🟢 Truck C
```

Then aisles look like:

```
Aisle 3:
🔴 🔴 🔵
```

Robots pick up mixed cargo.

Players must route efficiently.

---

## 1. Game loop architecture

You want the game split into a few simple pieces:

### Engine

Responsible for:

* ticking time forward
* updating robot movement
* spawning packages
* handling pickups/dropoffs
* calculating score / win condition

### World state

Contains:

* aisles
* trucks
* robots
* waiting packages
* delivered packages
* current time

### Player controller

Runs the user’s code and lets it react to events like:

* robot became idle
* package appeared at aisle
* robot stopped at a location

### Renderer

Draws the current world:

* simple 2D layout
* package counts/colors
* robot positions
* truck bays

---

### Suggested project structure

```text
/src
  game.js
  engine.js
  world.js
  robot.js
  package.js
  level.js
  renderer.js
  sandbox.js
  api.js
  scoring.js
  main.js
```

---

## 2. Core simulation model

Keep the world as close to Elevator Saga as possible.

### Locations

Treat every stop as a numbered node on one vertical track.

Example:

```text
0 = Truck A
1 = Truck B
2 = Truck C
3 = Aisle 1
4 = Aisle 2
5 = Aisle 3
6 = Aisle 4
7 = Aisle 5
```

That means robots are basically elevators moving between stops.

---

### Packages

Each package needs:

```javascript
{
  id: 12,
  from: 5,       // aisle stop
  to: 1,         // truck stop
  color: "blue",
  createdAt: 18.2,
  pickedUpAt: null,
  deliveredAt: null
}
```

For the first version:

* packages only spawn in aisles
* packages only get delivered to trucks
* packages wait in a queue at their aisle until picked up

That keeps things very understandable.

---

### Robots

Each robot needs:

```javascript
{
  id: 0,
  position: 3.0,          // continuous position between stops
  targetStop: 5,
  stopQueue: [],
  direction: 1,           // -1, 0, 1
  speed: 1.5,             // stops per second
  capacity: 4,
  cargo: [],
  state: "moving"         // or "idle", "stopped"
}
```

Important idea:

* `position` can be continuous for smooth animation
* stops are integers

---

### Aisles

Each aisle just holds waiting packages:

```javascript
{
  stop: 4,
  waiting: [pkg1, pkg2, pkg3]
}
```

---

### Trucks

Each truck is a delivery destination:

```javascript
{
  stop: 1,
  name: "Truck B",
  acceptedColor: "blue",
  deliveredCount: 0
}
```

You do not even need truck behavior at first. They’re just dropoff nodes.

---

## 3. Win condition and level style

You mentioned wanting a defined finish. I agree.

The cleanest first version is:

### Wave-based levels

A level contains:

* fixed number of aisles
* fixed number of trucks
* fixed number of robots
* fixed total packages to spawn

Example:

```javascript
{
  aisleCount: 5,
  truckCount: 3,
  robotCount: 2,
  robotCapacity: 4,
  totalPackages: 30,
  spawnInterval: [1.0, 2.5]
}
```

Packages spawn over time until `totalPackages` is reached.

The player wins when:

* all packages have spawned
* no packages are waiting
* no packages are in robot cargo

That gives a clean completion time.

---

## 4. Spawning packages

Yes — packages should appear over time at random aisles, just like passengers.

### Good first approach

Spawn one package every random interval:

```javascript
nextSpawnIn = randomBetween(1.0, 2.5)
```

When it’s time to spawn:

```javascript
spawnPackage({
  from: randomAisleStop(),
  to: randomTruckStop()
})
```

This is enough for version 1.

---

### Better level design later

You can bias spawns:

* some aisles are busier
* some trucks get more demand
* bursts happen
* urgent packages appear late

But don’t start there.

---

## 5. Engine update loop

A fixed timestep is easiest.

### Main loop

```javascript
const TICK_RATE = 1 / 30; // 30 updates/sec

function update(deltaTime) {
  world.time += deltaTime;

  spawnSystem.update(deltaTime, world);
  for (const robot of world.robots) {
    robot.update(deltaTime, world);
  }

  scoring.update(world);
  checkVictory(world);
}
```

Use `requestAnimationFrame` for rendering, but keep simulation updates deterministic.

---

## 6. Robot behavior in the engine

The engine should control the physics and rules.
The player only chooses intent.

### Robot update steps

Each tick:

1. If robot is moving, move toward target stop
2. If it reaches target stop:

   * snap to exact stop
   * unload matching packages
   * load waiting packages if allowed
   * fire arrival callbacks
3. If queue is empty afterward:

   * mark idle
   * fire idle callback
4. Otherwise move to next queued stop

---

### Simplify loading logic

For version 1, I recommend:

* when robot stops at an aisle, it automatically picks up as many waiting packages as it can
* when robot stops at a truck, it automatically unloads all packages for that truck

This is much simpler than forcing player code to manually load individual packages.

The player’s challenge becomes:

* where to send robots
* in what order
* when to visit trucks vs aisles

That’s the right level of abstraction.

---

## 7. Public scripting sandbox

This is the most important design choice.

You do **not** want the player writing code that directly mutates world state.

They should only interact through a small API.

### Best mental model

User code receives:

* robot objects with safe methods
* world info snapshots
* event hooks

Like this:

```javascript
function init(robots, world) {
  robots.forEach(robot => {
    robot.onIdle(() => {
      const aisle = world.getBusiestAisle();
      if (aisle) robot.goTo(aisle.stop);
    });

    robot.onStop(stop => {
      if (robot.hasDeliveries()) {
        const truckStop = robot.nextDeliveryStop();
        if (truckStop !== null) robot.goTo(truckStop);
      }
    });
  });
}
```

---

### Sandbox options

#### Simplest approach

Use `new Function(...)` with a restricted API object.

This is easiest for a prototype, but not strongly secure.

Example:

```javascript
const userFn = new Function("game", userCode);
userFn(api);
```

For a local toy or prototype, this is fine.

#### Better approach

Run code inside an iframe or Worker with a message-passing API.

That gives better isolation and prevents direct access to the page.

For a browser game, I’d strongly consider:

* **Web Worker** for user code
* engine remains in main thread
* messages pass events and commands

That’s cleaner and safer.

---

## 8. Recommended first sandbox design

For version 1, keep it simple:

* run user code once at level start
* let user register event handlers
* player handlers can only call safe robot methods

Example API exposed to script:

```javascript
init(robots, world)
```

Where `robots` contains safe wrappers, not real robot objects.

---

## 9. Public robot API design

You want something tiny, readable, and discoverable.

### Suggested robot methods

```javascript
robot.goTo(stop)
robot.stop()
robot.getCurrentStop()
robot.getPosition()
robot.getLoad()
robot.getCapacity()
robot.isIdle()
robot.hasCargo()
robot.getCargoSummary()
robot.getQueuedStops()
robot.setLabel(text)
```

---

### Suggested robot events

```javascript
robot.onIdle(callback)
robot.onStop(callback)
robot.onPackagePickedUp(callback)
robot.onPackageDelivered(callback)
```

For version 1, even just these is enough:

```javascript
robot.onIdle(cb)
robot.onStop(cb)
```

---

### World API

```javascript
world.getAisles()
world.getTrucks()
world.getWaitingPackagesAt(stop)
world.getTotalWaitingPackages()
world.getBusiestAisle()
world.getTime()
```

Aisle summaries can look like:

```javascript
{
  stop: 4,
  waitingCount: 3,
  destinations: { 0: 1, 1: 2 }
}
```

That gives useful info without exposing raw mutable state.

---

## 10. Example player solution

Here’s the kind of code you want users to be able to write:

```javascript
function init(robots, world) {
  robots.forEach(robot => {
    robot.onIdle(() => {
      if (robot.hasCargo()) {
        robot.goTo(robot.nextDeliveryStop());
        return;
      }

      const aisle = world.getBusiestAisle();
      if (aisle && aisle.waitingCount > 0) {
        robot.goTo(aisle.stop);
      }
    });

    robot.onStop(stop => {
      if (robot.hasCargo()) {
        robot.goTo(robot.nextDeliveryStop());
        return;
      }

      const aisle = world.getBusiestAisle();
      if (aisle && aisle.waitingCount > 0) {
        robot.goTo(aisle.stop);
      }
    });
  });
}
```

That already feels a lot like Elevator Saga.

---

## 11. Scoring

For a game like this, score should be simple.

### Best primary score

**Completion time**

Then optionally show:

* average package wait time
* longest package wait time
* robot idle percentage
* total distance traveled

Example:

```javascript
{
  completionTime: 48.3,
  averageWait: 7.2,
  longestWait: 19.6,
  totalDistance: 84
}
```

This gives users things to optimize.

---

## 12. Rendering

Do not overbuild the visuals initially.

### Simple layout

Left side:

* trucks at top
* aisles below
* each stop shown as a horizontal row

Right side:

* robots moving on a vertical lane

Each row can show:

* stop label
* waiting packages as colored dots
* truck color/name

Robot can be a small cart icon with small colored dots inside for cargo.

That is plenty.

---

## 13. Minimal first version

This is the version I’d build first.

## Version 1 rules

* 1 vertical track
* 3 trucks
* 5 aisles
* 2 robots
* packages spawn randomly over time
* robot capacity = 4
* robots auto-pickup at aisles
* robots auto-dropoff at trucks
* player code chooses where robots go
* level ends after all packages are delivered

This is enough to prove the concept.

---

## 14. Example internal class sketch

### World

```javascript
class World {
  constructor(level) {
    this.time = 0;
    this.stops = [];
    this.aisles = [];
    this.trucks = [];
    this.robots = [];
    this.packages = [];
    this.spawnedPackages = 0;
    this.deliveredPackages = 0;
    this.level = level;
  }
}
```

### Robot

```javascript
class Robot {
  constructor(id, startStop, capacity = 4) {
    this.id = id;
    this.position = startStop;
    this.targetStop = null;
    this.stopQueue = [];
    this.capacity = capacity;
    this.cargo = [];
    this.speed = 1.5;
    this.listeners = {
      idle: [],
      stop: [],
    };
  }
}
```

---

## 15. Suggested implementation order

This is the order I’d actually build it in:

### Step 1

Build pure simulation with no user code:

* one robot
* one aisle
* one truck
* spawn packages
* robot manually hardcoded

### Step 2

Add multiple aisles and trucks

### Step 3

Add robot capacity and cargo delivery

### Step 4

Add renderer

### Step 5

Expose player API and run custom script

### Step 6

Add multiple robots

### Step 7

Add scoring and victory screen

That path minimizes chaos.

---

## 16. Important simplifications to keep

A few things that sound cool but I would avoid at first:

* pedestrians
* collision physics
* yellow-light timing style safety rules
* battery charging
* multiple warehouse lanes
* package sizes/weights
* loading times per package
* truck departure deadlines

Those can all come later, but they are not needed for the core fun.

---

## 17. My recommendation

If you want the closest thing to Elevator Saga but with your own identity, build:

> **A wave-based warehouse robot routing game where packages appear in aisles over time and must be carried to the correct truck bays by programmable carts with limited capacity.**

That is clean, understandable, and very buildable.

---

## Minimal architecture

### Main thread responsibilities

* create worker
* send initial API bootstrap
* send events like `robotIdle`
* validate commands from worker
* apply commands to real game state

### Worker responsibilities

* evaluate user script
* expose a tiny fake API to that script
* collect handlers like `robot.onIdle(...)`
* when events come in, call those handlers
* send commands back to main thread

---

# 1. Main thread example

This is a minimal browser-side controller.

```javascript
// main.js
const worker = new Worker("./sandbox-worker.js", { type: "module" });

const robots = [
  { id: 1, stop: 3, queuedStops: [], cargoCount: 0 },
  { id: 2, stop: 5, queuedStops: [], cargoCount: 0 },
];

const world = {
  time: 0,
  aisles: [
    { stop: 3, waitingCount: 2 },
    { stop: 4, waitingCount: 0 },
    { stop: 5, waitingCount: 4 },
  ],
  trucks: [
    { stop: 0, name: "Truck A" },
    { stop: 1, name: "Truck B" },
    { stop: 2, name: "Truck C" },
  ],
};

worker.onmessage = (event) => {
  const msg = event.data;

  switch (msg.type) {
    case "ready": {
      console.log("Worker ready");
      break;
    }

    case "log": {
      console.log("[user]", ...msg.args);
      break;
    }

    case "command": {
      handleWorkerCommand(msg.command);
      break;
    }

    case "error": {
      console.error("User script error:", msg.message);
      break;
    }
  }
};

function handleWorkerCommand(command) {
  if (command.type === "goTo") {
    const robot = robots.find((r) => r.id === command.robotId);
    if (!robot) return;

    if (!Number.isInteger(command.stop)) return;
    if (command.stop < 0 || command.stop > 7) return;

    robot.queuedStops.push(command.stop);
    console.log(`Robot ${robot.id} queued stop ${command.stop}`);
  }
}

const userCode = `
function init(robots, world) {
  robots.forEach(robot => {
    robot.onIdle(() => {
      const aisle = world.getBusiestAisle();
      if (aisle) {
        robot.goTo(aisle.stop);
      }
    });

    robot.onStop((stop) => {
      if (robot.hasCargo()) {
        const truckStop = robot.nextDeliveryStop();
        if (truckStop != null) {
          robot.goTo(truckStop);
        }
      }
    });
  });
}
`;

worker.postMessage({
  type: "init",
  userCode,
  snapshot: makeWorldSnapshot(),
});

// Example: later, when your real engine decides robot 1 is idle
setTimeout(() => {
  worker.postMessage({
    type: "event",
    event: {
      type: "robotIdle",
      robotId: 1,
      snapshot: makeWorldSnapshot(),
    },
  });
}, 1000);

// Example: later, when robot 1 stops somewhere
setTimeout(() => {
  robots[0].cargoCount = 1;

  worker.postMessage({
    type: "event",
    event: {
      type: "robotStop",
      robotId: 1,
      stop: 5,
      snapshot: makeWorldSnapshot(),
    },
  });
}, 2000);

function makeWorldSnapshot() {
  return {
    time: world.time,
    aisles: world.aisles.map((a) => ({ ...a })),
    trucks: world.trucks.map((t) => ({ ...t })),
    robots: robots.map((r) => ({
      id: r.id,
      stop: r.stop,
      cargoCount: r.cargoCount,
      queuedStops: [...r.queuedStops],
    })),
  };
}
```

---

## 2. Worker implementation

This worker:

* receives user code
* evaluates it
* provides safe wrappers
* stores event handlers
* emits commands back to the main thread

```javascript
// sandbox-worker.js
const robotHandlers = new Map();
let latestSnapshot = null;

self.postMessage({ type: "ready" });

self.onmessage = (event) => {
  const msg = event.data;

  try {
    if (msg.type === "init") {
      latestSnapshot = msg.snapshot;
      bootUserScript(msg.userCode, msg.snapshot);
      return;
    }

    if (msg.type === "event") {
      latestSnapshot = msg.event.snapshot;
      dispatchEvent(msg.event);
      return;
    }
  } catch (err) {
    self.postMessage({
      type: "error",
      message: err instanceof Error ? err.stack || err.message : String(err),
    });
  }
};

function bootUserScript(userCode, snapshot) {
  robotHandlers.clear();

  const robots = snapshot.robots.map((robotData) => createRobotFacade(robotData.id));
  const world = createWorldFacade();

  const wrappedConsole = {
    log: (...args) => self.postMessage({ type: "log", args }),
  };

  const fn = new Function("console", `${userCode}\n\nreturn init;`);
  const init = fn(wrappedConsole);

  if (typeof init !== "function") {
    throw new Error("User script must define a function named init");
  }

  init(robots, world);
}

function createRobotFacade(robotId) {
  robotHandlers.set(robotId, {
    idle: [],
    stop: [],
  });

  return {
    onIdle(callback) {
      assertFunction(callback, "robot.onIdle(callback)");
      robotHandlers.get(robotId).idle.push(callback);
    },

    onStop(callback) {
      assertFunction(callback, "robot.onStop(callback)");
      robotHandlers.get(robotId).stop.push(callback);
    },

    goTo(stop) {
      if (!Number.isInteger(stop)) {
        throw new Error("robot.goTo(stop) requires an integer stop");
      }

      self.postMessage({
        type: "command",
        command: {
          type: "goTo",
          robotId,
          stop,
        },
      });
    },

    hasCargo() {
      const robot = getRobotSnapshot(robotId);
      return robot ? robot.cargoCount > 0 : false;
    },

    getCargoCount() {
      const robot = getRobotSnapshot(robotId);
      return robot ? robot.cargoCount : 0;
    },

    getCurrentStop() {
      const robot = getRobotSnapshot(robotId);
      return robot ? robot.stop : null;
    },

    nextDeliveryStop() {
      // Minimal placeholder logic.
      // In your real game, snapshot data should include cargo destination summary.
      return 0;
    },
  };
}

function createWorldFacade() {
  return {
    getTime() {
      return latestSnapshot?.time ?? 0;
    },

    getAisles() {
      return latestSnapshot?.aisles.map((a) => ({ ...a })) ?? [];
    },

    getTrucks() {
      return latestSnapshot?.trucks.map((t) => ({ ...t })) ?? [];
    },

    getBusiestAisle() {
      const aisles = latestSnapshot?.aisles ?? [];
      if (aisles.length === 0) return null;

      let best = null;
      for (const aisle of aisles) {
        if (!best || aisle.waitingCount > best.waitingCount) {
          best = aisle;
        }
      }

      return best ? { ...best } : null;
    },
  };
}

function dispatchEvent(event) {
  const handlers = robotHandlers.get(event.robotId);
  if (!handlers) return;

  if (event.type === "robotIdle") {
    for (const handler of handlers.idle) {
      handler();
    }
    return;
  }

  if (event.type === "robotStop") {
    for (const handler of handlers.stop) {
      handler(event.stop);
    }
  }
}

function getRobotSnapshot(robotId) {
  return latestSnapshot?.robots.find((r) => r.id === robotId) ?? null;
}

function assertFunction(value, label) {
  if (typeof value !== "function") {
    throw new Error(`${label} requires a function`);
  }
}
```

---

## 3. What the player script looks like

This is the part the user writes:

```javascript
function init(robots, world) {
  robots.forEach((robot) => {
    robot.onIdle(() => {
      const aisle = world.getBusiestAisle();
      if (aisle && aisle.waitingCount > 0) {
        robot.goTo(aisle.stop);
      }
    });

    robot.onStop((stop) => {
      if (robot.hasCargo()) {
        robot.goTo(robot.nextDeliveryStop());
      } else {
        const aisle = world.getBusiestAisle();
        if (aisle) {
          robot.goTo(aisle.stop);
        }
      }
    });
  });
}
```

---

## 4. Why this is a good fit

This approach gives you a clean boundary:

### The worker can:

* register callbacks
* inspect read-only snapshots
* issue high-level commands

### The worker cannot:

* access DOM
* directly mutate your engine objects
* monkeypatch your renderer
* grab closures from your game engine

That is exactly the kind of boundary you want.

---

## 5. Important limitations

This is where browser workers differ from `isolated-vm`.

### `new Function(...)` inside the worker is still code evaluation

You are still evaluating arbitrary JS. The worker isolates it from your main thread and DOM, but it is not a perfect security boundary against every abuse pattern.

### Infinite loops can still happen

For example:

```javascript
function init(robots, world) {
  while (true) {}
}
```

That would wedge the worker thread.

The good news is you can kill it from the main thread:

```javascript
worker.terminate();
```

and create a fresh worker.

### Message spam is possible

User code could call `robot.goTo(...)` in a tight loop and flood messages unless you rate-limit or validate.

### CPU/memory abuse is still possible

Workers help contain the blast radius, but you still want:

* timeouts
* command quotas
* snapshot size limits

---

## 6. Practical hardening

For your game, I would add these immediately.

### A. Restart worker on timeout

When you send an event, expect a response window.

If it takes too long, kill the worker.

```javascript
function sendEventToWorker(event) {
  const timeoutId = setTimeout(() => {
    console.warn("Worker timed out, terminating");
    worker.terminate();
  }, 50);

  worker.postMessage({ type: "event", event });

  // In a real implementation you'd clear this when the worker
  // sends back an "eventComplete" or similar acknowledgement.
}
```

A better version is to make event handling explicit with request IDs.

---

### B. Validate every command

Never trust worker commands.

```javascript
function handleWorkerCommand(command) {
  if (command.type !== "goTo") return;

  const robot = robots.find((r) => r.id === command.robotId);
  if (!robot) return;

  if (!Number.isInteger(command.stop)) return;
  if (command.stop < 0 || command.stop >= totalStops) return;

  if (robot.queuedStops.length > 10) return;

  robot.queuedStops.push(command.stop);
}
```

---

### C. Use snapshots, not live objects

Never send your real engine instances into the worker.
Always send plain structured-cloneable data.

Good:

```javascript
{
  robots: [{ id: 1, stop: 3, cargoCount: 2 }]
}
```

Bad:

```javascript
worker.postMessage({ robotInstance });
```

---

### D. Keep the API tiny

The smaller the player API, the easier it is to reason about and secure.

Start with:

* `onIdle`
* `onStop`
* `goTo`
* `hasCargo`
* `getBusiestAisle`

That is enough for a first playable prototype.

---

## 7. Better event protocol

A slightly more robust pattern is to make each event a transaction:

* main thread sends event with `eventId`
* worker processes handlers
* worker sends back `eventComplete`

That lets you enforce “all commands from this event must arrive within X ms.”

Example worker addition:

```javascript
function dispatchEvent(event) {
  const handlers = robotHandlers.get(event.robotId);
  if (!handlers) {
    self.postMessage({ type: "eventComplete", eventId: event.eventId });
    return;
  }

  if (event.type === "robotIdle") {
    for (const handler of handlers.idle) {
      handler();
    }
  } else if (event.type === "robotStop") {
    for (const handler of handlers.stop) {
      handler(event.stop);
    }
  }

  self.postMessage({ type: "eventComplete", eventId: event.eventId });
}
```

Then the main thread can timeout if completion never happens.

---

## 8. If you want stricter control than `new Function`

A strong next step is to **not** evaluate arbitrary JS directly.

Instead, you could support a constrained format like:

* one predefined `init` wrapper
* only user-provided handler bodies
* parse with Acorn/Esprima first
* reject forbidden syntax

For example:

* reject `while`
* reject `for(;;)`
* reject `eval`
* reject `importScripts`
* reject `globalThis`
* reject `postMessage`

That gives you much more control.

For a prototype though, the worker model above is enough to prove the concept.

---

## 9. Recommendation for your game

Given your prior `isolated-vm` experience, I’d build it in phases:

### Phase 1

Use exactly the worker pattern above:

* `new Function`
* tiny API
* snapshots only
* validated commands only
* manual timeout + terminate

### Phase 2

Add:

* per-event completion handshake
* command quotas
* worker restart on bad script

### Phase 3

Add AST validation before execution:

* parse user code
* reject disallowed constructs
* then run in worker

That gets you something practical without overengineering the first version.

---

## 10. Tiny single-file demo version

If you want the absolute smallest mental model, here is the essence:

## Main thread

```javascript
const worker = new Worker("worker.js");

worker.onmessage = (e) => {
  if (e.data.type === "command") {
    console.log("Apply command:", e.data.command);
  }
};

worker.postMessage({
  type: "init",
  userCode: `
    function init(robots, world) {
      robots[0].onIdle(() => {
        robots[0].goTo(5);
      });
    }
  `,
  snapshot: {
    robots: [{ id: 1, stop: 0, cargoCount: 0 }],
    aisles: [{ stop: 5, waitingCount: 3 }],
    trucks: [{ stop: 0, name: "Truck A" }],
    time: 0,
  },
});

worker.postMessage({
  type: "event",
  event: {
    type: "robotIdle",
    robotId: 1,
    snapshot: {
      robots: [{ id: 1, stop: 0, cargoCount: 0 }],
      aisles: [{ stop: 5, waitingCount: 3 }],
      trucks: [{ stop: 0, name: "Truck A" }],
      time: 1,
    },
  },
});
```

### Worker

```javascript
let handlers = new Map();
let snapshot = null;

self.onmessage = (e) => {
  const msg = e.data;

  if (msg.type === "init") {
    snapshot = msg.snapshot;

    const robots = msg.snapshot.robots.map((r) => ({
      onIdle(cb) {
        handlers.set(r.id, cb);
      },
      goTo(stop) {
        self.postMessage({
          type: "command",
          command: { type: "goTo", robotId: r.id, stop },
        });
      },
    }));

    const fn = new Function(`${msg.userCode}; return init;`);
    fn()(robots, {});
  }

  if (msg.type === "event" && msg.event.type === "robotIdle") {
    snapshot = msg.event.snapshot;
    const cb = handlers.get(msg.event.robotId);
    if (cb) cb();
  }
};
```

That’s the smallest useful version.

---

## API design goals

A good first API should be:

* **small**
* **predictable**
* **read-only except for a few robot commands**
* **event-driven**
* **easy to learn from examples**

I’d split it into four parts:

1. `init(robots, world)`
2. `robot` methods
3. `robot` events
4. `world` query methods

---

### 1. Entry point

The user writes one function:

```javascript
function init(robots, world) {
  // user logic here
}
```

Where:

* `robots` is an array of robot controller objects
* `world` is a read-only query object

That mirrors Elevator Saga nicely.

---

### 2. Recommended robot API

#### Core command methods

These are the minimum commands I’d expose:

```javascript
robot.goTo(stop)
robot.goToAisle(aisleStop)
robot.goToTruck(truckStop)
robot.stop()
robot.clearQueue()
robot.setQueue(stops)
robot.queueStop(stop)
```

##### Notes

* `goTo(stop)` can mean “append this stop to the queue” or “go immediately if idle.” I would document it clearly.
* `clearQueue()` is useful for strategy changes.
* `setQueue(stops)` is convenient for multi-stop planning.
* `goToAisle` / `goToTruck` are optional sugar methods. Nice for readability.

---

#### Core state methods

```javascript
robot.getId()
robot.getCurrentStop()
robot.getPosition()
robot.getDirection()
robot.getQueuedStops()
robot.isIdle()
robot.isMoving()
```

These help the player reason about current robot state.

---

#### Cargo methods

```javascript
robot.getCargoCount()
robot.getCapacity()
robot.getAvailableCapacity()
robot.hasCargo()
robot.getCargoSummary()
robot.getDeliveryStops()
robot.nextDeliveryStop()
```

##### Suggested shapes

```javascript
robot.getCargoSummary()
```

returns:

```javascript
{
  total: 3,
  byTruck: {
    0: 1,
    2: 2
  }
}
```

And:

```javascript
robot.getDeliveryStops()
```

returns:

```javascript
[0, 2]
```

This is more useful than exposing raw package objects at first.

---

#### Optional debug/helper methods

```javascript
robot.setLabel(text)
robot.debug(value)
```

These are great for UI/debugging later.

For example:

* show “serving Aisle 4”
* show current strategy name over robot

---

### 3. Recommended robot events

I would keep events very small at first.

#### Essential events

```javascript
robot.onIdle(callback)
robot.onStop(callback)
```

These alone are enough to make the game playable.

##### Semantics

###### `robot.onIdle(callback)`

Called when:

* the robot has no queued stops
* it is ready for new instructions

Example:

```javascript
robot.onIdle(() => {
  const aisle = world.getBusiestAisle();
  if (aisle) robot.goTo(aisle.stop);
});
```

###### `robot.onStop(callback)`

Called when:

* the robot arrives at a stop
* auto pickup/dropoff has already happened

Example:

```javascript
robot.onStop((stop) => {
  if (robot.hasCargo()) {
    robot.goTo(robot.nextDeliveryStop());
  }
});
```

---

#### Good optional events

Later, you can add:

```javascript
robot.onCargoChanged(callback)
robot.onPackagePickedUp(callback)
robot.onPackageDelivered(callback)
robot.onPassingStop(callback)
```

But I would not start there unless you know you need them.

---

### 4. Recommended world API

The world object should help the user make routing decisions.

#### Time and basic info

```javascript
world.getTime()
world.getStops()
world.getAisles()
world.getTrucks()
world.getRobots()
```

---

#### Package demand queries

```javascript
world.getWaitingCount(stop)
world.getWaitingSummary(stop)
world.getTotalWaitingCount()
world.getAisle(aisleStop)
world.getBusiestAisle()
world.getAislesWithWaiting()
```

##### Suggested return shapes

```javascript
world.getAisle(4)
```

returns:

```javascript
{
  stop: 4,
  waitingCount: 5,
  destinations: {
    0: 2,
    1: 1,
    2: 2
  }
}
```

```javascript
world.getBusiestAisle()
```

returns either:

```javascript
{
  stop: 5,
  waitingCount: 7,
  destinations: {
    1: 4,
    2: 3
  }
}
```

or `null`.

---

#### Demand filtering helpers

These are very useful and still simple:

```javascript
world.getAislesForTruck(truckStop)
world.getNearestAisleWithWaiting(fromStop)
world.getNearestAisleForTruck(fromStop, truckStop)
```

These save users from rewriting tedious utility logic.

Example:

```javascript
const aisle = world.getNearestAisleWithWaiting(robot.getCurrentStop());
```

---

#### Global stats

```javascript
world.getDeliveredCount()
world.getRemainingPackageCount()
world.getSpawnedCount()
world.getPendingCount()
```

These are nice for advanced strategies.

---

### 5. The API I would actually ship first

If I were building version 1, I would intentionally keep it tiny:

#### Entry point

```javascript
function init(robots, world) {}
```

#### Robot

```javascript
robot.onIdle(callback)
robot.onStop(callback)

robot.goTo(stop)
robot.queueStop(stop)
robot.clearQueue()

robot.getCurrentStop()
robot.getQueuedStops()

robot.hasCargo()
robot.getCargoCount()
robot.getCapacity()
robot.getAvailableCapacity()
robot.nextDeliveryStop()
robot.getDeliveryStops()

robot.isIdle()
```

#### World

```javascript
world.getTime()
world.getAisles()
world.getTrucks()
world.getBusiestAisle()
world.getNearestAisleWithWaiting(fromStop)
world.getWaitingCount(stop)
world.getTotalWaitingCount()
```

That is enough for a surprisingly rich game.

---

### 6. Example API usage

Here’s the kind of solution this API enables:

```javascript
function init(robots, world) {
  robots.forEach((robot) => {
    robot.onIdle(() => {
      if (robot.hasCargo()) {
        robot.goTo(robot.nextDeliveryStop());
        return;
      }

      const aisle = world.getNearestAisleWithWaiting(robot.getCurrentStop());
      if (aisle) {
        robot.goTo(aisle.stop);
      }
    });

    robot.onStop(() => {
      if (robot.hasCargo()) {
        robot.goTo(robot.nextDeliveryStop());
        return;
      }

      const aisle = world.getBusiestAisle();
      if (aisle && aisle.waitingCount > 0) {
        robot.goTo(aisle.stop);
      }
    });
  });
}
```

That already feels good.

---

### 7. Important API semantics to define clearly

This is where a lot of game APIs get messy. I’d define these behaviors early.

#### What does `goTo(stop)` do?

Pick one:

##### Option A — append to queue

```javascript
robot.goTo(5);
robot.goTo(2);
```

means queue `[5, 2]`

##### Option B — immediate intent

If idle, start going now. If moving, append.

I recommend **Option B**, because it feels natural.

---

#### What does `clearQueue()` do while moving?

I recommend:

* current destination remains unless you explicitly support interrupting
* future queued stops are removed

Or, if you want simplicity:

* robot recalculates immediately and heads to next valid target

Either is fine; just document it.

---

#### When does `onStop` fire?

I strongly recommend:

> `onStop` fires **after automatic pickup/dropoff has completed**.

That way the user sees the updated state.

This makes code like this intuitive:

```javascript
robot.onStop(() => {
  if (robot.hasCargo()) {
    robot.goTo(robot.nextDeliveryStop());
  }
});
```

---

#### Does `nextDeliveryStop()` return null?

Yes, if no cargo is onboard.

Document this clearly.

---

### 8. Data model returned by world helpers

Try to return plain shallow objects only.

#### Aisle summary

```javascript
{
  stop: 4,
  waitingCount: 6,
  destinations: {
    0: 3,
    2: 3
  }
}
```

#### Truck summary

```javascript
{
  stop: 1,
  name: "Truck B"
}
```

#### Robot summary from `world.getRobots()`

```javascript
{
  id: 0,
  currentStop: 5,
  cargoCount: 2,
  queuedStops: [1],
  idle: false
}
```

These should be read-only snapshots.

---

### 9. Things I would not expose at first

To keep the API clean, I would avoid exposing:

* raw package objects
* package IDs
* mutable arrays
* robot speed setters
* manual pickup/dropoff
* low-level movement hooks
* direct world mutation
* spawn schedules
* collision controls

Those can all be internal.

---

### 10. Possible documentation style

I’d document it like this:

#### `robot.goTo(stop)`

Queues a stop for the robot to visit.

**Parameters**

* `stop: number`

**Returns**

* `void`

**Notes**

* If the robot is idle, it begins moving immediately.
* If the robot is already moving, the stop is appended to its queue.
* Invalid stops are ignored.

---

#### `robot.onIdle(callback)`

Registers a callback that runs when the robot has no remaining queued stops.

**Parameters**

* `callback: () => void`

**Returns**

* `void`

---

#### `world.getBusiestAisle()`

Returns the aisle with the highest waiting package count.

**Returns**

* `{ stop, waitingCount, destinations } | null`

---

# 11. A clean “v1” full API proposal

Here’s the concrete proposal I’d suggest.

#### Entry point

```javascript
function init(robots, world) {}
```

#### Robot API

```javascript
robot.onIdle(callback)
robot.onStop(callback)

robot.goTo(stop)
robot.queueStop(stop)
robot.clearQueue()

robot.getId()
robot.getCurrentStop()
robot.getPosition()
robot.getQueuedStops()

robot.isIdle()
robot.isMoving()

robot.hasCargo()
robot.getCargoCount()
robot.getCapacity()
robot.getAvailableCapacity()
robot.getCargoSummary()
robot.getDeliveryStops()
robot.nextDeliveryStop()

robot.setLabel(text)
```

#### World API

```javascript
world.getTime()

world.getAisles()
world.getTrucks()
world.getRobots()

world.getAisle(stop)
world.getTruck(stop)

world.getWaitingCount(stop)
world.getWaitingSummary(stop)
world.getTotalWaitingCount()

world.getBusiestAisle()
world.getAislesWithWaiting()
world.getNearestAisleWithWaiting(fromStop)
world.getNearestAisleForTruck(fromStop, truckStop)

world.getDeliveredCount()
world.getRemainingPackageCount()
```

---

### 12. Strongest recommendation

For the first playable version, cut it down even further to this:

```javascript
function init(robots, world) {}

robot.onIdle(callback)
robot.onStop(callback)

robot.goTo(stop)
robot.clearQueue()

robot.getCurrentStop()
robot.hasCargo()
robot.getCargoCount()
robot.nextDeliveryStop()

world.getBusiestAisle()
world.getNearestAisleWithWaiting(fromStop)
world.getTotalWaitingCount()
world.getTime()
```

That tiny API is enough to build:

* naive strategies
* nearest-demand strategies
* load-then-deliver strategies
* multi-robot coordination

without overwhelming the player.

---

## `api.ts`

Here’s a clean **v1 TypeScript API proposal** for the game, plus concise docs and a sample strategy.

```ts
export type StopId = number;

export interface AisleSummary {
  stop: StopId;
  waitingCount: number;
  destinations: Record<StopId, number>;
}

export interface TruckSummary {
  stop: StopId;
  name: string;
}

export interface RobotSummary {
  id: number;
  currentStop: StopId | null;
  cargoCount: number;
  queuedStops: StopId[];
  idle: boolean;
}

export interface CargoSummary {
  total: number;
  byTruck: Record<StopId, number>;
}

export interface RobotController {
  /**
   * Register a callback that fires when the robot has no more queued stops
   * and is ready for instructions.
   */
  onIdle(callback: () => void): void;

  /**
   * Register a callback that fires after the robot arrives at a stop and
   * automatic pickup/dropoff has already completed.
   */
  onStop(callback: (stop: StopId) => void): void;

  /**
   * Queue a stop for the robot to visit.
   * If idle, the robot begins moving immediately.
   */
  goTo(stop: StopId): void;

  /**
   * Remove any future queued stops.
   * Does not necessarily interrupt the current in-progress movement.
   */
  clearQueue(): void;

  /** Unique robot id. */
  getId(): number;

  /**
   * Current exact stop, or null if between stops.
   * For v1, this is often enough; continuous position can be added later.
   */
  getCurrentStop(): StopId | null;

  /** Whether the robot is currently idle. */
  isIdle(): boolean;

  /** Whether the robot currently holds at least one package. */
  hasCargo(): boolean;

  /** Number of packages currently onboard. */
  getCargoCount(): number;

  /**
   * Returns the next truck stop that has at least one package onboard,
   * or null if the robot has no cargo.
   */
  nextDeliveryStop(): StopId | null;

  /**
   * Returns a summary of onboard cargo grouped by destination truck.
   */
  getCargoSummary(): CargoSummary;

  /**
   * Optional UI/debug helper.
   * Lets the player's script label the robot in the interface.
   */
  setLabel(text: string): void;
}

export interface WorldAPI {
  /** Current simulation time in seconds. */
  getTime(): number;

  /** All aisles in the level. */
  getAisles(): AisleSummary[];

  /** All trucks in the level. */
  getTrucks(): TruckSummary[];

  /** Current read-only summaries of all robots. */
  getRobots(): RobotSummary[];

  /**
   * Total number of waiting packages across all aisles.
   */
  getTotalWaitingCount(): number;

  /**
   * Number of waiting packages at the given stop.
   * Returns 0 if the stop is not an aisle or nothing is waiting there.
   */
  getWaitingCount(stop: StopId): number;

  /**
   * Returns the busiest aisle, or null if no packages are waiting.
   */
  getBusiestAisle(): AisleSummary | null;

  /**
   * Returns the nearest aisle with waiting packages, measured relative
   * to the provided stop. Returns null if none are waiting anywhere.
   */
  getNearestAisleWithWaiting(fromStop: StopId): AisleSummary | null;
}

/**
 * Entry point that player code must define.
 */
export type PlayerInit = (
  robots: RobotController[],
  world: WorldAPI,
) => void;
```

---

## Minimal API semantics

These are the behavior rules I’d document alongside the interfaces.

### `onIdle(callback)`

Called when:

* the robot is not moving
* its stop queue is empty
* it is ready for new work

This is the main “decide what to do next” hook.

### `onStop(callback)`

Called when:

* the robot reaches a stop
* automatic unload/load is already done

That means `robot.hasCargo()` and `robot.nextDeliveryStop()` reflect the updated state.

### `goTo(stop)`

Queues a stop for the robot.
Recommended v1 behavior:

* if idle: start moving immediately
* if already moving: append to queue

### `clearQueue()`

Clears future queued stops.
For v1, I’d keep this simple and say it does **not** interrupt the robot mid-travel unless you later decide to support rerouting.

### `nextDeliveryStop()`

Returns:

* a truck stop id if cargo exists
* `null` if no cargo exists

### `getCurrentStop()`

Returns:

* a stop id if exactly aligned to a stop
* `null` if between stops

This avoids exposing floating positions in v1.

---

## Example player script

This is the kind of code your API should support well.

```ts
function init(robots, world) {
  robots.forEach((robot, index) => {
    robot.setLabel(`Bot ${index + 1}`);

    robot.onIdle(() => {
      if (robot.hasCargo()) {
        const truckStop = robot.nextDeliveryStop();
        if (truckStop !== null) {
          robot.goTo(truckStop);
          return;
        }
      }

      const currentStop = robot.getCurrentStop() ?? 0;
      const aisle = world.getNearestAisleWithWaiting(currentStop);

      if (aisle) {
        robot.goTo(aisle.stop);
      }
    });

    robot.onStop(() => {
      if (robot.hasCargo()) {
        const truckStop = robot.nextDeliveryStop();
        if (truckStop !== null) {
          robot.goTo(truckStop);
          return;
        }
      }

      const aisle = world.getBusiestAisle();
      if (aisle) {
        robot.goTo(aisle.stop);
      }
    });
  });
}
```

---

## Slightly smarter sample strategy

This one tries to avoid all robots dogpiling the same aisle by looking at other robots’ queued targets.

```ts
function init(robots, world) {
  function getClaimedStops() {
    const claimed = new Set<number>();

    for (const robot of world.getRobots()) {
      for (const stop of robot.queuedStops) {
        claimed.add(stop);
      }
    }

    return claimed;
  }

  function chooseAisle(robot) {
    const currentStop = robot.getCurrentStop() ?? 0;
    const claimed = getClaimedStops();

    const aisles = world
      .getAisles()
      .filter((a) => a.waitingCount > 0 && !claimed.has(a.stop));

    if (aisles.length === 0) {
      return world.getNearestAisleWithWaiting(currentStop);
    }

    aisles.sort((a, b) => {
      const distA = Math.abs(a.stop - currentStop);
      const distB = Math.abs(b.stop - currentStop);

      if (distA !== distB) return distA - distB;
      return b.waitingCount - a.waitingCount;
    });

    return aisles[0] ?? null;
  }

  robots.forEach((robot, index) => {
    robot.setLabel(`Bot ${index + 1}`);

    function assignWork() {
      if (robot.hasCargo()) {
        const deliveryStop = robot.nextDeliveryStop();
        if (deliveryStop !== null) {
          robot.goTo(deliveryStop);
          return;
        }
      }

      const aisle = chooseAisle(robot);
      if (aisle) {
        robot.goTo(aisle.stop);
      }
    }

    robot.onIdle(assignWork);
    robot.onStop(assignWork);
  });
}
```

---

## Concise docs for each method

### RobotController

#### `robot.onIdle(callback): void`

Registers a callback to run when the robot has no queued work left.

```ts
robot.onIdle(() => {
  const aisle = world.getBusiestAisle();
  if (aisle) robot.goTo(aisle.stop);
});
```

#### `robot.onStop(callback): void`

Registers a callback to run after the robot arrives and auto pickup/dropoff completes.

```ts
robot.onStop((stop) => {
  if (robot.hasCargo()) {
    const truck = robot.nextDeliveryStop();
    if (truck !== null) robot.goTo(truck);
  }
});
```

#### `robot.goTo(stop): void`

Queues a stop for the robot to visit.

```ts
robot.goTo(5);
```

#### `robot.clearQueue(): void`

Clears future queued stops.

```ts
robot.clearQueue();
robot.goTo(4);
```

#### `robot.getId(): number`

Returns the robot’s unique id.

```ts
const id = robot.getId();
```

#### `robot.getCurrentStop(): number | null`

Returns the current stop if aligned exactly to one, otherwise `null`.

```ts
const stop = robot.getCurrentStop();
```

#### `robot.isIdle(): boolean`

Returns whether the robot is idle.

```ts
if (robot.isIdle()) {
  robot.goTo(3);
}
```

#### `robot.hasCargo(): boolean`

Returns whether the robot is carrying any packages.

```ts
if (robot.hasCargo()) {
  robot.goTo(robot.nextDeliveryStop()!);
}
```

#### `robot.getCargoCount(): number`

Returns current onboard package count.

```ts
if (robot.getCargoCount() < 2) {
  // maybe keep collecting
}
```

#### `robot.nextDeliveryStop(): number | null`

Returns the next truck stop for onboard cargo, or `null`.

```ts
const next = robot.nextDeliveryStop();
if (next !== null) robot.goTo(next);
```

#### `robot.getCargoSummary(): CargoSummary`

Returns onboard cargo grouped by truck stop.

```ts
const cargo = robot.getCargoSummary();
// cargo.total
// cargo.byTruck
```

#### `robot.setLabel(text): void`

Sets a UI/debug label for the robot.

```ts
robot.setLabel("Collecting");
```

---

### WorldAPI

#### `world.getTime(): number`

Returns current simulation time in seconds.

```ts
if (world.getTime() > 30) {
  // late-game strategy
}
```

#### `world.getAisles(): AisleSummary[]`

Returns all aisle summaries.

```ts
const aisles = world.getAisles();
```

#### `world.getTrucks(): TruckSummary[]`

Returns all trucks.

```ts
const trucks = world.getTrucks();
```

#### `world.getRobots(): RobotSummary[]`

Returns read-only robot summaries.

```ts
const robots = world.getRobots();
```

#### `world.getTotalWaitingCount(): number`

Returns total waiting packages across all aisles.

```ts
if (world.getTotalWaitingCount() === 0) {
  // maybe focus on deliveries
}
```

#### `world.getWaitingCount(stop): number`

Returns waiting package count at a stop.

```ts
const count = world.getWaitingCount(4);
```

#### `world.getBusiestAisle(): AisleSummary | null`

Returns the aisle with the highest waiting count.

```ts
const aisle = world.getBusiestAisle();
if (aisle) robot.goTo(aisle.stop);
```

#### `world.getNearestAisleWithWaiting(fromStop): AisleSummary | null`

Returns the nearest aisle with waiting packages.

```ts
const aisle = world.getNearestAisleWithWaiting(robot.getCurrentStop() ?? 0);
if (aisle) robot.goTo(aisle.stop);
```

---

## Suggested `d.ts` for user code editor

If you want Monaco or CodeMirror autocomplete later, this kind of ambient declaration is useful:

```ts
declare type StopId = number;

declare interface AisleSummary {
  stop: StopId;
  waitingCount: number;
  destinations: Record<StopId, number>;
}

declare interface TruckSummary {
  stop: StopId;
  name: string;
}

declare interface RobotSummary {
  id: number;
  currentStop: StopId | null;
  cargoCount: number;
  queuedStops: StopId[];
  idle: boolean;
}

declare interface CargoSummary {
  total: number;
  byTruck: Record<StopId, number>;
}

declare interface RobotController {
  onIdle(callback: () => void): void;
  onStop(callback: (stop: StopId) => void): void;
  goTo(stop: StopId): void;
  clearQueue(): void;
  getId(): number;
  getCurrentStop(): StopId | null;
  isIdle(): boolean;
  hasCargo(): boolean;
  getCargoCount(): number;
  nextDeliveryStop(): StopId | null;
  getCargoSummary(): CargoSummary;
  setLabel(text: string): void;
}

declare interface WorldAPI {
  getTime(): number;
  getAisles(): AisleSummary[];
  getTrucks(): TruckSummary[];
  getRobots(): RobotSummary[];
  getTotalWaitingCount(): number;
  getWaitingCount(stop: StopId): number;
  getBusiestAisle(): AisleSummary | null;
  getNearestAisleWithWaiting(fromStop: StopId): AisleSummary | null;
}

declare function init(
  robots: RobotController[],
  world: WorldAPI,
): void;
```
