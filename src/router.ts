import { createRouter as createTanStackRouter, type RouterHistory } from "@tanstack/react-router";
import { NotFound } from "./components/NotFound";
import { routeTree } from "./routeTree.gen";

export function createRouter(opts?: { history?: RouterHistory }) {
  return createTanStackRouter({
    routeTree,
    defaultPreload: "intent",
    defaultPreloadDelay: 100,
    defaultNotFoundComponent: NotFound,
    scrollRestoration: true,
    // Force SSR mode on both server and client to ensure consistent rendering.
    // This prevents hydration mismatch where server uses SafeFragment but client
    // uses React.Suspense for route boundaries.
    isServer: true,
    ...opts,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
