import type { StarRating, WorldState } from "../types";

export interface Score {
  completionTime: number;
  bronzeTime: number;
  silverTime: number;
  goldTime: number;
  starRating: StarRating | null;
  deliveredCount: number;
  averageWaitTime: number;
  longestWaitTime: number;
}

export function calculateScore(world: WorldState): Score | null {
  if (world.completedAt === null) return null;

  const waitTimes = world.packages
    .filter((p) => p.deliveredAt !== null)
    .map((p) => p.deliveredAt! - p.createdAt);

  const averageWaitTime =
    waitTimes.length > 0 ? waitTimes.reduce((s, t) => s + t, 0) / waitTimes.length : 0;
  const longestWaitTime = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;

  const { bronze, silver, gold } = world.level.completionTime;
  const t = world.completedAt;
  const starRating: StarRating | null =
    t <= gold ? "gold" : t <= silver ? "silver" : t <= bronze ? "bronze" : null;

  return {
    completionTime: world.completedAt,
    bronzeTime: bronze,
    silverTime: silver,
    goldTime: gold,
    starRating,
    deliveredCount: world.deliveredCount,
    averageWaitTime,
    longestWaitTime,
  };
}
