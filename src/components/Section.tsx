import { Icon } from "@phosphor-icons/react";
import { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { CircleIcon } from "./CircleIcon";

export interface SectionProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon: Icon;
  children: ReactNode;
  className?: string;
}

export const Section = ({ title, subtitle, icon, children, className }: SectionProps) => (
  <section className={cn("flex flex-col gap-4", className)}>
    <div className="flex flex-col gap-1">
      <h2 className="flex items-center gap-2 font-normal text-[#2D7788] text-xl uppercase tracking-wide">
        <CircleIcon icon={icon} size={18} />
        {title}
      </h2>
      {subtitle && <div className="ml-10 text-gray-500 text-sm">{subtitle}</div>}
    </div>
    <div>{children}</div>
  </section>
);
