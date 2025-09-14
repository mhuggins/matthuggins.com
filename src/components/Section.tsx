import { Icon } from "@phosphor-icons/react";
import { ReactNode } from "react";
import { CircleIcon } from "./CircleIcon";

export interface SectionProps {
  title: string;
  icon: Icon;
  children: ReactNode;
}

export const Section = ({ title, icon, children }: SectionProps) => (
  <section className="flex flex-col gap-4">
    <h2 className="flex items-center gap-2 font-normal text-[#2D7788] text-xl uppercase tracking-wide">
      <CircleIcon icon={icon} size={18} />
      {title}
    </h2>
    <div>{children}</div>
  </section>
);
