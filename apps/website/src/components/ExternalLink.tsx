import { cn } from "@matthuggins/ui";
import { LinkHTMLAttributes } from "react";

export const ExternalLink = ({ className, ...props }: LinkHTMLAttributes<HTMLAnchorElement>) => (
  <a
    {...props}
    className={cn("text-primary-dark hover:text-primary-darker hover:underline", className)}
  />
);
