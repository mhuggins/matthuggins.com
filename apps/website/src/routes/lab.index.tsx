import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/lab/")({
  component: LabPage,
});

function LabPage() {
  return (
    <div>
      <h1>Lab Creations</h1>
      <Link
        to="/lab/cargo-dispatch"
        className="mt-4 inline-flex items-center gap-2 text-primary hover:underline"
      >
        Cargo Dispatch
      </Link>
    </div>
  );
}
