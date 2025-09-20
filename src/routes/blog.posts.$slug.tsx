import { ArrowLeftIcon, PenIcon } from "@phosphor-icons/react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { BlogPost } from "@/components/BlogPost";
import { Section } from "@/components/Section";
import { getPostBySlug, hasBlogPost } from "@/data/blog-metadata";

export const Route = createFileRoute("/blog/posts/$slug")({
  beforeLoad: ({ params }) => {
    if (!hasBlogPost(params.slug)) {
      throw notFound();
    }
  },
  component: BlogPostPage,
  notFoundComponent: NotFound,
});

function NotFound() {
  return (
    <div className="flex flex-col gap-12">
      <Section title="Post Not Found" icon={PenIcon}>
        <p className="text-gray-600">The requested post could not be found.</p>
        <Link to="/" className="mt-4 inline-flex items-center gap-2 text-[#358799] hover:underline">
          <ArrowLeftIcon className="size-4" />
          Return Home
        </Link>
      </Section>
    </div>
  );
}

function BlogPostPage() {
  const { slug } = Route.useParams();
  const post = useMemo(() => getPostBySlug(slug), [slug]);

  if (!post) {
    return <div>Loading...</div>;
  }

  // For some reason, trying to assign this value inline within the <title> tag does not work.
  // Setting the desired value to a string variable first seems to address the issue.
  const title = `${post.metadata.title} - Matt Huggins`;

  return (
    <>
      <title>{title}</title>
      {post.metadata.summary && <meta name="description" content={post.metadata.summary} />}
      {post.metadata.tags.length > 0 && (
        <meta name="keywords" content={post.metadata.tags.join(", ")} />
      )}
      <BlogPost post={post} />
    </>
  );
}
