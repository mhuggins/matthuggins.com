import { ArrowLeftIcon, FileXIcon, FlaskIcon } from "@phosphor-icons/react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Section } from "@/components/Section";
import { DOMAIN } from "@/constants/site";
import { getLabEntryBySlug, hasLabEntry, loadLabEntryContent } from "@/data/lab-metadata";

export const Route = createFileRoute("/lab/$id")({
  beforeLoad: ({ params }) => {
    if (!hasLabEntry(params.id)) {
      throw notFound();
    }
  },
  loader: async ({ params }) => {
    const entry = getLabEntryBySlug(params.id);
    if (!entry) {
      throw notFound();
    }
    const Component = await loadLabEntryContent(params.id);
    return { entry, Component };
  },
  component: LabEntryPage,
  notFoundComponent: NotFound,
});

function NotFound() {
  return (
    <div className="flex flex-col gap-12">
      <Section title="Project Not Found" icon={FileXIcon}>
        <p className="text-gray-600">The requested lab project could not be found.</p>
        <Link
          to="/lab"
          className="mt-4 inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeftIcon className="size-4" />
          Back to Lab
        </Link>
      </Section>
    </div>
  );
}

function LabEntryPage() {
  const { entry, Component } = Route.useLoaderData();
  const { metadata } = entry;

  const title = `${metadata.title} - Matt Huggins`;
  const description = metadata.description || metadata.title;
  const url = `${DOMAIN}/lab/${metadata.slug}`;
  const keywords = metadata.keywords.join(", ");

  const structuredData = {
    "@context": "https://schema.org",
    "@type": metadata.schemaType,
    name: metadata.title,
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
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={metadata.title} />
      <meta property="og:description" content={description} />
      {metadata.ogImage && <meta property="og:image" content={`${DOMAIN}${metadata.ogImage}`} />}
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Matt Huggins" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={metadata.title} />
      <meta name="twitter:description" content={description} />

      {/* Structured Data */}
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>

      <Section
        title={metadata.title}
        subtitle={
          <div className="flex flex-col items-start justify-start gap-2">
            <Link to="/lab" className="inline-flex items-center gap-2 text-primary hover:underline">
              <ArrowLeftIcon className="size-4" />
              Back to Lab
            </Link>
          </div>
        }
        icon={FlaskIcon}
        headingClassName="uppercase"
      >
        <Component />
      </Section>
    </>
  );
}
