import { createRouter as createTanStackRouter, type RouterHistory } from "@tanstack/react-router";
import { NotFound } from "./components/NotFound";
import { routeTree } from "./routeTree.gen";

export function createRouter(opts?: { history?: RouterHistory }) {
  const router = createTanStackRouter({
    routeTree,
    defaultPreload: "intent",
    defaultPreloadDelay: 100,
    defaultNotFoundComponent: NotFound,
    scrollRestoration: true,
    ...opts,
  });

  // On client, set ssr to truthy so TanStack Router uses SafeFragment instead of
  // React.Suspense for route boundaries. This matches server behavior and prevents
  // hydration mismatch with React 19's metadata hoisting.
  if (typeof document !== "undefined") {
    router.ssr = { manifest: undefined };
  }

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
