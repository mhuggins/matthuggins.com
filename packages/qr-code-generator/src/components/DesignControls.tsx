import { cn } from "@matthuggins/ui";
import { EYE_STYLES, MODULE_STYLES, PALETTES, type Palette } from "../lib/presets";
import type { Design } from "../types";
import { ColorField } from "./ColorField";
import { SegmentedControl } from "./SegmentedControl";

export interface DesignControlsProps {
  design: Design;
  onChange: (patch: Partial<Design>) => void;
}

export function DesignControls({ design, onChange }: DesignControlsProps) {
  const eyeColor = design.eyeColor ?? design.foreground;

  const applyPalette = (palette: Palette) =>
    onChange({
      foreground: palette.foreground,
      background: palette.background,
      eyeColor: palette.eyeColor,
      frameColor: palette.frameColor,
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="font-medium text-gray-600 text-xs uppercase tracking-wide dark:text-gray-400">
          Palette
        </span>
        <div className="flex flex-wrap gap-2">
          {PALETTES.map((palette) => (
            <button
              key={palette.id}
              type="button"
              title={palette.label}
              aria-label={`${palette.label} palette`}
              onClick={() => applyPalette(palette)}
              className={cn(
                "flex size-9 cursor-pointer items-center justify-center rounded-md border transition-transform hover:scale-105",
                isPaletteActive(design, palette)
                  ? "border-primary ring-2 ring-primary/40"
                  : "border-gray-300 dark:border-gray-600",
              )}
              style={{ backgroundColor: palette.background }}
            >
              <span className="size-4 rounded-sm" style={{ backgroundColor: palette.foreground }} />
              <span
                className="-ml-1 size-2.5 rounded-full"
                style={{ backgroundColor: palette.eyeColor }}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ColorField
          label="Modules"
          value={design.foreground}
          onChange={(foreground) => onChange({ foreground })}
        />
        <ColorField
          label="Background"
          value={design.background}
          onChange={(background) => onChange({ background })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <ColorField
          label="Finder eyes"
          value={eyeColor}
          onChange={(color) => onChange({ eyeColor: color })}
        />
        <label className="flex cursor-pointer items-center gap-2 text-gray-600 text-sm dark:text-gray-300">
          <input
            type="checkbox"
            checked={design.eyeColor === null}
            onChange={(event) =>
              onChange({ eyeColor: event.target.checked ? null : design.foreground })
            }
            className="size-4 cursor-pointer accent-primary"
          />
          Match the module color
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="font-medium text-gray-600 text-xs uppercase tracking-wide dark:text-gray-400">
          Module shape
        </span>
        <SegmentedControl
          label="Module shape"
          options={MODULE_STYLES}
          value={design.moduleStyle}
          onChange={(moduleStyle) => onChange({ moduleStyle })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="font-medium text-gray-600 text-xs uppercase tracking-wide dark:text-gray-400">
          Finder shape
        </span>
        <SegmentedControl
          label="Finder shape"
          options={EYE_STYLES}
          value={design.eyeStyle}
          onChange={(eyeStyle) => onChange({ eyeStyle })}
        />
      </div>
    </div>
  );
}

function isPaletteActive(design: Design, palette: Palette): boolean {
  return (
    design.foreground === palette.foreground &&
    design.background === palette.background &&
    (design.eyeColor ?? design.foreground) === palette.eyeColor &&
    design.frameColor === palette.frameColor
  );
}
