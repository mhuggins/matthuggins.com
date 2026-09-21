import { cn } from "@matthuggins/ui";

export interface SegmentedControlProps<T extends string> {
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Rendered as a group label for screen readers. */
  label: string;
  className?: string;
}

/** A wrapping row of mutually exclusive choices. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className={cn(
            "cursor-pointer rounded-md px-2.5 py-1 text-[13px] ring transition-colors",
            value === option.id
              ? "bg-primary text-white ring-primary"
              : "bg-gray-100 text-gray-700 ring-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-600 dark:hover:bg-gray-700",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
