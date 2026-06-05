import { cn } from "@matthuggins/ui";
import { CaretRightIcon } from "@phosphor-icons/react";
import { type ReactNode, useId, useState } from "react";

export interface CollapsibleProps {
  /** Header label shown in the always-visible toggle. */
  title: ReactNode;
  /** Whether the section starts expanded. Defaults to collapsed. */
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

/** A single collapsible disclosure section: a clickable header that expands to
 * reveal its content. Each instance manages its own open state. */
export const Collapsible = ({
  title,
  defaultOpen = false,
  children,
  className,
}: CollapsibleProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left text-gray-600 text-xs uppercase tracking-widest dark:text-white/50"
      >
        <CaretRightIcon
          weight="bold"
          className={cn(
            "size-3.5 shrink-0 text-gray-400 transition-transform",
            open && "rotate-90",
          )}
        />
        {title}
      </button>
      {open && (
        <div id={contentId} className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
};
