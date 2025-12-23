import { ArrowLeftIcon, TagIcon } from "@phosphor-icons/react";
import { Link } from "@/components/Link";
import { Section } from "@/components/Section";
import { Tags } from "@/components/Tags";
import { BlogPost as BlogPostType } from "@/data/blog-metadata";
import { BlogTag } from "@/types/blog.gen";
import { createHtmlProps, markdownToHtml } from "@/utils/markdown";

export function Tag({ tag, posts }: { tag: BlogTag; posts: BlogPostType[] }) {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex items-center gap-4 text-sm">
        <Link to="/blog" className="inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeftIcon className="size-4" />
          Back to Blog
        </Link>
      </div>

      <Section title={`Posts tagged "${tag}"`} icon={TagIcon}>
        <div className="flex flex-col gap-6">
          {posts.map((post) => (
            <article
              key={post.metadata.slug}
              className="border-gray-200 border-b pb-6 last:border-b-0"
            >
              <h2 className="font-semibold text-gray-800 text-xl">
                <Link
                  to="/blog/posts/$slug"
                  params={{ slug: post.metadata.slug }}
                  className="transition-colors hover:text-primary"
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
      </Section>
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
