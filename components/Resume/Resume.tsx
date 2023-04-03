import React from 'react';
import { EDUCATION } from '../../constants/education';
import { EXPERIENCE } from '../../constants/experience';
import { PROJECTS } from '../../constants/projects';
import { SKILLS } from '../../constants/skills';
import Company from './Company';
import Education from './Education';
import Page from '../Page';
import Section from './Section';
import Skill from './Skill';
import Project from './Project';

const Resume = () => (
  <Page title="Resume">
    <Section title="Skills">
      {SKILLS.map((skill, i) => (
        <Skill key={i} name={skill.name} years={skill.years} proficiency={skill.proficiency} />
      ))}
    </Section>

    <Section title="Experience">
      {EXPERIENCE.map((experience, i) => (
        <Company
          key={i}
          name={experience.company}
          location={experience.location}
          roles={experience.roles}
        />
      ))}
    </Section>

    <Section title="Projects">
      {PROJECTS.map((project, i) => (
        <Project
          key={i}
          name={project.name}
          location={project.location}
          roles={project.roles}
        />
      ))}
    </Section>

    <Section title="Education">
      {EDUCATION.map((education, i) => (
        <Education
          key={i}
          school={education.school}
          degree={education.degree}
          program={education.program}
          start={education.start}
          end={education.end}
        />
      ))}
    </Section>
  </Page>
);

export default Resume;
