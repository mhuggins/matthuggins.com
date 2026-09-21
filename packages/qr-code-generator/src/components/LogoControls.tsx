import { cn } from "@matthuggins/ui";
import { ProhibitIcon, TrashIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { type ChangeEvent, type ReactNode, useRef } from "react";
import { CUSTOM_LOGO, LOGO_OPTIONS, NO_LOGO } from "../lib/logos";
import { MAX_LOGO_RATIO, MIN_LOGO_RATIO } from "../lib/presets";
import type { Design } from "../types";
import { Button } from "./Button";

/** Upload cap. The image is inlined as a data URL, so it lands in every export. */
const MAX_UPLOAD_BYTES = 512 * 1024;

export interface LogoControlsProps {
  design: Design;
  onChange: (patch: Partial<Design>) => void;
  onUploadError: (message: string | null) => void;
}

export function LogoControls({ design, onChange, onUploadError }: LogoControlsProps) {
  const fileInput = useRef<HTMLInputElement>(null);

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Let the same file be chosen twice in a row.
    event.target.value = "";

    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      onUploadError("That file is not an image.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      onUploadError("Images need to be under 512 KB so the download stays self-contained.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onUploadError(null);
      onChange({ customLogo: String(reader.result), logoId: CUSTOM_LOGO });
    };
    reader.onerror = () => onUploadError("That image could not be read.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        <IconChoice
          label="No icon"
          active={design.logoId === NO_LOGO}
          onClick={() => onChange({ logoId: NO_LOGO })}
        >
          <ProhibitIcon size={18} />
        </IconChoice>

        {LOGO_OPTIONS.map(({ id, label, icon: OptionIcon }) => (
          <IconChoice
            key={id}
            label={label}
            active={design.logoId === id}
            onClick={() => onChange({ logoId: id })}
          >
            <OptionIcon size={18} weight="fill" />
          </IconChoice>
        ))}

        {design.customLogo && (
          <IconChoice
            label="Your image"
            active={design.logoId === CUSTOM_LOGO}
            onClick={() => onChange({ logoId: CUSTOM_LOGO })}
          >
            <img src={design.customLogo} alt="" className="size-5 rounded-sm object-contain" />
          </IconChoice>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
        <Button onClick={() => fileInput.current?.click()}>
          <UploadSimpleIcon size={14} weight="bold" />
          Upload an image
        </Button>
        {design.customLogo && (
          <Button
            intent="ghost"
            onClick={() => {
              onUploadError(null);
              onChange({
                customLogo: null,
                logoId: design.logoId === CUSTOM_LOGO ? NO_LOGO : design.logoId,
              });
            }}
          >
            <TrashIcon size={14} />
            Remove
          </Button>
        )}
      </div>

      {design.logoId !== NO_LOGO && (
        <label className="flex flex-col gap-1.5">
          <span className="font-medium text-gray-600 text-xs uppercase tracking-wide dark:text-gray-400">
            Icon size · {Math.round(design.logoRatio * 100)}%
          </span>
          <input
            type="range"
            min={MIN_LOGO_RATIO * 100}
            max={MAX_LOGO_RATIO * 100}
            step={1}
            value={Math.round(design.logoRatio * 100)}
            onChange={(event) => onChange({ logoRatio: Number(event.target.value) / 100 })}
            className="w-full cursor-pointer accent-primary"
          />
        </label>
      )}
    </div>
  );
}

interface IconChoiceProps {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

function IconChoice({ label, active, onClick, children }: IconChoiceProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex size-9 cursor-pointer items-center justify-center rounded-md ring transition-colors",
        active
          ? "bg-primary text-white ring-primary"
          : "bg-gray-100 text-gray-600 ring-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-700",
      )}
    >
      {children}
    </button>
  );
}
