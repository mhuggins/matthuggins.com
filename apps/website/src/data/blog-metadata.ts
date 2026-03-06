import type { BlogPostMetadata, BlogTag } from "@/types/blog.gen";
import { blogMetadata, blogTags } from "./blog-metadata.gen";

export type BlogPostLoader = Promise<React.ComponentType>;

export interface BlogPost {
  metadata: BlogPostMetadata;
  loader?: BlogPostLoader;
}

/**
 * Get all blog posts sorted by date (newest first)
 * Returns metadata only (no loaders) - SSR safe
 */
export function getAllPosts({ limit }: { limit?: number } = {}): BlogPost[] {
  const metadataItems = limit === undefined ? blogMetadata : blogMetadata.slice(0, limit);
  return metadataItems.map((metadata) => ({ metadata }));
}

/**
 * Get posts filtered by tag
 * Returns metadata only (no loaders) - SSR safe
 */
export function getPostsByTag(tag: BlogTag): BlogPost[] {
  return blogMetadata.filter((post) => post.tags.includes(tag)).map((metadata) => ({ metadata }));
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
 * Returns metadata only (no loader) - SSR safe
 */
export function getPostBySlug(slug: string): BlogPost | undefined {
  const metadata = blogMetadata.find((post) => post.slug === slug);
  if (!metadata) {
    return undefined;
  }
  return { metadata };
}

/**
 * Check if a blog post exists by slug
 */
export function hasBlogPost(slug: string): boolean {
  return !!blogMetadata.find((post) => post.slug === slug);
}

// Pre-built map of all blog post loaders
// Use eager mode for SSR to ensure modules are available synchronously
const blogPostLoaders = import.meta.glob<{
  frontmatter?: BlogPostMetadata;
  default: React.ComponentType;
}>("../content/blog/**/*.{md,mdx}");

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
  // The key matches the relative glob pattern from this file's location
  const loaderKey = `../content/blog/${metadata.filePath}`;
  const loader = blogPostLoaders[loaderKey];

  return loader || null;
}

/**
 * Load blog post content (MDX component) - works on both server and client
 * Use this in route loaders for SSR support
 */
export async function loadBlogPostContent(slug: string): Promise<React.ComponentType> {
  const loader = getBlogPostLoader(slug);
  if (!loader) {
    throw new Error(`Loader not found for post: ${slug}`);
  }
  const mod = await loader();
  return mod.default;
}
