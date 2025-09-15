import type { BlogPostMetadata } from "./types/blog.gen";

declare module "*.mdx" {
  import type { ComponentType } from "react";
  // biome-ignore lint/suspicious/noExplicitAny: could be any component
  const MDXComponent: ComponentType<any>;
  export const frontmatter: BlogPostMetadata;
  export default MDXComponent;
}

declare module "*.md" {
  import type { ComponentType } from "react";
  // biome-ignore lint/suspicious/noExplicitAny: could be any component
  const MDXComponent: ComponentType<any>;
  export const frontmatter: BlogPostMetadata;
  export default MDXComponent;
}
