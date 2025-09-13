import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMdx } from "@/hooks/useMdx";
import { hasBlogPost } from "@/utils/getBlogPosts";

export const Route = createFileRoute("/posts/$slug")({
  beforeLoad: ({ params }) => {
    if (!hasBlogPost(params.slug)) {
      throw notFound();
    }
  },
  component: BlogPost,
  notFoundComponent: () => <div className="mx-auto max-w-3xl p-6">Post not found.</div>,
});

function BlogPost() {
  const { slug } = Route.useParams();
  const { Component, frontmatter } = useMdx(slug);

  return (
    <article className="prose prose-zinc mx-auto max-w-3xl p-6">
      {frontmatter?.title ? <h1 className="mb-2">{frontmatter.title}</h1> : null}
      {frontmatter?.date ? (
        <div className="mb-6 text-xs text-zinc-500">
          {new Date(frontmatter.date).toLocaleDateString()}
        </div>
      ) : null}
      <Component />
    </article>
  );
}
