import { Icon } from "@phosphor-icons/react";
import { ReactNode } from "react";
import { CircleIcon } from "./CircleIcon";

export interface ResumeSectionProps {
  title: string;
  icon: Icon;
  children: ReactNode;
}

export const ResumeSection = ({ title, icon, children }: ResumeSectionProps) => (
  <section className="flex flex-col gap-4">
    <h2 className="flex items-center gap-2 font-normal text-[#2D7788] text-xl uppercase tracking-wide">
      <CircleIcon icon={icon} size={18} />
      {title}
    </h2>
    <p className="text-[#545E6C] text-sm leading-relaxed">{children}</p>
  </section>
);
