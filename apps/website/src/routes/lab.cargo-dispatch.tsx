import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const CargoDispatch = lazy(async () => ({
  default: (await import("@matthuggins/cargo-dispatch")).CargoDispatch,
}));

export const Route = createFileRoute("/lab/cargo-dispatch")({
  component: CargoDispatch,
});
