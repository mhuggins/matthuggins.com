import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import type { ViteDevServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const port = process.env.PORT || 3000;

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
    // Production: Serve static assets (but not index.html - that goes through SSR)
    app.use(
      "/assets",
      express.static(path.join(__dirname, "client", "assets"), {
        immutable: true,
        maxAge: "1y",
      }),
    );
    app.use(
      express.static(path.join(__dirname, "client"), {
        index: false, // Don't serve index.html for / - let SSR handle it
      }),
    );
  }

  // Handle all routes with SSR
  app.get("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      let template: string;
      let render: (url: string) => Promise<string>;

      if (!isProd && vite) {
        // Dev: load template and entry on the fly
        template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        const entryServer = await vite.ssrLoadModule("/entry-server.tsx");
        render = entryServer.render;
      } else {
        // Prod: use built assets
        template = fs.readFileSync(path.join(__dirname, "client", "index.html"), "utf-8");
        const entryServerPath = path.join(__dirname, "server", "entry-server.js");
        const entryServer = await import(entryServerPath);
        render = entryServer.render;
      }

      const appHtml = await render(url);
      const html = template.replace("<!--ssr-outlet-->", appHtml);

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
