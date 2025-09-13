import { ReactNode } from "react";
import { ExternalLink } from "./ExternalLink";

interface ProjectProps {
  title: string;
  role?: string;
  url?: string;
  children: ReactNode;
}

export const Project = ({ title, role, url, children }: ProjectProps) => (
  <div>
    <div className="text-base">
      {url ? (
        <ExternalLink href={url}>{title}</ExternalLink>
      ) : (
        <span className="text-[#2D7788]">{title}</span>
      )}
      {role && <span> - {role}</span>}
    </div>
    <p className="text-[#545E6C] text-sm leading-relaxed">{children}</p>
  </div>
);
