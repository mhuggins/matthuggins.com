import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
  pendingComponent: Pending,
});

function Index() {
  return <div>Welcome</div>;
}

function Pending() {
  return <div>Loading...</div>;
}
