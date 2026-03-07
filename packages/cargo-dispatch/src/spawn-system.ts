import type { GamePackage, WorldState } from "./types";

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

interface SpawnedInfo {
  aisle: number;
  destination: number;
}

export function updateSpawn(world: WorldState, dt: number): SpawnedInfo | null {
  if (world.spawnedCount >= world.level.totalPackages) return null;
  if (world.completedAt !== null) return null;

  world.nextSpawnIn -= dt;
  if (world.nextSpawnIn > 0) return null;

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
  return { aisle: aisle.stop, destination: truck.stop };
}
