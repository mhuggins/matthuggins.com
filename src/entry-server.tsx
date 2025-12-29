import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { renderToPipeableStream } from "react-dom/server";
import { Document } from "./components/Document";
import { createRouter } from "./router";

interface RenderOptions {
  scripts?: string[];
  styles?: string[];
}

export async function render(url: string, options: RenderOptions = {}): Promise<string> {
  const { scripts = [], styles = [] } = options;
  const history = createMemoryHistory({ initialEntries: [url] });
  const router = createRouter({ history });

  await router.load();

  return new Promise((resolve, reject) => {
    let html = "";

    const { pipe } = renderToPipeableStream(
      <StrictMode>
        <Document scripts={scripts} styles={styles}>
          <RouterProvider router={router} />
        </Document>
      </StrictMode>,
      {
        async onAllReady() {
          const { Writable } = await import("node:stream");
          const writable = new Writable({
            write(chunk: Buffer, _encoding: string, callback: () => void) {
              html += chunk.toString();
              callback();
            },
          });
          writable.on("finish", () => resolve("<!DOCTYPE html>" + html));
          writable.on("error", reject);
          pipe(writable);
        },
        onError(error) {
          reject(error);
        },
      },
    );
  });
}
