import { Icon } from "@phosphor-icons/react";
import { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { CircleIcon } from "./CircleIcon";

export interface SectionProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: Icon;
  children: ReactNode;
  className?: string;
  headingClassName?: string;
}

export const Section = ({
  title,
  subtitle,
  icon,
  children,
  className,
  headingClassName,
}: SectionProps) => (
  <section className={cn("flex flex-col gap-4", className)}>
    <div className="flex flex-col gap-1">
      <h2
        className={cn(
          "flex items-center gap-2 font-normal text-primary-dark text-xl tracking-wide",
          headingClassName,
        )}
      >
        {icon && <CircleIcon icon={icon} size={18} />}
        {title}
      </h2>
      {subtitle && <div className={cn("text-gray-500 text-sm", icon && "ml-10")}>{subtitle}</div>}
    </div>
    <div>{children}</div>
  </section>
);
