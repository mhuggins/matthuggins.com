import { ArrowLeftIcon, PushPinIcon } from "@phosphor-icons/react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { Section } from "@/components/Section";
import { Tags } from "@/components/Tags";
import { getPostBySlug, hasBlogPost } from "@/data/blog-metadata";
import { useMdx } from "@/hooks/useMdx";

export const Route = createFileRoute("/posts/$slug")({
  beforeLoad: ({ params }) => {
    if (!hasBlogPost(params.slug)) {
      throw notFound();
    }
  },
  component: BlogPost,
  notFoundComponent: () => (
    <div className="flex flex-col gap-12">
      <Section title="Post Not Found" icon={PushPinIcon}>
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
        <Link to="/" className="inline-flex items-center gap-2 text-[#358799] hover:underline">
          <ArrowLeftIcon className="size-4" />
          Back to Blog
        </Link>
      </div>

      <Section title={metadata.title} icon={PushPinIcon}>
        <div className="-mt-2 mb-6 ml-10">
          {metadata.date && (
            <div className="text-gray-500 text-sm">
              Published on{" "}
              {new Date(metadata.date).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          )}

          {metadata.tags && (
            <div className="mt-1 flex items-start gap-2">
              <span className="text-gray-500 text-sm leading-relaxed">Tags:</span>
              <Tags tags={metadata.tags} />
            </div>
          )}
        </div>

        <div className="prose prose-gray max-w-none">
          <Component />
        </div>
      </Section>
    </div>
  );
}
