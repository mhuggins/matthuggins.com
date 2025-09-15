import { ArrowLeftIcon, NoteIcon, PenIcon } from "@phosphor-icons/react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { Section } from "@/components/Section";
import { Tags } from "@/components/Tags";
import { getPostBySlug, hasBlogPost } from "@/data/blog-metadata";
import { useMdx } from "@/hooks/useMdx";
import { formatDate } from "@/utils/formatDate";

export const Route = createFileRoute("/blog/posts/$slug")({
  beforeLoad: ({ params }) => {
    if (!hasBlogPost(params.slug)) {
      throw notFound();
    }
  },
  component: BlogPost,
  notFoundComponent: () => (
    <div className="flex flex-col gap-12">
      <Section title="Post Not Found" icon={PenIcon}>
        <p className="text-gray-600">The requested post could not be found.</p>
        <Link to="/" className="mt-4 inline-flex items-center gap-2 text-[#358799] hover:underline">
          <ArrowLeftIcon className="size-4" />
          Return Home
        </Link>
      </Section>
    </div>
  ),
});

function BlogPost() {
  const { slug } = Route.useParams();

  const post = useMemo(() => getPostBySlug(slug), [slug]);
  const Component = useMdx(post?.loader);

  if (!post) {
    return <div>Loading...</div>;
  }

  const { metadata } = post;

  return (
    <div className="flex flex-col gap-12">
      <div className="flex items-center gap-4 text-sm">
        <Link to="/blog" className="inline-flex items-center gap-2 text-[#358799] hover:underline">
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
