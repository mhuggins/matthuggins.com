import type { LabEntryMetadata } from "@/types/lab.gen";
import { labMetadata } from "./lab-metadata.gen";

export type LabEntryLoader = Promise<React.ComponentType>;

export interface LabEntry {
  metadata: LabEntryMetadata;
}

/**
 * Get all lab entries sorted alphabetically by title
 */
export function getAllLabEntries(): LabEntry[] {
  return labMetadata.map((metadata) => ({ metadata }));
}

/**
 * Get lab entry by slug
 */
export function getLabEntryBySlug(slug: string): LabEntry | undefined {
  const metadata = labMetadata.find((entry) => entry.slug === slug);
  if (!metadata) {
    return undefined;
  }
  return { metadata };
}

/**
 * Check if a lab entry exists by slug
 */
export function hasLabEntry(slug: string): boolean {
  return !!labMetadata.find((entry) => entry.slug === slug);
}

// Pre-built map of all lab entry loaders
const labEntryLoaders = import.meta.glob<{
  frontmatter?: LabEntryMetadata;
  default: React.ComponentType;
}>("../content/lab/**/*.{md,mdx}");

/**
 * Get lab entry content loader
 */
function getLabEntryLoader(slug: string) {
  const metadata = labMetadata.find((entry) => entry.slug === slug);
  if (!metadata) {
    return null;
  }

  const loaderKey = `../content/lab/${metadata.filePath}`;
  const loader = labEntryLoaders[loaderKey];

  return loader || null;
}

/**
 * Load lab entry content (MDX component)
 */
export async function loadLabEntryContent(slug: string): Promise<React.ComponentType> {
  const loader = getLabEntryLoader(slug);
  if (!loader) {
    throw new Error(`Loader not found for lab entry: ${slug}`);
  }
  const mod = await loader();
  return mod.default;
}
