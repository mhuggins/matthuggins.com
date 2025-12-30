import { createRootRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import Codebound from "@/assets/codebound.png";
import SvgConverter from "@/assets/svg-converter.svg";
import { BackgroundSection } from "@/components/BackgroundSection";
import { ContactLinks } from "@/components/ContactLinks";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { Profile } from "@/components/Profile";
import { Tags } from "@/components/Tags";
import { getAllPosts, getAllTags } from "@/data/blog-metadata";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/formatDate";

const TanStackRouterDevtools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import("@tanstack/react-router-devtools").then((res) => ({
        default: res.TanStackRouterDevtools,
      })),
    );

// Only render DevTools on client to avoid SSR hydration issues
function ClientOnlyDevtools() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return null;
  }

  return (
    <Suspense>
      <TanStackRouterDevtools />
    </Suspense>
  );
}

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
          <main className="overflow-hidden md:flex-1">
            {/* Navigation Header */}
            <nav className="bg-primary px-4 text-white md:px-12 print:hidden">
              <div className="flex items-center justify-between text-sm">
                {/* Mobile: Navigation Links on left */}
                <div className="flex text-sm md:hidden">
                  <Link
                    to="/"
                    activeProps={{ className: "bg-primary-light" }}
                    className="px-4 py-4 font-medium hover:underline"
                  >
                    Resume
                  </Link>
                  <Link
                    to="/blog"
                    className={cn(
                      "px-4 py-4 font-medium hover:underline",
                      isBlogActive && "bg-primary-light",
                    )}
                  >
                    Blog
                  </Link>
                </div>

                {/* Desktop: Navigation Links */}
                <div className="hidden text-sm md:flex">
                  <Link
                    to="/"
                    activeProps={{ className: "bg-primary-light" }}
                    className="px-4 py-4 font-medium hover:underline active:bg-red"
                  >
                    Resume
                  </Link>
                  <Link
                    to="/blog"
                    className={cn(
                      "px-4 py-4 font-medium hover:underline",
                      isBlogActive && "bg-primary-light",
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
          <aside className="hidden shrink-0 bg-primary-light text-white md:block md:w-64 print:text-gray-900">
            <Profile />

            <div className="flex flex-col gap-12 p-6">
              <ContactLinks />

              <BackgroundSection
                title="Projects"
                entries={[
                  {
                    name: (
                      <ProjectLink name="Codebound" image={Codebound} href="https://codebound.io" />
                    ),
                    metadata: ["Collectible card game"],
                  },
                  {
                    name: (
                      <ProjectLink
                        name="SVGConverter.io"
                        image={SvgConverter}
                        href="https://svgconverter.io"
                      />
                    ),
                    metadata: ["Vectorize raster images"],
                  },
                ]}
              />

              <BackgroundSection
                title="Recent Blog Posts"
                entries={getAllPosts({ limit: 3 }).map((post) => ({
                  name: (
                    <Link
                      to="/blog/posts/$slug"
                      params={{ slug: post.metadata.slug }}
                      className="hover:underline"
                    >
                      {post.metadata.title}
                    </Link>
                  ),
                  metadata: [formatDate(post.metadata.date)],
                }))}
              />

              <BackgroundSection title="Blog Topics">
                <Tags tags={getAllTags()} />
              </BackgroundSection>
            </div>
          </aside>
        </div>
      </div>

      <ClientOnlyDevtools />
    </div>
  );
}

function ProjectLink({ name, href, image }: { name: string; href: string; image: string }) {
  return (
    <a href={href} target="_blank" className="inline-flex items-center gap-2 hover:underline">
      <img src={image} className="size-4 drop-shadow-md" />
      {name}
    </a>
  );
}
