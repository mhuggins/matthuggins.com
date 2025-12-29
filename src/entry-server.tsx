import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { renderToPipeableStream } from "react-dom/server";
import { createRouter } from "./router";

export async function render(url: string): Promise<string> {
  const history = createMemoryHistory({ initialEntries: [url] });
  const router = createRouter({ history });

  await router.load();

  return new Promise((resolve, reject) => {
    let html = "";

    const { pipe } = renderToPipeableStream(
      <StrictMode>
        <RouterProvider router={router} />
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
          writable.on("finish", () => resolve(html));
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
