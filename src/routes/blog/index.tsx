import { createFileRoute, Link } from "@tanstack/react-router";

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

export const Route = createFileRoute("/blog/")({
  component: BlogIndex,
});

function BlogIndex() {
  const [items, _setItems] = usePosts();

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 font-bold text-2xl">Blog</h1>
      <ul className="space-y-4">
        {items.map((p) => (
          <li key={p.slug} className="border-zinc-200 border-b pb-4">
            <h2 className="font-semibold text-lg">
              <Link
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="text-blue-700 hover:underline"
              >
                {p.frontmatter.title}
              </Link>
            </h2>
            <div className="text-xs text-zinc-500">{formatDate(p.frontmatter.date)}</div>
            {p.frontmatter.summary ? (
              <p className="mt-1 text-sm text-zinc-700">{p.frontmatter.summary}</p>
            ) : null}
            {p.frontmatter.tags && p.frontmatter.tags.length ? (
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {p.frontmatter.tags.map((t) => (
                  <span key={t} className="rounded bg-zinc-100 px-2 py-0.5 text-zinc-700">
                    #{t}
                  </span>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
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
  if (!Number.isNaN(d.getTime()))
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  return s;
}

import React, { useState } from "react";
