import { Fragment } from "react/jsx-runtime";

export interface SkillSet {
  label: string;
  items: string[];
}

export function SkillSets({ skills }: { skills: SkillSet[] }) {
  return (
    <dl>
      {skills.map((skill) => (
        <Fragment key={skill.label}>
          <dt className="font-semibold">{skill.label}:</dt>
          <dd className="not-last:mb-2">{skill.items.join(", ")}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
