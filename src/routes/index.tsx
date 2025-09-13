import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
  pendingComponent: Pending,
});

function Index() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 font-bold text-2xl">Welcome</h1>
      <p className="mb-4 text-zinc-700">Check out the resume and the blog:</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link to="/resume" className="rounded border p-4 hover:bg-zinc-50">
          <div className="font-medium">Resume</div>
          <div className="text-sm text-zinc-600">Experience, skills, and education</div>
        </Link>
        <Link to="/blog" className="rounded border p-4 hover:bg-zinc-50">
          <div className="font-medium">Blog</div>
          <div className="text-sm text-zinc-600">Articles and notes in MDX</div>
        </Link>
      </div>
    </div>
  );
}

function Pending() {
  return <div>Loading...</div>;
}
