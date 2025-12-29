import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import type { ViteDevServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const port = process.env.PORT || 3000;

interface ManifestEntry {
  file: string;
  css?: string[];
}

// Read Vite manifest to get the hashed asset filenames
function getProductionAssets(): { scripts: string[]; styles: string[] } {
  const manifestPath = path.join(__dirname, "client", ".vite", "manifest.json");
  const manifest: Record<string, ManifestEntry> = JSON.parse(
    fs.readFileSync(manifestPath, "utf-8"),
  );
  const entry = manifest["entry-client.tsx"] || manifest["src/entry-client.tsx"];

  const scripts = entry ? [`/${entry.file}`] : [];
  const styles = entry?.css?.map((css) => `/${css}`) ?? [];

  return { scripts, styles };
}

async function createServer() {
  const app = express();
  let vite: ViteDevServer | null = null;

  if (!isProd) {
    // Development: Use Vite middleware
    const { createServer: createViteServer } = await import("vite");
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve static assets
    app.use(
      "/assets",
      express.static(path.join(__dirname, "client", "assets"), {
        immutable: true,
        maxAge: "1y",
      }),
    );
    app.use(
      express.static(path.join(__dirname, "client"), {
        index: false,
      }),
    );
  }

  // Handle all routes with SSR
  app.get("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      let render: (
        url: string,
        options: { scripts: string[]; styles: string[] },
      ) => Promise<string>;
      let scripts: string[];
      let styles: string[];

      if (!isProd && vite) {
        // Dev: load entry on the fly, include Vite client scripts
        const entryServer = await vite.ssrLoadModule("/entry-server.tsx");
        render = entryServer.render;
        scripts = ["/@vite/client", "/entry-client.tsx"];
        styles = ["/style.css"];
      } else {
        // Prod: use built assets
        const entryServerPath = path.join(__dirname, "server", "entry-server.js");
        const entryServer = await import(entryServerPath);
        render = entryServer.render;
        const assets = getProductionAssets();
        scripts = assets.scripts;
        styles = assets.styles;
      }

      const html = await render(url, { scripts, styles });
      res.status(200).set({ "Content-Type": "text/html" }).send(html);
    } catch (e) {
      console.error("SSR Error:", e);
      if (!isProd && vite) {
        vite.ssrFixStacktrace(e as Error);
      }
      next(e);
    }
  });

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

createServer();
