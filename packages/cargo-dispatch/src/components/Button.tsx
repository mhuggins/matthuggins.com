import { cn } from "@matthuggins/ui";
import type { Icon } from "@phosphor-icons/react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  intent?: "primary" | "secondary" | "success" | "error";
} & ({ icon: Icon; children?: undefined } | { icon?: Icon; children: ReactNode });

export const Button = ({
  intent = "secondary",
  icon: ButtonIcon,
  children,
  className,
  ...props
}: ButtonProps) => (
  <button
    {...props}
    className={cn(
      "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] disabled:cursor-default",
      intent === "primary" && children && "px-4",
      intent === "primary" &&
        "bg-blue-600 font-semibold text-white outline-black disabled:bg-blue-300",
      intent === "secondary" && "bg-gray-100 text-gray-700 ring ring-gray-300",
      intent === "success" &&
        "bg-green-600 font-semibold text-white outline-black disabled:bg-green-300",
      intent === "error" && "bg-red-600 font-semibold text-white outline-black disabled:bg-red-300",
      className,
    )}
  >
    {ButtonIcon && <ButtonIcon weight="bold" size={13} />}
    {children}
  </button>
);
