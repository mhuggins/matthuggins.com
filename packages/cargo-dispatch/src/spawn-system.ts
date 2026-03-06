import type { GamePackage, WorldState } from "./types.js";

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function updateSpawn(world: WorldState, dt: number): void {
  if (world.spawnedCount >= world.level.totalPackages) return;
  if (world.completedAt !== null) return;

  world.nextSpawnIn -= dt;
  if (world.nextSpawnIn > 0) return;

  const [minInterval, maxInterval] = world.level.spawnInterval;
  world.nextSpawnIn = randomBetween(minInterval, maxInterval);

  const aisleIndex = Math.floor(Math.random() * world.aisles.length);
  const truckIndex = Math.floor(Math.random() * world.trucks.length);
  const aisle = world.aisles[aisleIndex]!;
  const truck = world.trucks[truckIndex]!;

  const pkg: GamePackage = {
    id: world.nextPackageId++,
    from: aisle.stop,
    to: truck.stop,
    color: truck.color,
    createdAt: world.time,
    pickedUpAt: null,
    deliveredAt: null,
  };

  aisle.waiting.push(pkg);
  world.packages.push(pkg);
  world.spawnedCount++;
}
