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
        <Link to="/" className="mt-4 inline-flex items-center gap-2 text-[#358799] hover:underline">
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

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={`Blog posts tagged under topic "${tag}"`} />
      <meta name="keywords" content={tag} />
      <Tag tag={tag as BlogTag} posts={posts} />
    </>
  );
}
