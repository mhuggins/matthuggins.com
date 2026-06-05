import { describe, expect, it } from "vitest";
import type { ColumnInfo } from "../types";
import { buildChartSpec } from "./buildChartSpec";

const COLUMNS: ColumnInfo[] = [
  { name: "date", type: "temporal", label: "Date" },
  { name: "max_temp", type: "quantitative", label: "Max temperature (°C)" },
  { name: "min_temp", type: "quantitative", label: "Min temperature (°C)" },
];

describe("buildChartSpec", () => {
  it("builds a line chart with inferred field types from columns", () => {
    const spec = buildChartSpec(
      { mark: "line", encodings: { x: { field: "date" }, y: { field: "max_temp" } } },
      COLUMNS,
    );

    expect(spec.mark).toBe("line");
    expect(spec.encoding).toEqual({
      x: { field: "date", type: "temporal" },
      y: { field: "max_temp", type: "quantitative" },
    });
    expect(spec.$schema).toContain("vega-lite");
  });

  it("never inlines data rows (rows stay out of the model context)", () => {
    const spec = buildChartSpec(
      { mark: "bar", encodings: { x: { field: "date" }, y: { field: "max_temp" } } },
      COLUMNS,
    );
    expect(spec).not.toHaveProperty("data");
  });

  it("applies sort to the x channel", () => {
    const spec = buildChartSpec(
      {
        mark: "bar",
        sort: "descending",
        encodings: { x: { field: "date" }, y: { field: "min_temp" } },
      },
      COLUMNS,
    );
    expect((spec.encoding as Record<string, { sort?: string }>).x.sort).toBe("descending");
  });

  it("carries an aggregate through to the y channel", () => {
    const spec = buildChartSpec(
      {
        mark: "bar",
        encodings: { x: { field: "date" }, y: { field: "max_temp", aggregate: "mean" } },
      },
      COLUMNS,
    );
    expect((spec.encoding as Record<string, { aggregate?: string }>).y.aggregate).toBe("mean");
  });

  it("maps arc marks to theta + color instead of x/y", () => {
    const spec = buildChartSpec(
      {
        mark: "arc",
        encodings: { y: { field: "max_temp", aggregate: "sum" }, color: { field: "date" } },
      },
      COLUMNS,
    );
    const encoding = spec.encoding as Record<string, unknown>;
    expect(encoding).toHaveProperty("theta");
    expect(encoding).toHaveProperty("color");
    expect(encoding).not.toHaveProperty("x");
    expect(encoding).not.toHaveProperty("y");
  });

  it("renders points as filled", () => {
    const spec = buildChartSpec(
      { mark: "point", encodings: { x: { field: "min_temp" }, y: { field: "max_temp" } } },
      COLUMNS,
    );
    expect(spec.mark).toEqual({ type: "point", filled: true });
  });
});
