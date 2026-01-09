import { createFileRoute } from "@tanstack/react-router";
import { Resume } from "@/components/Resume";
import { DOMAIN } from "@/constants/site";

export const Route = createFileRoute("/")({
  component: ResumePage,
});

function ResumePage() {
  const title = "Resume - Matt Huggins";
  const description =
    "Experienced web and mobile developer specializing in React, TypeScript, JavaScript, and Ruby on Rails";
  const url = `${DOMAIN}/`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Matt Huggins",
    url,
    jobTitle: "Software Engineer",
    description,
    sameAs: [
      "https://github.com/matthuggins",
      "https://www.linkedin.com/in/matthuggins",
      "https://stackoverflow.com/users/82754/matt-huggins",
    ],
  };

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta
        name="keywords"
        content="resume, matt huggins, software, web, mobile, developer, development, engineer, react, typescript, javascript, ruby, ruby on rails"
      />

      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="profile" />
      <meta property="og:site_name" content="Matt Huggins" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />

      {/* Structured Data */}
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>

      <Resume />
    </>
  );
}
