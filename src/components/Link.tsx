import { LinkComponentProps, Link as RouterLink } from "@tanstack/react-router";
import { cn } from "@/utils/cn";

export const Link = ({ className, ...props }: LinkComponentProps<"a">) => (
  <RouterLink
    {...props}
    className={cn("text-primary-dark hover:text-primary-darker hover:underline", className)}
  />
);
