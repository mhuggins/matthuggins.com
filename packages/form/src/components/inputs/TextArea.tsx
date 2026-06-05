import { cn } from "@matthuggins/ui";
import type { HTMLProps } from "react";

export interface TextAreaProps extends HTMLProps<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const TextArea = ({ className, id, hasError, ...props }: TextAreaProps) => (
  <textarea
    id={id}
    className={cn(
      "rounded-xl",
      "border border-gray-300 bg-primary/10 px-4 py-3 disabled:cursor-not-allowed disabled:bg-black/10",
      "font-sans text-gray-900 text-sm placeholder:text-gray-400",
      "transition-all duration-200 focus:border-primary focus:outline-none",
      "dark:border-white/10 dark:bg-white/5 dark:text-white/90 dark:placeholder:text-white/30",
      "dark:disabled:bg-black/30 dark:focus:border-white/30 dark:focus:bg-white/10",
      "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-white/20 overscroll-none",
      className,
      hasError && "border-red-500 dark:border-red-400",
    )}
    {...props}
  />
);
