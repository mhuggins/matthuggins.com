import {
  BriefcaseIcon,
  DesktopIcon,
  GraduationCapIcon,
  PackageIcon,
  UserIcon,
  WrenchIcon,
} from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { Experience } from "@/components/Experience";
import { Project } from "@/components/Project";
import { ResumeSection } from "@/components/ResumeSection";

export const Route = createFileRoute("/")({
  component: Resume,
});

function Resume() {
  return (
    <div className="flex flex-col gap-12">
      <ResumeSection title="Career Profile" icon={UserIcon}>
        Software engineer with broad experience across frontend, backend, and architectural
        decision-making. Passionate about building reliable, maintainable systems and intuitive user
        experiences.
      </ResumeSection>

      <ResumeSection title="Skills" icon={WrenchIcon}>
        React, TypeScript, JavaScript, CSS/SCSS, Ruby/Ruby on Rails, SQL, Java, PHP
      </ResumeSection>

      <ResumeSection title="Experience" icon={BriefcaseIcon}>
        <div className="flex flex-col gap-6">
          <Experience
            role="Staff Software Engineer"
            company="Prelude Security"
            location="Remote"
            startDate="Sept. 2024"
            tasks={[
              'Building intuitive user experiences to help CISOs answer the question: "am I protected?"',
            ]}
          />
          <Experience
            role="Staff Software Engineer"
            company="Tanium"
            location="Remote"
            startDate="Aug. 2019"
            endDate="Aug. 2024"
            tasks={[
              "Built cohesive first time user experiences with TypeScript and React.",
              "Automated common user workflows.",
              "Architected reusable front-end experiences for security management, enterprise risk, & software management applications.",
              "Coordinated with leadership and engineering to define project scope, team structure, and beneficial process changes.",
              "Led a team of 8 to coordinate the implementation of consistent React-based user experiences across 17 products.",
              "Created endpoint security management & software management applications with React.",
            ]}
          />
          <Experience
            role="Technical Lead"
            company="Upload Kapost"
            location="Boulder CO"
            startDate="Mar. 2015"
            endDate="Aug. 2019"
            tasks={[
              "Enabled team success through architectural decisions, scope definition, pair programming, code reviews, and general leadership and guidance.",
              "Architected scalable internal cross-application services using Ruby on Rails.",
              "Built consumer-grade application front-ends with React, Redux, and Webpack.",
            ]}
          />
          <Experience
            role="Senior Developer (Consultant)"
            company="Quick Left"
            location="Boulder CO"
            startDate="Jun. 2013"
            endDate="Mar. 2015"
            tasks={[
              "Built MVP mobile app for outdoor social network using Cordova, React, & Ampersand.js.",
              "Outlined and resolved technical problems preventing a financial startup’s growth by migrating from MongoDB to PostgreSQL, fixing inherent data structure flaws, and replacing custom encryption with an accepted standard.",
            ]}
          />
          <Experience
            role="Senior Developer"
            company="Bloomberg Law"
            location="New York NY"
            startDate="Jan. 2012"
            endDate="May 2013"
            tasks={[
              "Acted as team’s Ruby on Rails subject matter expert for the Bloomberg Law product.",
              "Replaced unreliable client architecture with a robust extensible gem solution for use with propriety API services.",
              "Introduced unit and functional test suites for existing code, and presented an ongoing testing strategy.",
            ]}
          />
          <Experience
            role="Web & Mobile Developer"
            company="Food on the Table, Austin TX"
            location="Austin TX"
            startDate="Feb. 2010"
            endDate="Jan. 2012"
            tasks={[
              "Utilized lean startup methodology to implement minimum viable product solutions focused on learning what the customer wants and needs from our product.",
              "Produced Ruby on Rails backend code and HTML, CSS, & jQuery front-ends to manage up to 40 concurrent experiments focused on continuously testing changes and learning user behavior.",
              "Responsible for Facebook Connect integration and coordination of viral acquisition efforts.",
              "Concurrently iterated on iPhone and Android mobile apps using data-driven development.",
            ]}
          />
          <Experience
            role="Game Developer"
            company="Challenge Online Games"
            location="Austin TX"
            startDate="Oct. 2008"
            endDate="Aug. 2009"
            tasks={[
              "Led company-wide integration of Facebook Platform into all games, resulting in Zynga acquisition.",
              "Designed and developed reusable cross-game components within the CakePHP MVC framework.",
              "Coordinated the delivery of resources from designers, artists, and programming team members for the duration of an experimental Facebook gaming project.",
            ]}
          />
          <Experience
            role="Applications Developer"
            company="QVC"
            location="West Chester PA"
            startDate="Jun. 2004"
            endDate="Aug. 2006"
            tasks={[
              "Built Java web services utilizing the Spring Framework for back-end processing.",
              "Designed and developed enterprise solutions within ASP.NET.",
              "Enhanced public websites and internal applications using Java, C#, C++, Perl and ASP languages.",
              "Resolved production issues for QVC.com, QVC.de, and QVC.co.uk via on-call support.",
              "Produced technical documentation formalizing functionality and semantics of enterprise system application processes.",
              "Developed enterprise applications utilizing Java-based web services, formatting XML data with XSL style sheets via ASP to present dynamic XHTML to Customer Service representatives.",
              "Maintained existing applications using ASP and VBScript for presentation and VB COM+ components for data source interaction.",
            ]}
          />
        </div>
      </ResumeSection>

      <ResumeSection title="Education" icon={GraduationCapIcon}>
        <div className="flex flex-col gap-4">
          <Project title="Masters Program, Business">University of Delaware (2004 - 2006)</Project>
          <Project title="BS in Computer Science">University of Delaware (2000 - 2004)</Project>
        </div>
      </ResumeSection>

      <ResumeSection title="Projects" icon={DesktopIcon}>
        <div className="flex flex-col gap-4">
          <Project title="SVGConverter.io" role="Creator" url="https://svgconverter.io">
            Web-app for converting raster images into vectorized SVGs.
          </Project>
          <Project title="nOS" role="Lead Developer" url="https://nos.io">
            Browser, app store, and crypto wallet for the nOS cryptocurrency.
          </Project>
          <Project title="Black Book Singles" role="Founder">
            Free online dating website and mobile application.
          </Project>
        </div>
      </ResumeSection>

      <ResumeSection title="OSS Contributions" icon={PackageIcon}>
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
