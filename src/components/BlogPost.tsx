import { ArrowLeftIcon, BookOpenTextIcon, NoteIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import type { BlogPost as BlogPostType } from "@/data/blog-metadata";
import { formatDate } from "@/utils/formatDate";
import { Comments } from "./Comments";
import { Section } from "./Section";
import { Tags } from "./Tags";

interface BlogPostProps {
  post: BlogPostType;
  Component: React.ComponentType;
}

export function BlogPost({ post, Component }: BlogPostProps) {
  const { metadata } = post;

  return (
    <div className="flex flex-col gap-12">
      <Section
        title={metadata.title}
        subtitle={
          <div className="flex flex-col items-start gap-2">
            <div className="flex items-center gap-2">
              {formatDate(metadata.date)}
              {metadata.tags.length > 0 && <Tags tags={metadata.tags} />}
            </div>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <ArrowLeftIcon className="size-4" />
              Back to Blog
            </Link>
          </div>
        }
        icon={BookOpenTextIcon}
        headingClassName="uppercase"
      >
        {metadata.note && (
          <div className="relative mb-4 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-4 pl-16 text-gray-600 text-sm italic">
            <NoteIcon size={36} className="absolute top-4 left-4 text-gray-400" />
            Editor's Note: {metadata.note}
          </div>
        )}

        <div className="prose prose-gray max-w-none">
          <Component />
        </div>

        <div className="mt-12 border-gray-200 border-t pt-8">
          <h2 className="mb-4 font-semibold text-lg">Comments</h2>
          <Comments pageId={metadata.slug} pageTitle={metadata.title} />
        </div>
      </Section>
    </div>
  );
}
