import { cn } from "@matthuggins/ui";
import { CaretDownIcon } from "@phosphor-icons/react";
import { forwardRef, type ReactNode, type SelectHTMLAttributes } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  iconBefore?: ReactNode;
  hasError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ iconBefore, hasError, className, children, ...selectProps }, ref) => (
    <div className="relative">
      {iconBefore && (
        <div className="-translate-y-1/2 absolute top-1/2 left-3 flex transform items-center text-gray-400 dark:text-white/40">
          {iconBefore}
        </div>
      )}
      <select
        ref={ref}
        className={cn(
          "w-full appearance-none rounded-xl",
          "cursor-pointer border border-gray-300 bg-primary/10 py-3 pr-10 pl-4 disabled:cursor-not-allowed disabled:bg-black/10",
          "font-sans text-gray-900 text-sm placeholder:text-gray-400",
          "transition-all duration-200 focus:border-primary focus:outline-none",
          "dark:border-white/10 dark:bg-white/5 dark:text-white/90 dark:placeholder:text-white/30",
          "dark:disabled:bg-black/30 dark:focus:border-white/30 dark:focus:bg-white/10",
          className,
          hasError && "border-red-500 dark:border-red-400",
          iconBefore && "pl-10",
        )}
        {...selectProps}
      >
        {children}
      </select>
      <div className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-3 flex items-center text-gray-400 dark:text-white/40">
        <CaretDownIcon weight="bold" className="size-4" />
      </div>
    </div>
  ),
);
