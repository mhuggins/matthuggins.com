import type { RenderingContext2D } from "@matthuggins/platforming-engine";
import { surfaceRadiusAt } from "../../helpers/surfaceRadiusAt";
import type { World } from "../World";
import { Part, RenderLayer } from "./Part";
import type { Planet } from "./Planet";

/** Simple seeded PRNG (mulberry32). */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface TreeConfig {
  planet: Planet;
  angle: number;
  seed: number;
  /** Base leaf hue (0-360). Each leaf varies ±15 around this. */
  leafHue: number;
  /** Base leaf saturation (0-100). */
  leafSat: number;
  /** Base trunk hue (0-360). */
  trunkHue: number;
  /** Base trunk saturation (0-100). */
  trunkSat: number;
}

/** A segment of the tree: a line from (x1,y1) to (x2,y2) with a given width. */
interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
}

/** A leaf rectangle at the tip of a terminal branch. */
interface Leaf {
  x: number;
  y: number;
  angle: number;
  w: number;
  h: number;
  color: string;
}

// Branching parameters (adapted from canvas-tree).
const SPREAD = 0.6; // probability of forking vs continuing straight
const FORK_LEFT = -0.35; // left fork rotation (radians)
const FORK_RIGHT = 0.25; // right fork rotation (radians)
const FORK_SCALE = 0.7; // cumulative scale per fork (affects length, width, and leaf size)
const MAX_GENERATIONS = 10;
const BASE_SEGMENT_LENGTH = 25; // base segment length before cumulative scaling
const BASE_LEAF_SIZE = 80; // base leaf rect size before cumulative scaling

// Padding around the bounding box for the offscreen canvas to avoid clipping.
const CACHE_PADDING = 10;

export class Tree extends Part {
  readonly layer = RenderLayer.WORLD;
  override anchored = true;
  override canCollide = false;

  private planet: Planet;
  private surfaceAngle: number;
  private trunkHeight: number;
  private trunkColor: string;
  private leafHue: number;
  private leafSat: number;
  private segments: Segment[] = [];
  private leaves: Leaf[] = [];

  constructor(world: World, cfg: TreeConfig) {
    super(world);
    this.planet = cfg.planet;
    this.surfaceAngle = cfg.angle;

    const rng = mulberry32(cfg.seed);

    // Trunk color: use config hue/sat with low lightness, slight per-tree variation
    const trunkHue = cfg.trunkHue + (rng() - 0.5) * 20;
    const trunkSat = cfg.trunkSat + (rng() - 0.5) * 10;
    const trunkLight = 18 + rng() * 12; // 18-30%
    this.trunkColor = `hsl(${trunkHue}, ${trunkSat}%, ${trunkLight}%)`;
    this.leafHue = cfg.leafHue;
    this.leafSat = cfg.leafSat;
    this.trunkHeight = 50 + rng() * 50; // 50-100
    const trunkWidth = 8 + rng() * 6; // 8-14

    // Local space: y+ toward planet, y- away. Base at (0, halfH).
    // No separate trunk — the recursive algorithm starts from the base,
    // so the first segments naturally form the trunk.
    const halfH = this.trunkHeight / 2;
    this.grow(rng, 0, halfH, -Math.PI / 2, trunkWidth, 1, 0);

    // Render tree to an offscreen canvas once
    this.buildRenderCache();

    // Free geometry data — no longer needed after caching
    this.segments = [];
    this.leaves = [];

    // Position on planet surface
    this.positionOnPlanet();
  }

