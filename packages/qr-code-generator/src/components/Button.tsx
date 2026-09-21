import { cn } from "@matthuggins/ui";
import type { ButtonHTMLAttributes } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  intent?: "primary" | "secondary" | "ghost";
};

export const Button = ({ intent = "secondary", className, ...props }: ButtonProps) => (
  <button
    type="button"
    {...props}
    className={cn(
      "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-1.5 font-medium text-[13px] transition-colors disabled:cursor-default disabled:opacity-50",
      intent === "primary" && "bg-primary text-white hover:bg-primary-dark",
      intent === "secondary" &&
        "bg-gray-100 text-gray-700 ring ring-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-600 dark:hover:bg-gray-700",
      intent === "ghost" &&
        "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
      className,
    )}
  />
);
