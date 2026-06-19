import { cn } from "@matthuggins/ui";
import type { ButtonHTMLAttributes } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export const Button = ({ active = false, className, ...props }: ButtonProps) => (
  <button
    type="button"
    {...props}
    className={cn(
      "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] ring ring-gray-300 disabled:cursor-default disabled:opacity-50",
      active ? "bg-[#1e3a5f] text-white ring-[#1e3a5f]" : "bg-gray-100 text-gray-700",
      className,
    )}
  />
);
