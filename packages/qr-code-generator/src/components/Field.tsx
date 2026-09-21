import { cn } from "@matthuggins/ui";
import { type ReactNode, useId } from "react";

export interface FieldProps {
  label: string;
  hint?: ReactNode;
  className?: string;
  children: (id: string) => ReactNode;
}

/** Label + control pairing that owns the generated id, so every input is labelled. */
export const Field = ({ label, hint, className, children }: FieldProps) => {
  const id = useId();

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className="font-medium text-gray-600 text-xs uppercase tracking-wide dark:text-gray-400"
      >
        {label}
      </label>
      {children(id)}
      {hint && <p className="text-gray-500 text-xs dark:text-gray-400">{hint}</p>}
    </div>
  );
};
