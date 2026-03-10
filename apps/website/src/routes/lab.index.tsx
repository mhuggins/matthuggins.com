import { FlaskIcon } from "@phosphor-icons/react";
import { createFileRoute, Link, RegisteredRouter } from "@tanstack/react-router";
import { ComponentProps } from "react";
import cargoDispatchImage from "@/assets/cargo-dispatch.svg";
import { Section } from "@/components/Section";

export const Route = createFileRoute("/lab/")({
  component: LabPage,
});

interface LabProject {
  title: string;
  description: string;
  href: ComponentProps<typeof Link<RegisteredRouter>>["to"];
  image: string | null;
}

const LAB_PROJECTS: LabProject[] = [
  {
    title: "Cargo Dispatch",
    description:
      "Programming game where you write TypeScript or JavaScript to control a fleet of warehouse robots. Route packages from aisles to trucks before time runs out.",
    href: "/lab/cargo-dispatch",
    image: cargoDispatchImage,
  },
  {
    title: "Space Explorer",
    description: "TODO",
    href: "/lab/space-explorer",
    image: null,
  },
];

function LabPage() {
  return (
    <Section title="Lab Creations" icon={FlaskIcon} headingClassName="uppercase">
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {LAB_PROJECTS.map((project) => (
          <Link
            key={project.href}
            to={project.href}
            className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-md"
          >
            <div className="flex h-44 items-center justify-center border-gray-200 border-b bg-gray-100">
              {project.image ? (
                <img
                  src={project.image}
                  alt={project.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <FlaskIcon className="size-12 text-gray-300" />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1 p-4">
              <h2 className="font-semibold text-primary-dark group-hover:text-primary">
                {project.title}
              </h2>
              <p className="text-secondary-foreground text-sm leading-relaxed">
                {project.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
