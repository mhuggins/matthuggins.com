import { FlaskIcon } from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Section } from "@/components/Section";
import { getAllLabEntries } from "@/data/lab-metadata";

export const Route = createFileRoute("/lab/")({
  component: LabPage,
});

function LabPage() {
  const entries = getAllLabEntries();

  return (
    <Section title="Lab Creations" icon={FlaskIcon} headingClassName="uppercase">
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {entries.map((entry) => (
          <Link
            key={entry.metadata.slug}
            to="/lab/$id"
            params={{ id: entry.metadata.slug }}
            className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-md"
          >
            <div className="flex h-44 items-center justify-center border-gray-200 border-b bg-gray-100">
              {entry.metadata.thumbnail ? (
                <img
                  src={entry.metadata.thumbnail}
                  alt={entry.metadata.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <FlaskIcon className="size-12 text-gray-300" />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1 p-4">
              <h2 className="font-semibold text-primary-dark group-hover:text-primary">
                {entry.metadata.title}
              </h2>
              <p className="text-secondary-foreground text-sm leading-relaxed">
                {entry.metadata.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
