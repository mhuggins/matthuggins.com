import type { WorldState } from "../types";

export interface Score {
  completionTime: number;
  timeGoal: number;
  success: boolean;
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

  return {
    completionTime: world.completedAt,
    timeGoal: world.level.time,
    success: world.completedAt <= world.level.time,
    deliveredCount: world.deliveredCount,
    averageWaitTime,
    longestWaitTime,
  };
}
