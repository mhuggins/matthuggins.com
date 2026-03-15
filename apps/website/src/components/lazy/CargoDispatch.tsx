import { lazy } from "react";

export const CargoDispatch = lazy(async () => ({
  default: (await import("@matthuggins/cargo-dispatch")).CargoDispatch,
}));
