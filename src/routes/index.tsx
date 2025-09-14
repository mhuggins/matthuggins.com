import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/Link";
import { Tags } from "@/components/Tags";
import { getAllPosts } from "@/data/blog-metadata";
import { createHtmlProps, markdownToHtml } from "@/utils/markdown";

export const Route = createFileRoute("/")({
  component: Blog,
});

function Blog() {
  const posts = getAllPosts();

  if (posts.length === 0) {
    return <p className="text-gray-600">No blog posts yet. Check back soon!</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {posts.map((post) => (
        <article key={post.metadata.slug} className="border-gray-200 border-b pb-6 last:border-b-0">
          <h2 className="font-semibold text-gray-800 text-xl">
            <Link
              to="/posts/$slug"
              params={{ slug: post.metadata.slug }}
              className="transition-colors hover:text-[#358799]"
            >
              {post.metadata.title}
            </Link>
          </h2>
          <div className="mb-3 text-gray-500 text-sm">{formatDate(post.metadata.date)}</div>
          {post.metadata.summary && (
            <div
              className="prose prose-gray prose-sm mb-3 max-w-none text-gray-700 leading-relaxed"
              {...createHtmlProps(markdownToHtml(post.metadata.summary))}
            />
          )}
          {post.metadata.tags.length > 0 && <Tags tags={post.metadata.tags} />}
        </article>
      ))}
    </div>
  );
}

function formatDate(s: string) {
  const d = new Date(s);

  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  return s;
}
