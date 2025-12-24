import { BookIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { BlogPosts } from "@/components/BlogPosts";
import { Section } from "@/components/Section";
import { getAllPosts } from "@/data/blog-metadata";

export const Route = createFileRoute("/blog/")({
  component: BlogPage,
});

function BlogPage() {
  const posts = useMemo(() => getAllPosts(), []);

  const title = "Web Development Blog - Matt Huggins";
  const description = "Software Development Blog covering web and mobile development";
  const url = "https://matthuggins.com/blog";
  const keywords = [
    "web",
    "development",
    "react",
    "typescript",
    "javascript",
    "ruby",
    "ruby on rails",
    "css",
    "html",
    "mobile",
  ].join(", ");

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Web Development Blog of Matt Huggins",
    description,
    keywords,
    url,
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
      <meta name="keywords" content={keywords} />

      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Matt Huggins" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />

      {/* Structured Data */}
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>

      <Section title="All Blog Posts" icon={BookIcon} headingClassName="mb-4 uppercase">
        <BlogPosts posts={posts} />
      </Section>
    </>
  );
}
