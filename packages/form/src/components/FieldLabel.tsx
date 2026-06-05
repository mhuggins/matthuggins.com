import { cn } from "@matthuggins/ui";
import type { LabelHTMLAttributes } from "react";

type FieldLabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const FieldLabel = ({ className, ...props }: FieldLabelProps) => (
  <label
    className={cn("text-gray-600 text-xs uppercase tracking-widest dark:text-white/50", className)}
    {...props}
  />
);
