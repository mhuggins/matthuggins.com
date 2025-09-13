import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  root: "./src",
  build: {
    outDir: "../dist",
    minify: false,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(dirname(fileURLToPath(import.meta.url)), "src/index.html"),
      },
    },
  },
  plugins: [
    tsconfigPaths(),
    tanstackRouter({ target: "react", autoCodeSplitting: false }),
    mdx({
      mdExtensions: [".md"],
      remarkPlugins: [
        remarkGfm,
        remarkFrontmatter,
        [remarkMdxFrontmatter, { name: "frontmatter" }],
      ],
    }),
    react(),
    tailwindcss(),
  ],
});
