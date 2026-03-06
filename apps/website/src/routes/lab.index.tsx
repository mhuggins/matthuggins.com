import { CargoDispatch } from "@matthuggins/cargo-dispatch";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/lab/")({
  component: LabPage,
});

function LabPage() {
  return <CargoDispatch />;
}
