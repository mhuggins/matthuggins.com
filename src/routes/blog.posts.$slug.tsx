import { ArrowLeftIcon, FileXIcon } from "@phosphor-icons/react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { BlogPost } from "@/components/BlogPost";
import { Section } from "@/components/Section";
import { getPostBySlug, hasBlogPost } from "@/data/blog-metadata";

export const Route = createFileRoute("/blog/posts/$slug")({
  beforeLoad: ({ params }) => {
    if (!hasBlogPost(params.slug)) {
      throw notFound();
    }
  },
  component: BlogPostPage,
  notFoundComponent: NotFound,
});

function NotFound() {
  return (
    <div className="flex flex-col gap-12">
      <Section title="Post Not Found" icon={FileXIcon}>
        <p className="text-gray-600">The requested post could not be found.</p>
        <Link to="/" className="mt-4 inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeftIcon className="size-4" />
          Return Home
        </Link>
      </Section>
    </div>
  );
}

function BlogPostPage() {
  const { slug } = Route.useParams();
  const post = useMemo(() => getPostBySlug(slug), [slug]);

  if (!post) {
    return <div>Loading...</div>;
  }

  // For some reason, trying to assign this value inline within the <title> tag does not work.
  // Setting the desired value to a string variable first seems to address the issue.
  const title = `${post.metadata.title} - Matt Huggins`;
  const description = post.metadata.summary || post.metadata.title;
  const url = `https://matthuggins.com/blog/posts/${slug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.metadata.title,
    description,
    keywords: post.metadata.tags.join(", "),
    url,
    datePublished: post.metadata.date,
    author: {
      "@type": "Person",
      name: "Matt Huggins",
      url: "https://matthuggins.com",
    },
  };

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {post.metadata.tags.length > 0 && (
        <meta name="keywords" content={post.metadata.tags.join(", ")} />
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={post.metadata.title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="article" />
      <meta property="og:site_name" content="Matt Huggins" />
      <meta property="article:published_time" content={post.metadata.date} />
      {post.metadata.tags.map((tag) => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={post.metadata.title} />
      <meta name="twitter:description" content={description} />

      {/* Structured Data */}
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>

      <BlogPost post={post} />
    </>
  );
}
