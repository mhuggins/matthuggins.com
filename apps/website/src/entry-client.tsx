import { RouterProvider } from "@tanstack/react-router";
import { StrictMode, useEffect } from "react";
import { hydrateRoot } from "react-dom/client";
import { Document } from "./components/Document";
import { createRouter } from "./router";
import { initializeCodeBlocks } from "./utils/codeBlockUtils";
import "./style.css";

const router = createRouter();

function App() {
  useEffect(() => {
    initializeCodeBlocks();
  }, []);

  return (
    <Document>
      <RouterProvider router={router} />
    </Document>
  );
}

router.load().then(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
