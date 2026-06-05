import { cn } from "@matthuggins/ui";
import type { HTMLAttributes } from "react";

type FieldErrorProps = HTMLAttributes<HTMLDivElement>;

export const FieldError = ({ className, ...props }: FieldErrorProps) => (
  <div
    role="alert"
    className={cn("text-red-600 text-sm dark:text-red-400", className)}
    {...props}
  />
);
