import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: Root,
});

function Root() {
  return (
    <div className="min-h-dvh bg-white text-zinc-900">
      <header className="border-zinc-200 border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <Link to="/" className="font-semibold tracking-tight">
            matthuggins.com
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link to="/resume" className="text-zinc-700 hover:text-zinc-900">
              Resume
            </Link>
            <Link to="/blog" className="text-zinc-700 hover:text-zinc-900">
              Blog
            </Link>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="mt-16 border-zinc-200 border-t">
        <div className="mx-auto max-w-5xl p-4 text-xs text-zinc-500">
          © {new Date().getFullYear()} Matt Huggins
        </div>
      </footer>
      <TanStackRouterDevtools />
    </div>
  );
}
