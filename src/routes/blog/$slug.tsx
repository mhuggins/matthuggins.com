import { createFileRoute, notFound } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { BlogPostLoader, Frontmatter, getBlogPost, hasBlogPost } from "@/utils/getBlogPosts";

export const Route = createFileRoute("/blog/$slug")({
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

  const MDX = getBlogPost(slug);

  const { Component, frontmatter } = useMdx(MDX);

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

function useMdx(loader: BlogPostLoader) {
  const [state, setState] = useState<{ Component: React.ComponentType; frontmatter?: Frontmatter }>(
    {
      Component: () => null,
    },
  );

  useEffect(() => {
    let cancelled = false;

    loader().then((mod) => {
      if (!cancelled) {
        setState({ Component: mod.default, frontmatter: mod.frontmatter });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loader]);

  return state;
}
