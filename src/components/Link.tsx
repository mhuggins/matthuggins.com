import { LinkComponentProps, Link as RouterLink } from "@tanstack/react-router";
import { cn } from "@/utils/cn";

export const Link = ({ className, ...props }: LinkComponentProps<"a">) => (
  <RouterLink
    {...props}
    className={cn("text-[#2D7788] hover:text-[#1A454F] hover:underline", className)}
  />
);
