import { exec } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type { Plugin } from "vite";

const execAsync = promisify(exec);

const pluginDir = dirname(fileURLToPath(import.meta.url));
const sitemapGeneratorPath = resolve(pluginDir, "../scripts/generate-sitemap.ts");

interface ContentWatcherOptions {
  /** Unscoped workspace package name that owns the content, e.g. "blog-content". */
  packageName: string;
}

/**
 * Vite plugin that regenerates a content package's metadata (and the sitemap)
 * whenever its markdown changes. The content itself lives in a workspace
 * package (e.g. @matthuggins/blog-content) and is symlinked into the app, so we
 * watch the real package directory and delegate regeneration to its build script.
 */
export function contentWatcherPlugin({ packageName }: ContentWatcherOptions): Plugin {
  const pluginName = `${packageName}-watcher`;

  if (process.env.VITEST) {
    return { name: pluginName };
  }

  const contentDir = resolve(pluginDir, `../../../packages/${packageName}/content`);
  const contentMatch = `${packageName}/content/`;
  const regenerateCommand = [
    `pnpm --filter @matthuggins/${packageName} build`,
    `tsx ${sitemapGeneratorPath}`,
  ].join(" && ");

  const isContentFile = (file: string) => file.includes(contentMatch) && /\.(md|mdx)$/i.test(file);

  let isBuilding = false;
  let hasInitialized = false;

  const regenerate = async (reason = `${packageName} changed`) => {
    if (isBuilding) return;

    isBuilding = true;
    console.log(`🔄 ${reason}, regenerating ${packageName} metadata...`);

    try {
      await execAsync(regenerateCommand);
      console.log(`✅ ${packageName} metadata regenerated`);
    } catch (error) {
      console.error(`❌ Error regenerating ${packageName} metadata:`, error);
    } finally {
      isBuilding = false;
    }
  };

  return {
    name: pluginName,
    buildStart() {
      // Run on initial build/dev start
      if (!hasInitialized) {
        hasInitialized = true;
        regenerate("Vite started");
      }
    },
    configureServer(server) {
      // Watch the package's content directory for changes
      server.watcher.add(`${contentDir}/**/*.{md,mdx}`);

      server.watcher.on("change", (file) => {
        if (isContentFile(file)) regenerate();
      });

      server.watcher.on("add", (file) => {
        if (isContentFile(file)) regenerate();
      });

      server.watcher.on("unlink", (file) => {
        if (isContentFile(file)) regenerate();
      });
    },
  };
}
