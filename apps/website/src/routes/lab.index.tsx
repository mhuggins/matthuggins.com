import { FlaskIcon } from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Section } from "@/components/Section";

export const Route = createFileRoute("/lab/")({
  component: LabPage,
});

function LabPage() {
  return (
    <Section title="Lab Creations" icon={FlaskIcon} headingClassName="uppercase">
      <Link
        to="/lab/cargo-dispatch"
        className="mt-4 inline-flex items-center gap-2 text-primary hover:underline"
      >
        Cargo Dispatch
      </Link>
    </Section>
  );
}
