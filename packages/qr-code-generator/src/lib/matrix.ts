import QRCode from "qrcode";
import type { ErrorCorrection } from "../types";

/** Finder patterns are always a 7x7 block in three of the four corners. */
export const FINDER_SIZE = 7;

/** Row and column that carry the timing pattern, for every version. */
const TIMING_INDEX = 6;

/** Alignment patterns are a 5x5 block centered on their coordinate. */
const ALIGNMENT_RADIUS = 2;

/** Modules of empty space the spec requires around the symbol. */
export const QUIET_ZONE = 4;

export interface QrMatrix {
  /** Width of the symbol in modules, excluding the quiet zone. */
  size: number;
  version: number;
  /** `modules[row][col]` is true for a dark module. */
  modules: readonly (readonly boolean[])[];
}

export interface ModuleRange {
  /** First covered index, inclusive. */
  start: number;
  /** Last covered index, inclusive. */
  end: number;
}

/**
 * Encode `data` and expand the packed bit matrix into rows of booleans, which
 * is what the path builders and tests want to work with.
 *
 * Throws when the data is too long for the chosen error correction level; the
 * caller surfaces that as a validation message rather than crashing.
 */
export function createMatrix(data: string, errorCorrectionLevel: ErrorCorrection): QrMatrix {
  const qr = QRCode.create(data, { errorCorrectionLevel });
  const { size } = qr.modules;
  const modules: boolean[][] = [];

  for (let row = 0; row < size; row++) {
    const cells: boolean[] = [];
    for (let col = 0; col < size; col++) {
      cells.push(qr.modules.data[row * size + col] === 1);
    }
    modules.push(cells);
  }

  return { size, version: qr.version, modules };
}

/** Top-left corner of each finder pattern, in module coordinates. */
export function finderOrigins(size: number): readonly { row: number; col: number }[] {
  return [
    { row: 0, col: 0 },
    { row: 0, col: size - FINDER_SIZE },
    { row: size - FINDER_SIZE, col: 0 },
  ];
}

/** True when a module belongs to one of the three finder patterns. */
export function isFinderModule(size: number, row: number, col: number): boolean {
  return finderOrigins(size).some(
    (origin) =>
      row >= origin.row &&
      row < origin.row + FINDER_SIZE &&
      col >= origin.col &&
      col < origin.col + FINDER_SIZE,
  );
}

/**
 * Center coordinates of the alignment patterns for a version, per ISO/IEC
 * 18004 table E.1. The spec publishes these as a lookup table; this is the
 * usual closed form, including the documented exception at version 32.
 */
export function alignmentCoords(version: number): readonly number[] {
  if (version === 1) {
    return [];
  }

  const count = Math.floor(version / 7) + 2;
  const size = version * 4 + 17;
  const interval = size === 145 ? 26 : Math.ceil((size - 13) / (2 * count - 2)) * 2;

  const coords = [size - FINDER_SIZE];
  for (let index = 1; index < count - 1; index++) {
    coords.push(coords[index - 1] - interval);
  }
  coords.push(TIMING_INDEX);

  return coords.reverse();
}

/**
 * True for the timing and alignment patterns, which are structure rather than
 * data: they are what a reader uses to lock onto the module grid.
 *
 * These stay plain squares whatever module shape is selected. Left dotted they
 * break the grid estimate outright, and every dotted code in the decode harness
 * failed to be recognized at all until they were kept solid.
 *
 * Finder modules are excluded because they are drawn separately, in their own
 * shape.
 */
export function isStructuralModule(matrix: QrMatrix, row: number, col: number): boolean {
  if (isFinderModule(matrix.size, row, col)) {
    return false;
  }
  if (row === TIMING_INDEX || col === TIMING_INDEX) {
    return true;
  }

  const coords = alignmentCoords(matrix.version);
  return coords.some((centerRow) =>
    coords.some(
      (centerCol) =>
        // The corners where an alignment pattern would collide with a finder
        // pattern simply have no alignment pattern.
        !isFinderModule(matrix.size, centerRow, centerCol) &&
        Math.abs(row - centerRow) <= ALIGNMENT_RADIUS &&
        Math.abs(col - centerCol) <= ALIGNMENT_RADIUS,
    ),
  );
}

/**
 * The square block of modules hidden behind a center logo.
 *
 * The span is forced odd so it stays centered on the symbol (which is always an
 * odd number of modules wide), and it includes one module of breathing room on
 * each side so the plate never crowds the surrounding data.
 */
export function logoClearRange(size: number, ratio: number): ModuleRange | null {
  if (ratio <= 0) {
    return null;
  }

  let span = Math.ceil(size * ratio) + 2;
  if ((size - span) % 2 !== 0) {
    span += 1;
  }
  span = Math.min(span, size);

  const start = Math.floor((size - span) / 2);
  return { start, end: start + span - 1 };
}

/** True when a module falls inside `range` on both axes. */
export function isInRange(range: ModuleRange | null, row: number, col: number): boolean {
  if (!range) {
    return false;
  }
  return row >= range.start && row <= range.end && col >= range.start && col <= range.end;
}
