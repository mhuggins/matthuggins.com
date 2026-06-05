import { lazy } from "react";

export const ChartBuilder = lazy(async () => ({
  default: (await import("@matthuggins/chart-builder")).ChartBuilder,
}));
