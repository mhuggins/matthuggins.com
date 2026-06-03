import { exec } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type { Plugin } from "vite";

const execAsync = promisify(exec);

const pluginName = "lab-watcher";

const pluginDir = dirname(fileURLToPath(import.meta.url));
const contentDir = resolve(pluginDir, "../../../packages/lab-content/content");
const sitemapGeneratorPath = resolve(pluginDir, "../scripts/generate-sitemap.ts");

const regenerateCommand = [
  "pnpm --filter @matthuggins/lab-content build",
  `tsx ${sitemapGeneratorPath}`,
].join(" && ");

function isLabContent(file: string) {
  return file.includes("lab-content/content/") && /\.(md|mdx)$/i.test(file);
}

export function labWatcherPlugin(): Plugin {
  if (process.env.VITEST) {
    return { name: pluginName };
  }

  let isBuilding = false;
  let hasInitialized = false;

  const runLabScript = async (reason = "Lab content changed") => {
    if (isBuilding) return;

    isBuilding = true;
    console.log(`🔄 ${reason}, regenerating lab metadata...`);

    try {
      await execAsync(regenerateCommand);
      console.log("✅ Lab metadata regenerated");
    } catch (error) {
      console.error("❌ Error regenerating lab metadata:", error);
    } finally {
      isBuilding = false;
    }
  };

  return {
    name: pluginName,
    buildStart() {
      if (!hasInitialized) {
        hasInitialized = true;
        runLabScript("Vite started");
      }
    },
    configureServer(server) {
      server.watcher.add(`${contentDir}/**/*.{md,mdx}`);

      server.watcher.on("change", (file) => {
        if (isLabContent(file)) {
          runLabScript();
        }
      });

      server.watcher.on("add", (file) => {
        if (isLabContent(file)) {
          runLabScript();
        }
      });

      server.watcher.on("unlink", (file) => {
        if (isLabContent(file)) {
          runLabScript();
        }
      });
    },
  };
}
