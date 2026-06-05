import type { Icon as IconType } from "@phosphor-icons/react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: ButtonSize;
  intent?: ButtonIntent;
  icon: IconType;
};

type ButtonSize = keyof typeof sizes;
type ButtonIntent = keyof typeof intents;

const sizes = {
  xs: 14,
  sm: 14,
  md: 20,
};

const intents = {
  primary: cn(
    "rounded-full border border-primary/40 bg-primary/10 text-primary not-disabled:hover:bg-primary/20",
    "dark:border-white/10 dark:bg-white/10 dark:text-white/80 dark:not-disabled:hover:bg-white/15",
  ),
  secondary: cn(
    "rounded-full border border-gray-300 bg-white text-gray-700 not-disabled:hover:bg-gray-100 not-disabled:hover:text-gray-900",
    "dark:border-white/20 dark:bg-black/5 dark:text-white/60 dark:not-disabled:hover:border-white/40 dark:not-disabled:hover:bg-black/30 dark:not-disabled:hover:text-white/80",
  ),
  inline: cn(
    "text-gray-400 not-disabled:hover:text-black/50",
    "dark:text-white/80 dark:not-disabled:hover:text-white",
  ),
};

export const IconButton = ({
  className,
  size = "md",
  type = "button",
  intent = "secondary",
  icon: Icon,
  children,
  ...props
}: IconButtonProps) => (
  <button
    type={type}
    className={cn(
      "cursor-pointer transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50",
      intents[intent],
      className,
    )}
    {...props}
  >
    {<Icon size={sizes[size]} />}
  </button>
);
