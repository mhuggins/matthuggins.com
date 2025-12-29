import { RouterProvider } from "@tanstack/react-router";
import { StrictMode, useEffect } from "react";
import { hydrateRoot } from "react-dom/client";
import { createRouter } from "./router";
import { initializeCodeBlocks } from "./utils/codeBlockUtils";

const router = createRouter();

function App() {
  useEffect(() => {
    initializeCodeBlocks();
  }, []);

  return <RouterProvider router={router} />;
}

router.load().then(() => {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    hydrateRoot(
      rootElement,
      <StrictMode>
        <App />
      </StrictMode>,
    );
  }
});
