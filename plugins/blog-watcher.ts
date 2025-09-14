import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { Plugin } from "vite";

const execAsync = promisify(exec);

export function blogWatcherPlugin(): Plugin {
  let isBuilding = false;
  let hasInitialized = false;

  const runBlogScript = async (reason = "Blog content changed") => {
    if (isBuilding) return;

    isBuilding = true;
    console.log(`🔄 ${reason}, regenerating metadata...`);

    try {
      await execAsync("tsx scripts/generate-blog-metadata.ts");
      console.log("✅ Blog metadata regenerated");
    } catch (error) {
      console.error("❌ Error regenerating blog metadata:", error);
    } finally {
      isBuilding = false;
    }
  };

  return {
    name: "blog-watcher",
    buildStart() {
      // Run on initial build/dev start
      if (!hasInitialized) {
        hasInitialized = true;
        runBlogScript("Vite started");
      }
    },
    configureServer(server) {
      // Watch the blog content directory for changes
      server.watcher.add("src/content/blog/**/*.{md,mdx}");

      server.watcher.on("change", (file) => {
        if (file.includes("src/content/blog/") && /\.(md|mdx)$/i.test(file)) {
          runBlogScript();
        }
      });

      server.watcher.on("add", (file) => {
        if (file.includes("src/content/blog/") && /\.(md|mdx)$/i.test(file)) {
          runBlogScript();
        }
      });

      server.watcher.on("unlink", (file) => {
        if (file.includes("src/content/blog/") && /\.(md|mdx)$/i.test(file)) {
          runBlogScript();
        }
      });
    },
  };
}
