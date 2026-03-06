import { ArrowLeftIcon, BookOpenTextIcon, NoteIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import type { BlogPost as BlogPostType } from "@/data/blog-metadata";
import { formatDate } from "@/utils/formatDate";
import { createHtmlProps, markdownToHtml } from "@/utils/markdown";
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
          <div className="flex flex-col items-start justify-start gap-2">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <span className="whitespace-nowrap">{formatDate(metadata.date)}</span>
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
        {metadata.image && (
          <img
            src={metadata.image}
            alt={metadata.title}
            className="mx-auto mt-4 mb-8 rounded-lg border-2 border-slate-200 shadow-lg"
          />
        )}
        {metadata.note && (
          <div className="relative mb-4 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-4 pl-16 text-gray-600 text-sm italic">
            <NoteIcon size={36} className="absolute top-4 left-4 text-gray-400" />
            <span
              className="prose prose-sm prose-gray inline"
              {...createHtmlProps(markdownToHtml(`Author's Note: ${metadata.note}`))}
            />
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
