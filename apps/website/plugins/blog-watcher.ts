import { exec } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type { Plugin } from "vite";

const execAsync = promisify(exec);

const pluginName = "blog-watcher";

const pluginDir = dirname(fileURLToPath(import.meta.url));
const contentDir = resolve(pluginDir, "../../../packages/blog-content/content");
const sitemapGeneratorPath = resolve(pluginDir, "../scripts/generate-sitemap.ts");

const regenerateCommand = [
  "pnpm --filter @matthuggins/blog-content build",
  `tsx ${sitemapGeneratorPath}`,
].join(" && ");

function isBlogContent(file: string) {
  return file.includes("blog-content/content/") && /\.(md|mdx)$/i.test(file);
}

export function blogWatcherPlugin(): Plugin {
  if (process.env.VITEST) {
    return { name: pluginName };
  }

  let isBuilding = false;
  let hasInitialized = false;

  const runBlogScript = async (reason = "Blog content changed") => {
    if (isBuilding) return;

    isBuilding = true;
    console.log(`🔄 ${reason}, regenerating blog metadata...`);

    try {
      await execAsync(regenerateCommand);
      console.log("✅ Blog metadata regenerated");
    } catch (error) {
      console.error("❌ Error regenerating blog metadata:", error);
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
        runBlogScript("Vite started");
      }
    },
    configureServer(server) {
      // Watch the package's blog content directory for changes
      server.watcher.add(`${contentDir}/**/*.{md,mdx}`);

      server.watcher.on("change", (file) => {
        if (isBlogContent(file)) {
          runBlogScript();
        }
      });

      server.watcher.on("add", (file) => {
        if (isBlogContent(file)) {
          runBlogScript();
        }
      });

      server.watcher.on("unlink", (file) => {
        if (isBlogContent(file)) {
          runBlogScript();
        }
      });
    },
  };
}
