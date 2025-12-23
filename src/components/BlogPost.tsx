import { ArrowLeftIcon, NoteIcon, PenIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { BlogPost as BlogPostType } from "@/data/blog-metadata";
import { useMdx } from "@/hooks/useMdx";
import { formatDate } from "@/utils/formatDate";
import { Section } from "./Section";
import { Tags } from "./Tags";

export function BlogPost({ post }: { post: BlogPostType }) {
  const Component = useMdx(post?.loader);

  const { metadata } = post;

  return (
    <div className="flex flex-col gap-12">
      <div className="flex items-center gap-4 text-sm">
        <Link to="/blog" className="inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeftIcon className="size-4" />
          Back to Blog
        </Link>
      </div>

      <Section
        title={metadata.title}
        subtitle={
          <div className="flex items-center gap-2">
            {formatDate(metadata.date)}
            {metadata.tags.length > 0 && <Tags tags={metadata.tags} />}
          </div>
        }
        icon={PenIcon}
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
      </Section>
    </div>
  );
}
