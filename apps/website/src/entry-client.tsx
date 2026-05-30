import { RouterProvider } from "@tanstack/react-router";
import { StrictMode, useEffect } from "react";
import { hydrateRoot } from "react-dom/client";
import { Document } from "./components/Document";
import { ThemeProvider } from "./context/ThemeContext";
import { createRouter } from "./router";
import { initializeCodeBlocks } from "./utils/codeBlockUtils";
import { parseThemeCookie } from "./utils/theme";
import "./style.css";

const router = createRouter();

// Derived from the same cookie the server used, so <html className> matches
// the SSR output and hydration sees no mismatch.
const theme = parseThemeCookie(document.cookie);

function App() {
  useEffect(() => {
    initializeCodeBlocks();
  }, []);

  return (
    <Document theme={theme}>
      <ThemeProvider initialTheme={theme}>
        <RouterProvider router={router} />
      </ThemeProvider>
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
