import { describe, expect, it } from "vitest";
import { buildLayout } from "../layout";
import type { QrMatrix } from "../matrix";
import { buildModulePath, roundedRectPath } from "../paths";

function matrixOf(rows: readonly string[]): QrMatrix {
  return {
    size: rows.length,
    version: 1,
    modules: rows.map((row) => [...row].map((cell) => cell === "#")),
  };
}

describe("roundedRectPath", () => {
  it("clamps a radius to half the shortest side", () => {
    const circle = roundedRectPath(0, 0, 10, 10, [99, 99, 99, 99]);
    expect(circle).toContain("A5,5");
  });

  it("emits zero-radius arcs for square corners", () => {
    expect(roundedRectPath(0, 0, 4, 4, [0, 0, 0, 0])).toContain("A0,0");
  });
});

describe("buildModulePath", () => {
  const matrix = matrixOf(["#.#", ".#.", "#.#"]);

  it("draws one subpath per dark module", () => {
    const path = buildModulePath({ matrix, style: "square" });
    expect(path.match(/M/g)).toHaveLength(5);
  });

  it("skips the modules the caller excludes", () => {
    const path = buildModulePath({ matrix, style: "square", skip: (row) => row === 0 });
    expect(path.match(/M/g)).toHaveLength(3);
  });

  it("renders dots as arcs rather than corners", () => {
    expect(buildModulePath({ matrix, style: "dots" })).toContain("a");
    expect(buildModulePath({ matrix, style: "square" })).not.toContain("a");
  });

  it("returns an empty string when everything is skipped", () => {
    expect(buildModulePath({ matrix, style: "rounded", skip: () => true })).toBe("");
  });
});

describe("buildLayout", () => {
  it("keeps a bare code square with just the quiet zone", () => {
    const layout = buildLayout(25, "none");

    expect(layout.width).toBe(layout.height);
    expect(layout.qr).toEqual({ x: 0, y: 0, size: layout.width });
    expect(layout.label).toBeNull();
  });

  it("reserves a caption band below the symbol", () => {
    const layout = buildLayout(25, "label-below");

    expect(layout.height).toBeGreaterThan(layout.width);
    expect(layout.solidCard).toBe(true);
    expect(layout.label?.y).toBeGreaterThan(layout.qr.y + layout.qr.size);
  });

  it("puts the header caption above the symbol", () => {
    const layout = buildLayout(25, "label-above");

    expect(layout.label?.y).toBeLessThan(layout.qr.y);
  });

  it("scales every frame with the symbol", () => {
    const small = buildLayout(21, "ticket");
    const large = buildLayout(57, "ticket");
    const ratio = (layout: ReturnType<typeof buildLayout>) => layout.height / layout.width;

    expect(ratio(small)).toBeCloseTo(ratio(large), 10);
  });

  it("insets the border so the stroke stays inside the card", () => {
    const layout = buildLayout(25, "border");
    const border = layout.border;
    if (!border) {
      throw new Error("expected a border");
    }

    expect(border.x).toBeCloseTo(border.strokeWidth / 2, 10);
    expect(border.x + border.width).toBeCloseTo(layout.width - border.strokeWidth / 2, 10);
  });
});
