import { ReactNode } from "react";
import { ExternalLink } from "./ExternalLink";

interface ProjectProps {
  title: string;
  role?: string;
  url?: string;
  past?: boolean;
  children: ReactNode;
}

export const Project = ({ title, role, url, past, children }: ProjectProps) => (
  <div>
    <div className="text-base">
      {url ? (
        <ExternalLink href={url}>{title}</ExternalLink>
      ) : (
        <span className="text-primary-dark">{title}</span>
      )}
      {role && <span> - {role}</span>}
      {past && <span className="text-muted text-sm italic"> (Past)</span>}
    </div>
    <p className="text-secondary-foreground text-sm leading-relaxed">{children}</p>
  </div>
);
