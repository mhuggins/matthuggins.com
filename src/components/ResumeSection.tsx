import { ReactNode } from "react";
import { Section, SectionProps } from "./Section";

export interface ResumeSectionProps extends Omit<SectionProps, "children"> {
  children: ReactNode;
}

export const ResumeSection = ({ children, ...props }: ResumeSectionProps) => (
  <Section {...props}>
    <div className="text-[#545E6C] text-sm leading-relaxed">{children}</div>
  </Section>
);
