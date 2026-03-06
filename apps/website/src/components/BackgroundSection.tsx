import { ReactNode } from "react";

export interface BackgroundSectionProps {
  title: string;
  entries?: BackgroundEntry[];
  children?: ReactNode;
}

interface BackgroundEntry {
  name: ReactNode;
  metadata: string[];
}

export const BackgroundSection = ({ title, entries, children }: BackgroundSectionProps) => (
  <div className="flex flex-col gap-3">
    <div className="font-semibold uppercase">{title}</div>
    {entries?.map((entry, i) => (
      <div key={i} className="text-sm">
        <div className="mb-1 font-semibold">{entry.name}</div>
        {entry.metadata.map((datum, j) => (
          <div key={`${i}_${j}`} className="text-white/60 leading-tight print:text-gray-900/60">
            {datum}
          </div>
        ))}
      </div>
    ))}
    {children && <div>{children}</div>}
  </div>
);
