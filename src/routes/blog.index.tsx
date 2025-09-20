import { createFileRoute } from "@tanstack/react-router";
import { BlogPosts } from "@/components/BlogPosts";

export const Route = createFileRoute("/blog/")({
  component: BlogPage,
});

function BlogPage() {
  return (
    <>
      <title>Web Development Blog - Matt Huggins</title>
      <meta name="description" content="Matt Huggins' Software Development Blog" />
      <meta
        name="keywords"
        content="web, development, react, typescript, javascript, ruby, ruby on rails, css, html"
      />
      <BlogPosts />
    </>
  );
}