  /**
   * Recursively grow the tree following the canvas-tree algorithm.
   * At each step: draw a segment, apply a small random wobble, then either
   * fork into two branches (with probability SPREAD) or continue straight.
   * Forking increments generation and applies FORK_SCALE to the cumulative
   * scale (mirroring canvas-tree's context.scale(0.7, 0.7)).
   * Continuing straight does NOT increment generation or scale.
   */
  private grow(
    rng: () => number,
    x: number,
    y: number,
    angle: number,
    baseWidth: number,
    scale: number,
    generation: number,
  ): void {
    if (generation >= MAX_GENERATIONS) {
      // Terminal — place a leaf rectangle, sized by cumulative scale
      const hue = this.leafHue + (rng() - 0.5) * 30;
      const sat = this.leafSat + (rng() - 0.5) * 20;
      const light = 35 + rng() * 30; // 35-65%
      const leafSize = BASE_LEAF_SIZE * scale;
      this.leaves.push({
        x,
        y,
        angle,
        w: leafSize,
        h: leafSize,
        color: `hsla(${hue}, ${sat}%, ${light}%, 0.85)`,
      });
      return;
    }

    // Segment length and width are the base values * cumulative scale
    const length = BASE_SEGMENT_LENGTH * scale;
    const width = baseWidth * scale;

    // Draw a segment in the current direction
    const ex = x + Math.cos(angle) * length;
    const ey = y + Math.sin(angle) * length;
    this.segments.push({ x1: x, y1: y, x2: ex, y2: ey, width });

    // Small random wobble (matching canvas-tree's -(0.1*random)+0.1)
    const wobble = (rng() - 0.5) * 0.2;
    const newAngle = angle + wobble;

    if (rng() < SPREAD) {
      // Fork: scale down and increment generation (mirrors context.scale(0.7, 0.7))
      const newScale = scale * FORK_SCALE;
      this.grow(rng, ex, ey, newAngle + FORK_LEFT, baseWidth, newScale, generation + 1);
      this.grow(rng, ex, ey, newAngle + FORK_RIGHT, baseWidth, newScale, generation + 1);
    } else {
      // Continue straight — same scale, same generation
      this.grow(rng, ex, ey, newAngle, baseWidth, scale, generation);
    }
  }

  /** Compute bounding box and build the offscreen render cache. */
  protected override buildRenderCache(): void {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const seg of this.segments) {
      const hw = seg.width / 2;
      minX = Math.min(minX, seg.x1 - hw, seg.x2 - hw);
      minY = Math.min(minY, seg.y1 - hw, seg.y2 - hw);
      maxX = Math.max(maxX, seg.x1 + hw, seg.x2 + hw);
      maxY = Math.max(maxY, seg.y1 + hw, seg.y2 + hw);
    }

    for (const leaf of this.leaves) {
      const d = Math.hypot(leaf.w, leaf.h);
      minX = Math.min(minX, leaf.x - d);
      minY = Math.min(minY, leaf.y - d);
      maxX = Math.max(maxX, leaf.x + d);
      maxY = Math.max(maxY, leaf.y + d);
    }

    const w = Math.ceil(maxX - minX) + CACHE_PADDING * 2;
    const h = Math.ceil(maxY - minY) + CACHE_PADDING * 2;
    const originX = minX - CACHE_PADDING;
    const originY = minY - CACHE_PADDING;

    super.buildRenderCache(w, h, originX, originY);
  }

  private positionOnPlanet(): void {
    const surfR = surfaceRadiusAt(this.planet, this.surfaceAngle);
    const nx = Math.cos(this.surfaceAngle);
    const ny = Math.sin(this.surfaceAngle);
    this.x = this.planet.x + nx * (surfR + this.trunkHeight * 0.5);
    this.y = this.planet.y + ny * (surfR + this.trunkHeight * 0.5);
    this.rotation = this.surfaceAngle + Math.PI / 2;
  }

  doUpdate(): void {
    // Static — no update logic needed.
  }

  doRender(ctx: RenderingContext2D): void {
    // Draw branch segments
    ctx.strokeStyle = this.trunkColor;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const seg of this.segments) {
      ctx.lineWidth = seg.width;
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
      ctx.stroke();
    }

    // Draw leaf rectangles
    for (const leaf of this.leaves) {
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.angle);
      ctx.fillStyle = leaf.color;
      ctx.fillRect(0, 0, leaf.w, leaf.h);
      ctx.restore();
    }
  }
}
