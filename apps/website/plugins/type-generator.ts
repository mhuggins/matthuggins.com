import { exec } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type { Plugin } from "vite";

const execAsync = promisify(exec);

const __dirname = dirname(fileURLToPath(import.meta.url));

const scriptPath = resolve(
  __dirname,
  "../../../packages/cargo-dispatch/scripts/generate-api-types.ts",
);

const playerApiFile = resolve(__dirname, "../../../packages/cargo-dispatch/src/lib/api.ts");

export function typeGeneratorPlugin(): Plugin {
  if (process.env.VITEST) {
    return { name: "type-generator" };
  }

  let isRunning = false;
  let hasInitialized = false;

  const runGenerate = async () => {
    if (isRunning) return;
    isRunning = true;
    console.log("🔄 Regenerating Monaco type definitions...");
    try {
      await execAsync(`tsx ${scriptPath}`);
      console.log("✅ Monaco type definitions regenerated");
    } catch (error) {
      console.error("❌ Error regenerating Monaco type definitions:", error);
    } finally {
      isRunning = false;
    }
  };

  return {
    name: "type-generator",
    buildStart() {
      if (!hasInitialized) {
        hasInitialized = true;
        void runGenerate();
      }
    },
    configureServer(server) {
      server.watcher.add(playerApiFile);
      server.watcher.on("change", (file) => {
        if (file === playerApiFile) {
          void runGenerate();
        }
      });
    },
  };
}
