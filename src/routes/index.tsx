import { createFileRoute } from "@tanstack/react-router";
import { Resume } from "@/components/Resume";

export const Route = createFileRoute("/")({
  component: ResumePage,
});

function ResumePage() {
  return (
    <>
      <title>Resume - Matt Huggins</title>
      <meta name="description" content="Matt Huggins, experienced web and mobile developer" />
      <meta
        name="keywords"
        content="resume, matt huggins, software, web, mobile, developer, development, engineer, react, typescript, javascript, ruby, ruby on rails"
      />
      <Resume />
    </>
  );
}
