import type { WorldState } from "../types";

/**
 * Mulberry32 PRNG — single 32-bit integer state, good statistical quality.
 *
 * Mutates `world.rngState` in place so the state is always part of WorldState
 * and survives serialization across web-worker message boundaries.
 *
 * Returns a value in [0, 1).
 */
export function randNext(world: Pick<WorldState, "rngState">): number {
  world.rngState = (world.rngState + 0x6d2b79f5) | 0;
  let t = Math.imul(world.rngState ^ (world.rngState >>> 15), 1 | world.rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
}
