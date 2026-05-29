import { Icon } from "@phosphor-icons/react";

export const CircleIcon = ({ icon: Icon, size }: { icon: Icon; size: number }) => (
  <span className="print-exact rounded-full bg-primary-dark p-2 text-white">
    <Icon size={size} weight="fill" />
  </span>
);
