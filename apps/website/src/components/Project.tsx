import { ReactNode } from "react";
import { ExternalLink } from "./ExternalLink";

interface ProjectProps {
  title: string;
  role?: string;
  url?: string;
  note?: string;
  children: ReactNode;
}

export const Project = ({ title, role, url, note, children }: ProjectProps) => (
  <div>
    <div className="text-base">
      {url ? (
        <ExternalLink href={url}>{title}</ExternalLink>
      ) : (
        <span className="text-primary-dark">{title}</span>
      )}
      {role && <span> - {role}</span>}
      {note && <span className="text-gray-400 text-sm italic"> ({note})</span>}
    </div>
    <p className="text-secondary-foreground text-sm leading-relaxed">{children}</p>
  </div>
);
