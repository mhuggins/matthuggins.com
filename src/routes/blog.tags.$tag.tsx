import { ArrowLeftIcon, TagIcon } from "@phosphor-icons/react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { Link } from "@/components/Link";
import { Section } from "@/components/Section";
import { Tag } from "@/components/Tag";
import { getPostsByTag, isValidTag } from "@/data/blog-metadata";
import type { BlogTag } from "@/types/blog.gen";

export const Route = createFileRoute("/blog/tags/$tag")({
  beforeLoad: ({ params }) => {
    if (!isValidTag(params.tag)) {
      throw notFound();
    }
  },
  component: TagPage,
  notFoundComponent: NotFound,
});

function NotFound() {
  return (
    <div className="flex flex-col gap-12">
      <Section title="Tag Not Found" icon={TagIcon}>
        <p className="text-gray-600">The requested tag could not be found.</p>
        <Link to="/" className="mt-4 inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeftIcon className="size-4" />
          Return Home
        </Link>
      </Section>
    </div>
  );
}

function TagPage() {
  const { tag } = Route.useParams();
  const posts = getPostsByTag(tag as BlogTag);

  // For some reason, trying to assign this value inline within the <title> tag does not work.
  // Setting the desired value to a string variable first seems to address the issue.
  const title = `"${tag}" Blog Posts - Matt Huggins`;
  const description = `Blog posts tagged under topic "${tag}"`;
  const url = `https://matthuggins.com/blog/tags/${encodeURIComponent(tag)}`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={tag} />

      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Matt Huggins" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />

      <Tag tag={tag as BlogTag} posts={posts} />
    </>
  );
}
