import type { BlogPostMetadata, BlogTag } from "@/types/blog.gen";
import { blogMetadata, blogTags } from "./blog-metadata.gen";

export type BlogPostLoader = Promise<React.ComponentType>;

export interface BlogPost {
  metadata: BlogPostMetadata;
  loader: BlogPostLoader;
}

/**
 * Get all blog posts sorted by date (newest first)
 */
export function getAllPosts(): BlogPost[] {
  return blogMetadata.map(getBlogPostFromMetadata);
}

/**
 * Get posts filtered by tag
 */
export function getPostsByTag(tag: BlogTag): BlogPost[] {
  return blogMetadata.filter((post) => post.tags.includes(tag)).map(getBlogPostFromMetadata);
}

/**
 * Get all unique tags from blog posts
 */
export function getAllTags(): BlogTag[] {
  return Array.from(blogTags).sort();
}

/**
 * Check if a tag exists
 */
export function isValidTag(str: string): str is BlogTag {
  return blogTags.has(str as BlogTag);
}

/**
 * Get post by slug
 */
export function getPostBySlug(slug: string): BlogPost | undefined {
  const metadata = blogMetadata.find((post) => post.slug === slug);
  if (!metadata) {
    return undefined;
  }
  return getBlogPostFromMetadata(metadata);
}

/**
 * Check if a blog post exists by slug
 */
export function hasBlogPost(slug: string): boolean {
  return !!blogMetadata.find((post) => post.slug === slug);
}

// Pre-built map of all blog post loaders
const blogPostLoaders = import.meta.glob<{
  frontmatter?: BlogPostMetadata;
  default: React.ComponentType;
}>("/content/blog/**/*.{md,mdx}");

/**
 * Get blog post content loader for individual post (for MDX loading)
 * Uses pre-built loader map for efficiency
 */
function getBlogPostLoader(slug: string) {
  const metadata = blogMetadata.find((post) => post.slug === slug);
  if (!metadata) {
    return null;
  }

  // Find the loader in our pre-built map
  const loaderKey = `/content/blog/${metadata.filePath}`;
  const loader = blogPostLoaders[loaderKey];

  return loader || null;
}

function getBlogPostFromMetadata(metadata: BlogPostMetadata): BlogPost {
  const rawLoader = getBlogPostLoader(metadata.slug);
  if (!rawLoader) {
    throw new Error(`Loader not found for post: ${metadata.slug}`);
  }
  const loader = rawLoader().then((mod) => mod.default);
  return { metadata, loader };
}
