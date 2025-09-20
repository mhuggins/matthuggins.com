import { PenIcon } from "@phosphor-icons/react";
import { getAllPosts } from "@/data/blog-metadata";
import { formatDate } from "@/utils/formatDate";
import { createHtmlProps, markdownToHtml } from "@/utils/markdown";
import { Link } from "./Link";
import { Section } from "./Section";
import { Tags } from "./Tags";

export function BlogPosts() {
  const posts = getAllPosts();

  if (posts.length === 0) {
    return <p className="text-gray-600">No blog posts yet.</p>;
  }

  return (
    <div className="flex flex-col gap-6 divide-y divide-gray-200">
      {posts.map((post) => (
        <Section
          key={post.metadata.slug}
          title={
            <Link to="/blog/posts/$slug" params={{ slug: post.metadata.slug }}>
              {post.metadata.title}
            </Link>
          }
          subtitle={
            <div className="flex items-center gap-2">
              {formatDate(post.metadata.date)}
              {post.metadata.tags.length > 0 && <Tags tags={post.metadata.tags} />}
            </div>
          }
          icon={PenIcon}
          className="pb-6 last:pb-0"
        >
          {post.metadata.summary && (
            <div
              className="prose prose-gray prose-sm max-w-none text-gray-700 leading-relaxed"
              {...createHtmlProps(markdownToHtml(post.metadata.summary))}
            />
          )}
        </Section>
      ))}
    </div>
  );
}
