import { ArrowLeftIcon, FlaskIcon } from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy } from "react";
import { Section } from "@/components/Section";
import { DOMAIN } from "@/constants/site";

const SpaceExplorer = lazy(async () => ({
  default: (await import("@matthuggins/space-explorer")).SpaceExplorer,
}));

export const Route = createFileRoute("/lab/space-explorer")({
  component: CargoDispatchPage,
});

function CargoDispatchPage() {
  const title = "Space Explorer";
  const description = "TODO";
  const url = `${DOMAIN}/${Route.path}`;
  const keywords = [
    "development",
    "programming",
    "coding",
    "typescript",
    "javascript",
    "game",
    "space",
    "explorer",
    "exploration",
    "jetpack",
    "planets",
  ].join(", ");

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Game",
    name: title,
    description,
    keywords,
    url,
    author: {
      "@type": "Person",
      name: "Matt Huggins",
      url: DOMAIN,
    },
  };

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${DOMAIN}/lab/cargo-dispatch.og-image.png`} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Matt Huggins" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />

      {/* Structured Data */}
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>

      <Section
        title={title}
        subtitle={
          <div className="flex flex-col items-start justify-start gap-2">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">TODO</div>
            <Link to="/lab" className="inline-flex items-center gap-2 text-primary hover:underline">
              <ArrowLeftIcon className="size-4" />
              Back to Lab
            </Link>
          </div>
        }
        icon={FlaskIcon}
        headingClassName="uppercase"
      >
        <SpaceExplorer className="mt-6" />
      </Section>
    </>
  );
}
