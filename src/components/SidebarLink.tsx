import { ReactNode } from "react";

export interface SidebarLinkProps {
  href: string;
  icon: ReactNode;
  label: string;
  title: string;
}

export const SidebarLink = ({ href, icon, label, title }: SidebarLinkProps) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    title={title}
    className="inline-flex items-center gap-2 text-white hover:underline print:text-gray-900/60"
  >
    {icon}
    {label}
  </a>
);
