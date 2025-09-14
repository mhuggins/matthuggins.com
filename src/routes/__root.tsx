import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { BackgroundSection } from "@/components/BackgroundSection";
import { EmailIcon } from "@/components/icons/EmailIcon";
import { GitHubIcon } from "@/components/icons/GitHubIcon";
import { LinkedInIcon } from "@/components/icons/LinkedInIcon";
import { StackOverflowIcon } from "@/components/icons/StackOverflowIcon";
import { SidebarLink } from "@/components/SidebarLink";

export const Route = createRootRoute({
  component: Root,
});

function Root() {
  return (
    <div className="min-h-dvh bg-gray-100 font-sans text-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-8 print:p-0">
        <div className="grid min-h-screen grid-cols-4 gap-0 overflow-hidden bg-white shadow-lg">
          {/* Main Content - Left Column (3/4 width) */}
          <main className="col-span-3">
            {/* Navigation Header */}
            <nav className="bg-[#358799] px-12 text-white print:hidden">
              <div className="flex text-sm">
                <Link
                  to="/"
                  activeProps={{ className: "bg-[#42A8C0]" }}
                  className="px-4 py-4 font-medium hover:underline"
                >
                  Blog
                </Link>
                <Link
                  to="/resume"
                  activeProps={{ className: "bg-[#42A8C0]" }}
                  className="px-4 py-4 font-medium hover:underline active:bg-red"
                >
                  Resume
                </Link>
              </div>
            </nav>

            <div className="p-16 print:p-0">
              <Outlet />
            </div>
          </main>

          {/* Sidebar - Right Column (1/4 width) */}
          <aside className="col-span-1 bg-[#42A8C0] text-white print:text-gray-900">
            {/* Profile Section */}
            <div className="bg-[#358799] p-6 text-center print:py-0">
              <div className="mx-auto mb-4 h-32 w-32 overflow-hidden rounded-full border-4 border-gray-100 bg-gray-100 shadow-md">
                <img
                  src="https://github.com/mhuggins.png"
                  alt="Matt Huggins"
                  className="h-full w-full object-cover"
                />
              </div>
              <h1 className="mb-1 font-bold text-3xl">Matt Huggins</h1>
              <p className="font-light text-white/60 print:text-gray-900/60">
                Web &amp; Mobile Developer
              </p>
            </div>

            <div className="flex flex-col gap-16 p-6">
              {/* Contact Links */}
              <div className="flex flex-col items-start gap-4 text-sm">
                <SidebarLink
                  icon={<EmailIcon className="size-5" />}
                  title="Email"
                  label="matt.huggins@gmail.com"
                  href="mailto:matt.huggins@gmail.com"
                />
                <SidebarLink
                  icon={<LinkedInIcon className="size-5" />}
                  title="LinkedIn"
                  label="huggie"
                  href="https://www.linkedin.com/in/huggie"
                />
                <SidebarLink
                  icon={<GitHubIcon className="size-5" />}
                  title="GitHub"
                  label="mhuggins"
                  href="https://github.com/mhuggins"
                />
                <SidebarLink
                  icon={<StackOverflowIcon className="size-5" />}
                  title="StackOverflow"
                  label="matt-huggins"
                  href="https://stackoverflow.com/users/107277/matt-huggins"
                />
              </div>

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
