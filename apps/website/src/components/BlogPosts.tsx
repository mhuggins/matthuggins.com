import { BlogPost } from "@/data/blog-metadata";
import { formatDate } from "@/utils/formatDate";
import { createHtmlProps, markdownToHtml } from "@/utils/markdown";
import { Link } from "./Link";
import { Section } from "./Section";
import { Tags } from "./Tags";

export function BlogPosts({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) {
    return <p className="text-gray-600 dark:text-gray-400">No blog posts yet.</p>;
  }

  return (
    <div className="flex flex-col gap-6 divide-y divide-gray-200 dark:divide-gray-700">
      {posts.map((post) => (
        <Section
          key={post.metadata.slug}
          title={
            <Link to="/blog/posts/$slug" params={{ slug: post.metadata.slug }}>
              {post.metadata.title}
            </Link>
          }
          subtitle={
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <span className="whitespace-nowrap">{formatDate(post.metadata.date)}</span>
              {post.metadata.tags.length > 0 && <Tags tags={post.metadata.tags} />}
            </div>
          }
          className="pb-6 last:pb-0"
        >
          <div className="flex items-start gap-4">
            {post.metadata.thumbnail && (
              <Link
                to="/blog/posts/$slug"
                params={{ slug: post.metadata.slug }}
                className="shrink-0"
              >
                <img
                  src={post.metadata.thumbnail}
                  alt={post.metadata.title}
                  className="w-32 rounded-sm border border-slate-200 shadow-md dark:border-gray-700"
                />
              </Link>
            )}
            {post.metadata.summary && (
              <div
                className="prose prose-gray prose-sm dark:prose-invert max-w-none text-gray-700 leading-relaxed dark:text-gray-300"
                {...createHtmlProps(markdownToHtml(post.metadata.summary))}
              />
            )}
          </div>
        </Section>
      ))}
    </div>
  );
}
