import { FRAME_STYLES, LABEL_SUGGESTIONS } from "../lib/presets";
import type { Design } from "../types";
import { ColorField } from "./ColorField";
import { Field } from "./Field";
import { SegmentedControl } from "./SegmentedControl";
import { TextInput } from "./TextInput";

export interface FrameControlsProps {
  design: Design;
  onChange: (patch: Partial<Design>) => void;
}

const CAPTIONED_FRAMES: readonly Design["frame"][] = ["label-below", "label-above", "ticket"];

export function FrameControls({ design, onChange }: FrameControlsProps) {
  const showsCaption = CAPTIONED_FRAMES.includes(design.frame);

  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl
        label="Frame template"
        options={FRAME_STYLES}
        value={design.frame}
        onChange={(frame) => onChange({ frame })}
      />

      {design.frame !== "none" && (
        <ColorField
          label="Frame color"
          value={design.frameColor}
          onChange={(frameColor) => onChange({ frameColor })}
        />
      )}

      {showsCaption && (
        <Field label="Caption">
          {(id) => (
            <>
              <TextInput
                id={id}
                maxLength={28}
                placeholder="SCAN ME"
                value={design.label}
                onChange={(event) => onChange({ label: event.target.value })}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {LABEL_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => onChange({ label: suggestion })}
                    className="cursor-pointer rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] text-gray-600 tracking-wide hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </>
          )}
        </Field>
      )}
    </div>
  );
}
