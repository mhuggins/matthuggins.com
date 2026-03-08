import type { GamePackage, WorldState } from "../types";
import { randNext } from "./rng";

interface SpawnedInfo {
  aisle: number;
  destination: number;
}

export function updateSpawn(world: WorldState): SpawnedInfo | null {
  if (world.spawnedCount >= world.level.packages.count) return null;
  if (world.completedAt !== null) return null;
  if (world.time < world.spawnSchedule[world.spawnedCount]!) return null;

  const aisleIndex = Math.floor(randNext(world) * world.aisles.length);
  const truckIndex = Math.floor(randNext(world) * world.trucks.length);
  const aisle = world.aisles[aisleIndex]!;
  const truck = world.trucks[truckIndex]!;

  const pkg: GamePackage = {
    id: world.nextPackageId++,
    origin: aisle.stop,
    destination: truck.stop,
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
