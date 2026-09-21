import { describe, expect, it } from "vitest";
import {
  alignmentCoords,
  createMatrix,
  FINDER_SIZE,
  isFinderModule,
  isInRange,
  isStructuralModule,
  logoClearRange,
} from "../matrix";

describe("createMatrix", () => {
  it("expands the bit matrix into square rows", () => {
    const matrix = createMatrix("https://matthuggins.com", "M");

    expect(matrix.size).toBeGreaterThan(20);
    expect(matrix.modules).toHaveLength(matrix.size);
    for (const row of matrix.modules) {
      expect(row).toHaveLength(matrix.size);
    }
  });

  it("places a dark finder pattern in the three expected corners", () => {
    const { modules, size } = createMatrix("hello", "M");

    for (const [row, col] of [
      [0, 0],
      [0, size - FINDER_SIZE],
      [size - FINDER_SIZE, 0],
    ]) {
      // Each finder pattern opens with a solid 7-module dark edge.
      expect(modules[row].slice(col, col + FINDER_SIZE)).toEqual(Array(FINDER_SIZE).fill(true));
    }
  });

  it("grows the symbol as error correction goes up", () => {
    const low = createMatrix("https://matthuggins.com/lab/qr-code-generator", "L");
    const high = createMatrix("https://matthuggins.com/lab/qr-code-generator", "H");

    expect(high.size).toBeGreaterThan(low.size);
  });

  it("throws when the data cannot fit", () => {
    expect(() => createMatrix("x".repeat(5000), "H")).toThrow();
  });
});

describe("isFinderModule", () => {
  it("covers the three finder blocks and nothing else", () => {
    const size = 25;

    expect(isFinderModule(size, 0, 0)).toBe(true);
    expect(isFinderModule(size, 6, 6)).toBe(true);
    expect(isFinderModule(size, 0, size - 1)).toBe(true);
    expect(isFinderModule(size, size - 1, 0)).toBe(true);

    expect(isFinderModule(size, 7, 7)).toBe(false);
    // The bottom-right corner never holds a finder pattern.
    expect(isFinderModule(size, size - 1, size - 1)).toBe(false);
  });
});

describe("alignmentCoords", () => {
  // Spot checks against ISO/IEC 18004 table E.1, including the version 32 case
  // the closed form has to special-case.
  it.each([
    [1, []],
    [2, [6, 18]],
    [6, [6, 34]],
    [7, [6, 22, 38]],
    [14, [6, 26, 46, 66]],
    [32, [6, 34, 60, 86, 112, 138]],
    [40, [6, 30, 58, 86, 114, 142, 170]],
  ])("matches the spec table for version %i", (version, expected) => {
    expect(alignmentCoords(version)).toEqual(expected);
  });
});

describe("isStructuralModule", () => {
  const matrix = createMatrix("https://matthuggins.com/lab/qr-code-generator", "M");

  it("covers the timing row and column", () => {
    expect(isStructuralModule(matrix, 6, 10)).toBe(true);
    expect(isStructuralModule(matrix, 10, 6)).toBe(true);
  });

  it("covers the alignment patterns", () => {
    const center = alignmentCoords(matrix.version).at(-1);
    if (center === undefined) {
      throw new Error("expected an alignment pattern");
    }

    expect(isStructuralModule(matrix, center, center)).toBe(true);
    expect(isStructuralModule(matrix, center + 2, center + 2)).toBe(true);
    expect(isStructuralModule(matrix, center + 3, center + 3)).toBe(false);
  });

  it("leaves the finder patterns to their own renderer", () => {
    expect(isStructuralModule(matrix, 6, 6)).toBe(false);
    expect(isStructuralModule(matrix, 0, 0)).toBe(false);
  });
});

describe("logoClearRange", () => {
  it("returns null when there is no logo", () => {
    expect(logoClearRange(25, 0)).toBeNull();
  });

  it("stays centered on the symbol", () => {
    for (const size of [21, 25, 29, 33, 57]) {
      const range = logoClearRange(size, 0.2);
      if (!range) {
        throw new Error("expected a range");
      }
      expect(range.start).toBe(size - 1 - range.end);
    }
  });

  it("clears more modules as the ratio grows", () => {
    const small = logoClearRange(33, 0.14);
    const large = logoClearRange(33, 0.3);

    expect(small && small.end - small.start).toBeLessThan(
      large ? large.end - large.start : Number.NaN,
    );
  });
});

describe("isInRange", () => {
  it("only matches cells inside the square on both axes", () => {
    const range = { start: 10, end: 14 };

    expect(isInRange(range, 12, 12)).toBe(true);
    expect(isInRange(range, 10, 14)).toBe(true);
    expect(isInRange(range, 9, 12)).toBe(false);
    expect(isInRange(range, 12, 15)).toBe(false);
    expect(isInRange(null, 12, 12)).toBe(false);
  });
});
