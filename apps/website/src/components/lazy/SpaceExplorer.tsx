import { lazy } from "react";

export const SpaceExplorer = lazy(async () => ({
  default: (await import("@matthuggins/space-explorer")).SpaceExplorer,
}));
