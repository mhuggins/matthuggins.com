import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import { Link } from "@/components/Link";
import { Tags } from "@/components/Tags";
import { createHtmlProps, markdownToHtml } from "@/utils/markdown";

export const Route = createFileRoute("/")({
  component: Blog,
});

type Frontmatter = {
  title: string;
  date: string; // ISO or YYYY-MM-DD
  tags?: string[];
  summary?: string;
};

// Vite root is `src/`, so absolute `/content/...` resolves to `src/content/...`
const posts = Object.entries(
  import.meta.glob("/content/blog/**/*.{md,mdx}") as Record<
    string,
    () => Promise<{ frontmatter?: Frontmatter; default: React.ComponentType }>
  >,
).map(([path, loader]) => ({ path, loader }));

function Blog() {
  const [items, _setItems] = usePosts();

  if (items.length === 0) {
    return <p className="text-gray-600">No blog posts yet. Check back soon!</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {items.map((p) => (
        <article key={p.slug} className="border-gray-200 border-b pb-6 last:border-b-0">
          <h2 className="font-semibold text-gray-800 text-xl">
            <Link
              to="/posts/$slug"
              params={{ slug: p.slug }}
              className="transition-colors hover:text-[#358799]"
            >
              {p.frontmatter.title}
            </Link>
          </h2>
          <div className="mb-3 text-gray-500 text-sm">{formatDate(p.frontmatter.date)}</div>
          {p.frontmatter.summary && (
            <div
              className="prose prose-gray prose-sm mb-3 max-w-none text-gray-700 leading-relaxed"
              {...createHtmlProps(markdownToHtml(p.frontmatter.summary))}
            />
          )}
          {p.frontmatter.tags && <Tags tags={p.frontmatter.tags} />}
        </article>
      ))}
    </div>
  );
}

function usePosts() {
  const [items, setItems] = useState<
    {
      slug: string;
      frontmatter: Frontmatter;
      loader: () => Promise<{ default: React.ComponentType }>;
    }[]
  >([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await Promise.all(
        posts.map(async ({ path, loader }) => {
          const mod = await loader();
          const slug = path
            .replace(/^\/content\/blog\//, "")
            .replace(/\.(md|mdx)$/i, "")
            .replace(/\/+$/, "");
          return { slug, frontmatter: mod.frontmatter!, loader };
        }),
      );
      const withDates = loaded.filter(
        (p) => p.frontmatter && p.frontmatter.title && p.frontmatter.date,
      );
      withDates.sort((a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1));
      if (!cancelled) setItems(withDates);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return [items, setItems] as const;
}

function formatDate(s: string) {
  const d = new Date(s);

  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  return s;
}
