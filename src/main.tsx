import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { routeTree } from "./routeTree.gen";
import { initializeCodeBlocks } from "./utils/codeBlockUtils";
import "./style.css";

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadDelay: 100,
  defaultNotFoundComponent: () => (
    <div className="mx-auto max-w-3xl p-6">The page you're looking for does not exist.</div>
  ),
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// App wrapper component to initialize code blocks
function App() {
  useEffect(() => {
    initializeCodeBlocks();
  }, []);

  return <RouterProvider router={router} />;
}

// Render the app
const rootElement = document.getElementById("root");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
