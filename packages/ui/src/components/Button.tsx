import type { Icon as IconType } from "@phosphor-icons/react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: ButtonSize;
  intent?: ButtonIntent;
  icon?: IconType;
};

type ButtonSize = keyof typeof sizes;
type ButtonIntent = keyof typeof intents;

const sizes = {
  xs: cn("gap-1 px-2 py-0.5 text-xs"),
  sm: cn("gap-2 px-3 py-1.5 text-xs"),
  md: cn("gap-3 px-5 py-3"),
};

const intents = {
  primary: cn(
    "border-primary/40 bg-primary/10 text-primary not-disabled:hover:bg-primary/20",
    "dark:border-white/10 dark:bg-white/10 dark:text-white/80 dark:not-disabled:hover:bg-white/15",
  ),
  secondary: cn(
    "border-gray-300 bg-white text-gray-700 not-disabled:hover:bg-gray-100 not-disabled:hover:text-gray-900",
    "dark:border-white/20 dark:bg-black/5 dark:text-white/60 dark:not-disabled:hover:border-white/40 dark:not-disabled:hover:bg-black/30 dark:not-disabled:hover:text-white/80",
  ),
};

const iconSizes: Record<ButtonSize, number> = {
  xs: 14,
  sm: 14,
  md: 20,
};

export const Button = ({
  className,
  size = "md",
  type = "button",
  intent = "secondary",
  icon: Icon,
  children,
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={cn(
      "flex cursor-pointer items-center justify-center rounded-full border transition-all duration-300",
      "font-medium text-xs uppercase tracking-widest transition-colors",
      "not-disabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
      sizes[size],
      intents[intent],
      className,
    )}
    {...props}
  >
    {Icon && <Icon size={iconSizes[size]} />}
    {children}
  </button>
);
