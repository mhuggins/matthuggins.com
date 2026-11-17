import { ReactNode } from "react";
import { ExternalLink } from "./ExternalLink";

interface ProjectProps {
  title: string;
  /** Image URL shown beside the project. Pass `null` to reserve the space without an image. */
  icon?: string | null;
  role?: string;
  url?: string;
  note?: string;
  children: ReactNode;
}

export const Project = ({ title, icon, role, url, note, children }: ProjectProps) => (
  <div className="flex items-start">
    {icon !== undefined && (
      <div className="mx-2 mt-0.5 size-5 shrink-0">
        {icon && <img src={icon} alt="" className="size-full object-contain" />}
      </div>
    )}
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
  </div>
);
