import Page from "../Page";

import Section from "./Section";
import Skill from "./Skill";
import Experience from "./Experience";
import Education from "./Education";
import styles from "./Resume.scss";

const Resume = () => (
  <Page className={styles.resume} title="Resume">
    <Section title="Skills">
      <Skill name="Ruby / Rails" years={10} proficiency="Expert" />
      <Skill name="JavaScript" years={14} proficiency="Expert" />
      <Skill name="CSS" years={14} proficiency="Expert" />
      <Skill name="React" years={5} proficiency="Advanced" />
      <Skill name="SQL" years={10} proficiency="Advanced" />
      <Skill name="Java" years={5} proficiency="Moderate" />
      <Skill name="PHP" years={4} proficiency="Moderate" />
    </Section>

    <Section title="Experience">
      <Experience
        company={{ name: "Kapost", url: "https://kapost.com", location: "Boulder, CO" }}
        role="Tech Lead"
        start={new Date('2015-03-01T00:00:00-0600')}
        points={[
          "Enabling team success through architectural decisions, scope definition, pair programming, code reviews, and general leadership and guidance.",
          "Architecting scalable internal cross-application services using Ruby on Rails.",
          "Building consumer-grade application front-ends with React, Redux, and WebPack.",
        ]}
      />

      <Experience
        company={{ name: "nOS", url: "https://nos.io", location: "Malta" }}
        role="Lead Developer"
        start={new Date('2018-04-01T00:00:00-0600')}
        end={new Date('2019-03-01T00:00:00-0600')}
        points={[
          "Implemented secure API layer for safely interacting with distributed blockchain applications on behalf of cryptocurrency addresses.",
          "Built custom protocol for accessing apps built for and registered on a blockchain in a familiar browser interface.",
        ]}
      />

      <Experience
        company={{ name: "Quick Left", url: "https://quickleft.com", location: "Boulder, CO" }}
        role="Senior Developer (Consultant)"
        start={new Date('2013-06-01T00:00:00-0600')}
        end={new Date('2015-03-01T00:00:00-0600')}
        points={[
          "Built MVP mobile app for outdoor social network using Cordova, React, & Ampersand.js.",
          "Outlined and resolved technical problems preventing a financial startup’s growth by migrating from MongoDB to PostgreSQL, fixing inherent data structure flaws, and replacing custom encryption with an accepted standard.",
        ]}
      />

      <Experience
        company={{ name: "Black Book Singles", location: "Austin, TX" }}
        role="Founder"
        start={new Date('2008-07-01T00:00:00-0600')}
        end={new Date('2013-12-01T00:00:00-0600')}
        points={[
          "Individually coordinated the design and development of a free online dating service.",
          "Developed and released Android mobile application.",
          "Acquired all users through search engine optimization techniques.",
        ]}
      />

      <Experience
        company={{ name: "Bloomberg Law", url: "https://bloomberglaw.com", location: "New York, NY" }}
        role="Senior Developer"
        start={new Date('2012-01-15T00:00:00-0600')}
        end={new Date('2013-05-15T00:00:00-0600')}
        points={[
          "Acted as team’s Ruby on Rails subject matter expert for the Bloomberg Law product.",
          "Replaced unreliable client architecture with a robust extensible gem solution for use with propriety API services.",
          "Introduced unit and functional test suites for existing code, and presenting an ongoing testing strategy.",
        ]}
      />

      <Experience
        company={{ name: "Food on the Table", location: "Austin, TX" }}
        role="Developer"
        start={new Date('2010-02-01T00:00:00-0600')}
        end={new Date('2012-01-05T00:00:00-0600')}
        points={[
          "Utilized lean startup methodology to implement MVP solutions based upon multivariate testing results and user feedback.",
          "Integrated with Facebook Connect to coordinate viral acquisition efforts.",
          "Concurrently iterated iPhone & Android mobile apps using data-driven development.",
        ]}
      />

      <Experience
        company={{ name: "Challenge Online Games, Inc.", location: "Austin, TX" }}
        role="Developer"
        start={new Date('2008-10-01T00:00:00-0600')}
        end={new Date('2009-08-01T00:00:00-0600')}
        points={[
          "Led company-wide integration of Facebook Platform into all games, resulting in Zynga acquisition.",
          "Designed and developed reusable cross-game components within the CakePHP MVC framework.",
          "Coordinated the delivery of resources from designers, artists, and programming team members for the duration of an experimental Facebook gaming project.",
        ]}
      />

      <Experience
        company={{ name: "QVC, Inc.", url: "https://qvc.com", location: "West Chester, PA" }}
        role="Applications Developer"
        start={new Date('2004-06-01T00:00:00-0600')}
        end={new Date('2006-08-01T00:00:00-0600')}
        points={[
          "Built Java web services utilizing the Spring Framework for back-end processing.",
          "Designed and developed enterprise solutions within ASP.NET.",
          "Enhanced public websites and internal applications using Java, C#, C++, Perl and ASP languages.",
          "Resolved production issues for QVC.com, QVC.de, and QVC.co.uk via on-call support.",
          "Produced technical documentation formalizing functionality and semantics of enterprise system application processes.",
          "Developed enterprise applications utilizing Java-based web services, formatting XML data with XSL style sheets via ASP to present dynamic XHTML to Customer Service representatives.",
          "Maintained existing applications using ASP and VBScript for presentation and VB COM+ components for data source interaction.",
        ]}
      />
    </Section>

    <Section title="Education">
      <Education
        school="University of Delaware"
        degree="Bachelors"
        program="Computer & Information Sciences"
        start={new Date('2000-09-01T00:00:00-0600')}
        end={new Date('2004-05-01T00:00:00-0600')}
      />

      <Education
        school="University of Delaware"
        degree="Masters Program"
        program="Business"
        start={new Date('2004-09-01T00:00:00-0600')}
        end={new Date('2006-12-01T00:00:00-0600')}
      />
    </Section>
  </Page>
);

export default Resume;
