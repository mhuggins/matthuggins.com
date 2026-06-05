import { cn } from "@matthuggins/ui";
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  iconBefore?: ReactNode;
  iconAfter?: ReactNode;
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ iconBefore, iconAfter, hasError, className, ...inputProps }, ref) => (
    <div className="relative">
      {iconBefore && (
        <div className="-translate-y-1/2 absolute top-1/2 left-3 flex transform items-center text-gray-400 dark:text-white/40">
          {iconBefore}
        </div>
      )}
      <input
        ref={ref}
        type="text"
        className={cn(
          "w-full resize-none rounded-xl",
          "border border-gray-300 bg-primary/10 px-4 py-3 disabled:cursor-not-allowed disabled:bg-black/10",
          "font-sans text-gray-900 text-sm placeholder:text-gray-400",
          "transition-all duration-200 focus:border-primary focus:outline-none",
          "dark:border-white/10 dark:bg-white/5 dark:text-white/90 dark:placeholder:text-white/30",
          "dark:disabled:bg-black/30 dark:focus:border-white/30 dark:focus:bg-white/10",
          "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-white/20",
          className,
          hasError && "border-red-500 dark:border-red-400",
          iconBefore && "pl-10",
          iconAfter && "pr-10",
        )}
        {...inputProps}
      />
      {iconAfter && (
        <div className="-translate-y-1/2 absolute top-1/2 right-3 flex transform items-center text-gray-400 dark:text-white/40">
          {iconAfter}
        </div>
      )}
    </div>
  ),
);
