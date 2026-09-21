import { cn } from "@matthuggins/ui";
import { useEffect, useId, useState } from "react";
import { normalizeHex } from "../lib/color";

export interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * A native color well paired with a hex field.
 *
 * The hex box keeps its own draft so a half-typed value ("#35") never reaches
 * the design state, where it would blank out the swatch and the artwork. Only
 * a parseable hex is published; the draft resyncs whenever the value changes
 * from elsewhere, such as picking a palette.
 */
export function ColorField({ label, value, onChange, className }: ColorFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  const commit = (next: string) => {
    setDraft(next);
    const normalized = normalizeHex(next);
    if (normalized) {
      onChange(normalized);
    }
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className="font-medium text-gray-600 text-xs uppercase tracking-wide dark:text-gray-400"
      >
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          // Pinned to the light color scheme: in dark mode the browser paints
          // the well's chrome dark too, which swallows any dark swatch.
          className="size-8 shrink-0 cursor-pointer rounded-md border border-gray-300 bg-transparent p-0.5 [color-scheme:light] dark:border-gray-600"
        />
        <input
          type="text"
          value={draft}
          spellCheck={false}
          aria-label={`${label} hex value`}
          onChange={(event) => commit(event.target.value)}
          onBlur={() => setDraft(value)}
          className="w-full min-w-0 rounded-md border border-gray-300 bg-white px-2 py-1 font-mono text-gray-900 text-xs uppercase focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>
    </div>
  );
}
