import { Icon } from "@phosphor-icons/react";

export const CircleIcon = ({ icon: Icon, size }: { icon: Icon; size: number }) => (
  <span className="rounded-full bg-[#2D7788] p-2 text-white">
    <Icon size={size} weight="fill" />
  </span>
);
