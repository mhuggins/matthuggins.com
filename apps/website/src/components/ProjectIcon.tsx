import { cn } from "@matthuggins/ui";

export interface ProjectIconProps {
  src: string;
  /** Tile background color (any CSS color). Defaults to white (gray-100 in dark mode). */
  background?: string;
}

/**
 * Project icon on a rounded tile, app-icon style. The tile keeps the (often
 * green/teal) project artwork legible against the teal sidebar.
 */
export const ProjectIcon = ({ src, background }: ProjectIconProps) => (
  <span
    className={cn(
      "print-exact flex size-6 shrink-0 items-center justify-center rounded-md shadow-sm",
      !background && "bg-white dark:bg-gray-100",
    )}
    style={background ? { backgroundColor: background } : undefined}
  >
    <img src={src} alt="" className="size-5 object-contain" />
  </span>
);
