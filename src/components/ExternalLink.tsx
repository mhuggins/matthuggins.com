import { LinkHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export const ExternalLink = ({ className, ...props }: LinkHTMLAttributes<HTMLAnchorElement>) => (
  <a {...props} className={cn("text-[#2D7788] hover:text-[#1A454F] hover:underline", className)} />
);
