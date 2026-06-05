import { describe, expect, it } from "vitest";
import { chartToolOutputSchema } from "./tools";

describe("chartToolOutputSchema", () => {
  it("accepts a well-formed buildChartSpec result", () => {
    const result = chartToolOutputSchema.safeParse({
      dataRef: "ds_1",
      mark: "line",
      spec: { mark: "line", encoding: { x: { field: "date" } } },
    });
    expect(result.success).toBe(true);
  });

  it("rejects a mark the encoder does not support", () => {
    const result = chartToolOutputSchema.safeParse({ dataRef: "ds_1", mark: "pie", spec: {} });
    expect(result.success).toBe(false);
  });

  it("rejects a result whose shape has drifted (missing dataRef)", () => {
    const result = chartToolOutputSchema.safeParse({ mark: "bar", spec: {} });
    expect(result.success).toBe(false);
  });
});
