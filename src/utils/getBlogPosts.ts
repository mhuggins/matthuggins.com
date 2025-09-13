export interface Frontmatter {
  title: string;
  date: string; // ISO or YYYY-MM-DD
  tags?: string[];
  summary?: string;
}

export type BlogPostLoader = ReturnType<typeof getBlogPost>;

export const getBlogPosts = () => {
  return Object.entries(getBlogPostFiles()).map(([path, loader]) => ({ path, loader }));
};

export const getBlogPost = (slug: string) => {
  const posts = getBlogPostFiles();
  const key = Object.keys(posts).find((k) => normalize(k) === slug);
  return posts[key ?? ""];
};

export const hasBlogPost = (slug: string) => {
  return !!getBlogPost(slug);
};

const getBlogPostFiles = () => {
  return import.meta.glob<{ frontmatter?: Frontmatter; default: React.ComponentType }>(
    "/content/blog/**/*.{md,mdx}",
  );
};

const normalize = (path: string) => {
  return path.replace(/\.(md|mdx)$/i, "").replace(/^\/content\/blog\//, "");
};
