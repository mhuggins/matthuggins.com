import { cn } from "@/utils/cn";
import { EmailIcon } from "./icons/EmailIcon";
import { GitHubIcon } from "./icons/GitHubIcon";
import { LinkedInIcon } from "./icons/LinkedInIcon";
import { StackOverflowIcon } from "./icons/StackOverflowIcon";
import { SidebarLink } from "./SidebarLink";

export interface ContactLinksProps {
  className?: string;
}

export const ContactLinks = ({ className }: ContactLinksProps) => (
  <div className={cn("flex flex-col items-start gap-4 text-sm", className)}>
    <SidebarLink
      icon={<EmailIcon className="size-5" />}
      title="Email"
      label="matt.huggins@gmail.com"
      href="mailto:matt.huggins@gmail.com"
    />
    <SidebarLink
      icon={<LinkedInIcon className="size-5" />}
      title="LinkedIn"
      label="huggie"
      href="https://www.linkedin.com/in/huggie"
    />
    <SidebarLink
      icon={<GitHubIcon className="size-5" />}
      title="GitHub"
      label="mhuggins"
      href="https://github.com/mhuggins"
    />
    <SidebarLink
      icon={<StackOverflowIcon className="size-5" />}
      title="StackOverflow"
      label="matt-huggins"
      href="https://stackoverflow.com/users/107277/matt-huggins"
    />
  </div>
);
