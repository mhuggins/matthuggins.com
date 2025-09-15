import { createRootRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { BackgroundSection } from "@/components/BackgroundSection";
import { ContactLinks } from "@/components/ContactLinks";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { Profile } from "@/components/Profile";
import { cn } from "@/utils/cn";

export const Route = createRootRoute({
  component: Root,
});

function Root() {
  const {
    location: { pathname },
  } = useRouterState();
  const isBlogActive = pathname.split("/")[1] === "blog";

  return (
    <div className="min-h-dvh bg-gray-100 font-sans text-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-4 md:py-8 print:p-0">
        <div className="min-h-screen overflow-hidden bg-white shadow-lg md:flex">
          {/* Main Content */}
          <main className="md:flex-1">
            {/* Navigation Header */}
            <nav className="bg-[#358799] px-4 text-white md:px-12 print:hidden">
              <div className="flex items-center justify-between text-sm">
                {/* Mobile: Navigation Links on left */}
                <div className="flex text-sm md:hidden">
                  <Link
                    to="/"
                    activeProps={{ className: "bg-[#42A8C0]" }}
                    className="px-4 py-4 font-medium hover:underline"
                  >
                    Resume
                  </Link>
                  <Link
                    to="/blog"
                    className={cn(
                      "px-4 py-4 font-medium hover:underline",
                      isBlogActive && "bg-[#42A8C0]",
                    )}
                  >
                    Blog
                  </Link>
                </div>

                {/* Desktop: Navigation Links */}
                <div className="hidden text-sm md:flex">
                  <Link
                    to="/"
                    activeProps={{ className: "bg-[#42A8C0]" }}
                    className="px-4 py-4 font-medium hover:underline active:bg-red"
                  >
                    Resume
                  </Link>
                  <Link
                    to="/blog"
                    className={cn(
                      "px-4 py-4 font-medium hover:underline",
                      isBlogActive && "bg-[#42A8C0]",
                    )}
                  >
                    Blog
                  </Link>
                </div>

                {/* Mobile: Hamburger Menu on right */}
                <HamburgerMenu />
              </div>
            </nav>

            <div className="p-4 md:p-16 print:p-0">
              <Outlet />
            </div>
          </main>

          {/* Sidebar - Hidden on mobile, visible on desktop */}
          <aside className="hidden bg-[#42A8C0] text-white md:block md:w-64 print:text-gray-900">
            <Profile />

            <div className="flex flex-col gap-16 p-6">
              <ContactLinks />

              <BackgroundSection
                title="Education"
                entries={[
                  {
                    name: "Masters Program, Business",
                    metadata: ["University of Delaware", "2004 - 2006"],
                  },
                  {
                    name: "BS in Computer Science",
                    metadata: ["University of Delaware", "2000 - 2004"],
                  },
                ]}
              />

              <BackgroundSection
                title="Languages"
                entries={[
                  { name: "English", metadata: ["Native"] },
                  { name: "French", metadata: ["Novice"] },
                ]}
              />
            </div>
          </aside>
        </div>
      </div>

      <TanStackRouterDevtools />
    </div>
  );
}
