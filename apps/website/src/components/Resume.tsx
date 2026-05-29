import {
  BriefcaseIcon,
  DesktopIcon,
  GraduationCapIcon,
  PackageIcon,
  UserIcon,
  WrenchIcon,
} from "@phosphor-icons/react";
import { Experience } from "./Experience";
import { Project } from "./Project";
import { ResumeSection } from "./ResumeSection";
import { type SkillSet, SkillSets } from "./SkillSets";

const skills: SkillSet[] = [
  {
    label: "Languages & Frameworks",
    items: [
      "React",
      "TypeScript",
      "JavaScript",
      "CSS/SCSS",
      "Ruby & Ruby on Rails",
      "SQL",
      "Java",
      "PHP",
    ],
  },
  {
    label: "Artificial Intelligence",
    items: [
      "LLM Integration",
      "AI Agent Architecture & Development",
      "Tool-Integrated AI Systems",
      "Prompt Engineering",
      "AI-Assisted Development Workflows",
    ],
  },
];

export function Resume() {
  return (
    <div className="flex flex-col gap-12">
      <header className="hidden print:block print:break-inside-avoid">
        <h1 className="font-bold text-2xl text-primary-dark">Matt Huggins</h1>
        <div className="text-secondary-foreground text-sm">
          Leander, TX • matt.huggins@gmail.com
        </div>
      </header>

      <ResumeSection title="Career Profile" icon={UserIcon} className="print:break-inside-avoid">
        Staff-level software engineer with 20+ years of experience building scalable web
        applications and developer platforms using React, TypeScript, Node.js, and Ruby on Rails.
        Experienced in frontend architecture, API design, and integrating LLM-powered features such
        as AI-generated reporting and workflow automation into production applications.
      </ResumeSection>

      <ResumeSection title="Skills" icon={WrenchIcon} className="print:break-inside-avoid">
        <SkillSets skills={skills} />
      </ResumeSection>

      <ResumeSection title="Experience" icon={BriefcaseIcon}>
        <div className="flex flex-col gap-6">
          <Experience
            company="Prelude Security"
            location="Seattle, Washington (Remote)"
            description='Provided intuitive user experiences to help CISOs answer the question: "am I protected?"'
            roles={[
              {
                title: "Staff Software Engineer",
                startDate: "Sept. 2024",
                endDate: "May 2026",
                tasks: [
                  "Built an AI-powered backend service in Node.js using the Vercel AI SDK, integrating LLM tool-calling with internal product APIs to automate contextual report generation.",
                  "Architected an interactive security control visualization using React Flow, providing real-time insight into EDR, Endpoint Management, Vulnerability Management, Email, and Identity security posture with animated node states and drill-down capabilities.",
                  "Built a comprehensive custom reporting system with time series, number, percentage, bar, column, and pie chart visualizations, including PDF export, JSON import/export, and advanced filtering.",
                  "Designed and implemented a robust OData filter architecture featuring a custom lexer/parser and predictive autocomplete, enabling consistent data querying across all platform surfaces.",
                  "Created a reusable form component library, migrating the entire application from react-hook-form to TanStack Form for improved type safety, performance, and developer experience.",
                  "Established E2E testing infrastructure with Playwright and Storybook, improving release confidence and component documentation.",
                ],
              },
            ]}
          />
          <Experience
            company="Tanium"
            location="Kirkland, Washington (Remote)"
            roles={[
              {
                title: "Staff Software Engineer",
                startDate: "Apr. 2022",
                endDate: "Aug. 2024",
                tasks: [
                  "Built cohesive first time user experiences with TypeScript and React.",
                  "Automated common user workflows.",
                ],
              },
              {
                title: "Principal Software Engineer",
                startDate: "Jan. 2021",
                endDate: "Apr. 2022",
                tasks: [
                  "Architected reusable front-end experiences for security management, enterprise risk, & software management applications.",
                  "Coordinated with leadership and engineering to define project scope, team structure, and beneficial process changes.",
                ],
              },
              {
                title: "Senior Software Engineer",
                startDate: "Aug. 2019",
                endDate: "Jan. 2021",
                tasks: [
                  "Led a team of 8 to coordinate the implementation of consistent React-based user experiences across 17 products.",
                  "Created endpoint security management & software management applications with React.",
                ],
              },
            ]}
          />
          <Experience
            company="Upland Kapost"
            location="Boulder CO"
            roles={[
              {
                title: "Technical Lead",
                startDate: "Mar. 2018",
                endDate: "Aug. 2019",
                tasks: [
                  "Enabled team success through architectural decisions, scope definition, pair programming, code reviews, and general leadership and guidance.",
                  "Architected scalable internal cross-application services using Ruby on Rails.",
                  "Built consumer-grade application front-ends with React, Redux, and Webpack.",
                ],
              },
              {
                title: "Senior Developer",
                startDate: "Mar. 2015",
                endDate: "Mar. 2018",
                tasks: [
                  "Authored the open-source “circuitry” rubygem for reliable cross-application fanout messaging atop Amazon SNS & SQS.",
                ],
              },
            ]}
          />
          <Experience
            company="Quick Left"
            location="Boulder CO"
            roles={[
              {
                title: "Senior Developer (Consultant)",
                startDate: "Jun. 2013",
                endDate: "Mar. 2015",
                tasks: [
                  "Built MVP mobile app for outdoor social network using Cordova, React, & Ampersand.js.",
                  "Outlined and resolved technical problems preventing a financial startup’s growth by migrating from MongoDB to PostgreSQL, fixing inherent data structure flaws, and replacing custom encryption with an accepted standard.",
                ],
              },
            ]}
          />
          <Experience
            company="Bloomberg Law"
            location="New York NY"
            roles={[
              {
                title: "Senior Developer",
                startDate: "Jan. 2012",
                endDate: "May 2013",
                tasks: [
                  "Acted as team’s Ruby on Rails subject matter expert for the Bloomberg Law product.",
                  "Replaced unreliable client architecture with a robust extensible gem solution for use with propriety API services.",
                  "Introduced unit and functional test suites for existing code, and presented an ongoing testing strategy.",
                ],
              },
            ]}
          />
          <Experience
            company="Food on the Table, Austin TX"
            location="Austin TX"
            roles={[
              {
                title: "Web & Mobile Developer",
                startDate: "Feb. 2010",
                endDate: "Jan. 2012",
                tasks: [
                  "Utilized lean startup methodology to implement minimum viable product solutions focused on learning what the customer wants and needs from our product.",
                  "Produced Ruby on Rails backend code and HTML, CSS, & jQuery front-ends to manage up to 40 concurrent experiments focused on continuously testing changes and learning user behavior.",
                  "Responsible for Facebook Connect integration and coordination of viral acquisition efforts.",
                  "Concurrently iterated on iPhone and Android mobile apps using data-driven development.",
                ],
              },
            ]}
          />
          <Experience
            company="Challenge Online Games"
            location="Austin TX"
            roles={[
              {
                title: "Game Developer",
                startDate: "Oct. 2008",
                endDate: "Aug. 2009",
                tasks: [
                  "Led company-wide integration of Facebook Platform into all games, resulting in Zynga acquisition.",
                  "Designed and developed reusable cross-game components within the CakePHP MVC framework.",
                  "Coordinated the delivery of resources from designers, artists, and programming team members for the duration of an experimental Facebook gaming project.",
                ],
              },
            ]}
          />
          <Experience
            company="QVC"
            location="West Chester PA"
            roles={[
              {
                title: "Applications Developer",
                startDate: "Jun. 2004",
                endDate: "Aug. 2006",
                tasks: [
                  "Built Java web services utilizing the Spring Framework for back-end processing.",
                  "Designed and developed enterprise solutions within ASP.NET.",
                  "Enhanced public websites and internal applications using Java, C#, C++, Perl and ASP languages.",
                  "Resolved production issues for QVC.com, QVC.de, and QVC.co.uk via on-call support.",
                  "Produced technical documentation formalizing functionality and semantics of enterprise system application processes.",
                  "Developed enterprise applications utilizing Java-based web services, formatting XML data with XSL style sheets via ASP to present dynamic XHTML to Customer Service representatives.",
                  "Maintained existing applications using ASP and VBScript for presentation and VB COM+ components for data source interaction.",
                ],
              },
            ]}
          />
        </div>
      </ResumeSection>

      <ResumeSection
        title="Education"
        icon={GraduationCapIcon}
        className="print:break-inside-avoid"
      >
        <div className="flex flex-col gap-4">
          <Project title="Masters Program, Business">
            University of Delaware <span className="text-gray-400">(2004 - 2006)</span>
          </Project>
          <Project title="BS in Computer Science">
            University of Delaware <span className="text-gray-400">(2000 - 2004)</span>
          </Project>
        </div>
      </ResumeSection>

      <ResumeSection title="Projects" icon={DesktopIcon} className="print:break-inside-avoid">
        <div className="flex flex-col gap-4">
          <Project title="Codebound" role="Creator" url="https://codebound.io">
            Programmable collectible card game. <em>(In development.)</em>
          </Project>
          <Project title="SVGConverter.io" role="Creator" url="https://svgconverter.io">
            Web-app for converting raster images into vectorized SVGs.
          </Project>
          <Project title="nOS" role="Lead Developer" past url="https://nos.io">
            Browser, app store, and crypto wallet for the nOS cryptocurrency.
          </Project>
          <Project title="Black Book Singles" role="Founder" past>
            Free online dating website and mobile application.
          </Project>
        </div>
      </ResumeSection>

      <ResumeSection
        title="OSS Contributions"
        icon={PackageIcon}
        className="print:break-inside-avoid"
      >
        <div className="flex flex-col gap-4">
          <Project title="circuitry" url="https://github.com/kapost/circuitry">
            Ruby gem for decoupling applications via Amazon SNS fanout and SQS processing.
          </Project>
          <Project title="ruby-measurement" url="https://github.com/mhuggins/ruby-measurement">
            Ruby gem for calculating and converting units of measure.
          </Project>
          <Project
            title="@poker-apprentice/hand-evaluator"
            url="https://github.com/poker-apprentice/hand-evaluator"
          >
            TypeScript package for determining the strongest possible poker hand based upon the
            known cards.
          </Project>
          <Project
            title="@poker-apprentice/hand-history-parser"
            url="https://github.com/poker-apprentice/hand-history-parser"
          >
            TypeScript package for parsing hand histories from online poker sites.
          </Project>
          <Project
            title="@poker-apprentice/hand-history-analyzer"
            url="https://github.com/poker-apprentice/hand-history-analyzer"
          >
            TypeScript package for analyzing hand histories from online poker sites.
          </Project>
          <Project
            title="@poker-apprentice/hand-range-notation"
            url="https://github.com/poker-apprentice/hand-range-notation"
          >
            TypeScript package for converting poker hand range notations to and from actual poker
            hands.
          </Project>
        </div>
      </ResumeSection>
    </div>
  );
}
