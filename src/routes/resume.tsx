import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/resume")({
  component: Resume,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 font-semibold text-xl tracking-tight">{title}</h2>
      <div className="space-y-3 text-sm text-zinc-700 leading-6">{children}</div>
    </section>
  );
}

function Resume() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <header className="mb-8">
        <h1 className="font-bold text-3xl tracking-tight">Matt Huggins</h1>
        <p className="text-zinc-600">Experienced Software Engineer</p>
        <nav className="mt-2 flex gap-4 text-blue-700 text-sm">
          <a href="mailto:matt.huggins@gmail.com" className="hover:underline">
            matt.huggins@gmail.com
          </a>
          <a
            href="https://github.com/mhuggins"
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            github.com/mhuggins
          </a>
          <a
            href="https://www.linkedin.com/in/matthuggins"
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            linkedin.com/in/matthuggins
          </a>
          <Link to="/blog" className="hover:underline">
            Blog
          </Link>
        </nav>
      </header>

      <Section title="Summary">
        <p>
          Software engineer with broad experience across frontend, backend, and infrastructure.
          Passionate about building reliable, maintainable systems and great user experiences.
        </p>
      </Section>

      <Section title="Skills">
        <p>
          JavaScript/TypeScript, React, Node.js, APIs, SQL/NoSQL, Testing, CI/CD, Cloud (AWS/GCP),
          Containers, Observability, Accessibility.
        </p>
      </Section>

      <Section title="Experience">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-medium">Senior Software Engineer — Company</h3>
            <span className="text-xs text-zinc-500">2020-Present</span>
          </div>
          <ul className="mt-1 ml-5 list-disc text-sm">
            <li>Led development of scalable web applications with React and Node.</li>
            <li>Improved performance and reliability through profiling and observability.</li>
            <li>Partnered with product/design to deliver user-focused features.</li>
          </ul>
        </div>
        <div>
          <div className="mt-4 flex items-baseline justify-between gap-2">
            <h3 className="font-medium">Software Engineer — Company</h3>
            <span className="text-xs text-zinc-500">2016-2020</span>
          </div>
          <ul className="mt-1 ml-5 list-disc text-sm">
            <li>Built APIs and services; contributed to frontend architecture.</li>
            <li>Authored tooling, test automation, and CI workflows.</li>
          </ul>
        </div>
      </Section>

      <Section title="Education">
        <p>B.S. in Computer Science — University</p>
      </Section>
    </div>
  );
}
