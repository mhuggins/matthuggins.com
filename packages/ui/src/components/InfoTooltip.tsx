import { Icon, InfoIcon } from "@phosphor-icons/react";
import { type ReactNode } from "react";
import { cn } from "../utils/cn";
import { Tooltip } from "./Tooltip";

export function InfoTooltip({
  children,
  icon: Icon,
  className,
}: {
  children: ReactNode;
  icon?: Icon;
  className?: string;
}) {
  return (
    <Tooltip
      trigger={<InfoIcon className="size-4" />}
      placement="top"
      className={cn("flex max-w-72 items-start gap-2 text-xs", className)}
    >
      {Icon && <Icon weight="bold" className="size-4 shrink-0" />}
      <div>{children}</div>
    </Tooltip>
  );
}
