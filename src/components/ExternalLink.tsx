import { LinkHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export const ExternalLink = ({ className, ...props }: LinkHTMLAttributes<HTMLAnchorElement>) => (
  <a
    {...props}
    className={cn("text-primary-dark hover:text-primary-darker hover:underline", className)}
  />
);
