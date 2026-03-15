import { Star } from "../types";

const CELL_SIZE = 500;
const STARS_PER_CELL = 4;
const VIEW_RADIUS = 2500;

/**
 * Manages an infinite, deterministic starfield using a chunk/cell system.
 * Stars are spawned and despawned as the player moves through the world.
 */
export class Starfield {
  private cells = new Map<string, Star[]>();

  /** All currently active stars. */
  readonly stars: Star[] = [];

  constructor(cx: number, cy: number) {
    this.update(cx, cy);
  }

  /** Call each frame (or when the player moves significantly) to spawn/despawn cells. */
  update(px: number, py: number): void {
    const minCellX = Math.floor((px - VIEW_RADIUS) / CELL_SIZE);
    const maxCellX = Math.floor((px + VIEW_RADIUS) / CELL_SIZE);
    const minCellY = Math.floor((py - VIEW_RADIUS) / CELL_SIZE);
    const maxCellY = Math.floor((py + VIEW_RADIUS) / CELL_SIZE);

    // Despawn cells outside the window.
    for (const [key, cellStars] of this.cells) {
      const [kx, ky] = key.split(",").map(Number);
      if (kx < minCellX || kx > maxCellX || ky < minCellY || ky > maxCellY) {
        // Remove stars from the flat array.
        for (const star of cellStars) {
          const idx = this.stars.indexOf(star);
          if (idx !== -1) {
            // Swap-remove for O(1).
            this.stars[idx] = this.stars[this.stars.length - 1];
            this.stars.pop();
          }
        }
        this.cells.delete(key);
      }
    }

    // Spawn new cells inside the window.
    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const key = `${cx},${cy}`;
        if (!this.cells.has(key)) {
          const cellStars = generateCellStars(cx, cy);
          this.cells.set(key, cellStars);
          for (const star of cellStars) {
            this.stars.push(star);
          }
        }
      }
    }
  }
}

/** Simple integer hash for deterministic per-cell star placement. */
function hash(a: number, b: number, seed: number): number {
  let h = (a * 374761393 + b * 668265263 + seed * 2147483647) | 0;
  h = (h ^ (h >> 13)) * 1274126177;
  h = h ^ (h >> 16);
  return h;
}

function generateCellStars(cx: number, cy: number): Star[] {
  const stars: Star[] = [];
  const baseX = cx * CELL_SIZE;
  const baseY = cy * CELL_SIZE;

  for (let i = 0; i < STARS_PER_CELL; i++) {
    const h1 = hash(cx, cy, i * 3 + 0);
    const h2 = hash(cx, cy, i * 3 + 1);
    const h3 = hash(cx, cy, i * 3 + 2);

    stars.push({
      x: baseX + ((h1 & 0x7fffffff) % CELL_SIZE),
      y: baseY + ((h2 & 0x7fffffff) % CELL_SIZE),
      r: (Math.abs(h3) % 3) + 0.8,
      a: 0.18 + (Math.abs(h3 >> 8) % 5) * 0.08,
    });
  }

  return stars;
}
