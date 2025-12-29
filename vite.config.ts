import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import mdx from "@mdx-js/rollup";
import rehypeShiki from "@shikijs/rehype";
import {
  transformerMetaHighlight,
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
} from "@shikijs/transformers";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import type { Element, ElementContent, Text } from "hast";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import type { ShikiTransformer } from "shiki";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { blogWatcherPlugin } from "./plugins/blog-watcher";

export default defineConfig({
  root: "./src",
  publicDir: "../public",
  build: {
    minify: "esbuild",
    sourcemap: false,
    target: "es2018",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(dirname(fileURLToPath(import.meta.url)), "src/index.html"),
      },
    },
  },
  ssr: {
    noExternal: ["@tanstack/react-router", "@phosphor-icons/react"],
  },
  plugins: [
    blogWatcherPlugin(),
    tsconfigPaths(),
    tanstackRouter({ target: "react", autoCodeSplitting: false }),
    mdx({
      mdExtensions: [".md"],
      remarkPlugins: [
        remarkGfm,
        remarkFrontmatter,
        [remarkMdxFrontmatter, { name: "frontmatter" }],
      ],
      rehypePlugins: [
        [
          rehypeShiki,
          {
            theme: "github-light",
            transformers: [
              transformerNotationHighlight(),
              transformerNotationFocus(),
              transformerNotationDiff(),
              transformerNotationErrorLevel(),
              transformerMetaHighlight(),
              {
                name: "add-language-data",
                preprocess(_code, options) {
                  // Store the language in the options for later use
                  this.options = options;
                },
                pre(node: Element) {
                  // Add data attribute with the language
                  const options = this.options;
                  if (options?.lang) {
                    if (!node.properties) node.properties = {};
                    node.properties["data-language"] = options.lang;
                  }
                },
              } satisfies ShikiTransformer,
              {
                name: "add-language-label",
                pre(node: Element) {
                  // Get language from the data-language attribute we set above
                  const lang = String(node.properties?.["data-language"] || "text");

                  // Extract text content from code element for copying
                  const codeElement = node.children.find(
                    (child): child is Element =>
                      child.type === "element" && child.tagName === "code",
                  );
                  let codeText = "";

                  if (codeElement) {
                    // Recursively extract text from all text nodes
                    const extractText = (element: Element | ElementContent | Text): string => {
                      if (element.type === "text") {
                        return element.value;
                      } else if ("children" in element && element.children) {
                        return element.children.map(extractText).join("");
                      }
                      return "";
                    };
                    codeText = extractText(codeElement);
                  }

                  // Add language label and copy button
                  const labelElement: Element = {
                    type: "element",
                    tagName: "div",
                    properties: {
                      className: "code-block-header",
                    },
                    children: [
                      {
                        type: "element",
                        tagName: "span",
                        properties: { className: ["font-mono", "text-xs", "text-gray-600"] },
                        children: [{ type: "text", value: lang }],
                      },
                      {
                        type: "element",
                        tagName: "button",
                        properties: {
                          className: ["copy-code-btn", "ml-2"],
                          title: "Copy code",
                          "data-code": codeText,
                        },
                        children: [],
                      },
                    ],
                  };

                  // Add the header as first child
                  node.children.unshift(labelElement);
                },
              } satisfies ShikiTransformer,
            ],
          },
        ],
      ],
    }),
    react(),
    tailwindcss(),
  ],
});
