import { cn } from "@matthuggins/ui";
import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

export interface PanelProps {
  title: string;
  icon: Icon;
  children: ReactNode;
  className?: string;
}

/** A titled card used for each group of controls. */
export const Panel = ({ title, icon: PanelIcon, children, className }: PanelProps) => (
  <section
    className={cn(
      "flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900",
      className,
    )}
  >
    <h3 className="flex items-center gap-2 font-semibold text-gray-500 text-xs uppercase tracking-wide dark:text-gray-400">
      <PanelIcon size={14} weight="bold" />
      {title}
    </h3>
    {children}
  </section>
);
