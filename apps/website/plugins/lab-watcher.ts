import { exec } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type { Plugin } from "vite";

const execAsync = promisify(exec);
const scriptPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../scripts/generate-lab-metadata.ts",
);

export function labWatcherPlugin(): Plugin {
  if (process.env.VITEST) {
    return { name: "lab-watcher" };
  }

  let isBuilding = false;
  let hasInitialized = false;

  const runLabScript = async (reason = "Lab content changed") => {
    if (isBuilding) return;

    isBuilding = true;
    console.log(`🔄 ${reason}, regenerating lab metadata...`);

    try {
      await execAsync(`tsx ${scriptPath}`);
      console.log("✅ Lab metadata regenerated");
    } catch (error) {
      console.error("❌ Error regenerating lab metadata:", error);
    } finally {
      isBuilding = false;
    }
  };

  return {
    name: "lab-watcher",
    buildStart() {
      if (!hasInitialized) {
        hasInitialized = true;
        runLabScript("Vite started");
      }
    },
    configureServer(server) {
      server.watcher.add("src/content/lab/**/*.{md,mdx}");

      server.watcher.on("change", (file) => {
        if (file.includes("src/content/lab/") && /\.(md|mdx)$/i.test(file)) {
          runLabScript();
        }
      });

      server.watcher.on("add", (file) => {
        if (file.includes("src/content/lab/") && /\.(md|mdx)$/i.test(file)) {
          runLabScript();
        }
      });

      server.watcher.on("unlink", (file) => {
        if (file.includes("src/content/lab/") && /\.(md|mdx)$/i.test(file)) {
          runLabScript();
        }
      });
    },
  };
}
