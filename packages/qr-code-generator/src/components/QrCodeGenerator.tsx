import { cn } from "@matthuggins/ui";
import {
  FrameCornersIcon,
  ImageIcon,
  PaletteIcon,
  SlidersHorizontalIcon,
  TextTIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { type HTMLAttributes, useMemo, useState } from "react";
import { contrastRatio, MIN_SCAN_CONTRAST } from "../lib/color";
import { NO_LOGO } from "../lib/logos";
import { createMatrix, type QrMatrix } from "../lib/matrix";
import { buildPayload } from "../lib/payload";
import { DEFAULT_DESIGN, DEFAULT_PAYLOADS, PAYLOAD_KINDS } from "../lib/presets";
import type { Design, ErrorCorrection, Payload, PayloadKind, PayloadMap } from "../types";
import { DesignControls } from "./DesignControls";
import { Field } from "./Field";
import { FrameControls } from "./FrameControls";
import { LogoControls } from "./LogoControls";
import { Panel } from "./Panel";
import { PayloadForm } from "./PayloadForm";
import { QrPreview } from "./QrPreview";
import { SegmentedControl } from "./SegmentedControl";
import { Select } from "./TextInput";

const ERROR_CORRECTION_LABELS: Record<ErrorCorrection, string> = {
  L: "Low · recovers ~7%",
  M: "Medium · recovers ~15%",
  Q: "Quartile · recovers ~25%",
  H: "High · recovers ~30%",
};

/** The share of the symbol above which a center icon starts eating real data. */
const LOGO_RATIO_WARNING = 0.24;

/** Either a symbol to draw, a reason it could not be built, or neither yet. */
interface MatrixResult {
  matrix: QrMatrix | null;
  error: string | null;
}

export type QrCodeGeneratorProps = HTMLAttributes<HTMLDivElement>;

export function QrCodeGenerator({ className, ...props }: QrCodeGeneratorProps) {
  const [kind, setKind] = useState<PayloadKind>("url");
  const [payloads, setPayloads] = useState<PayloadMap>(DEFAULT_PAYLOADS);
  const [design, setDesign] = useState<Design>(DEFAULT_DESIGN);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const payload = payloads[kind];
  const data = buildPayload(payload);

  const { matrix, error } = useMemo<MatrixResult>(() => {
    if (!data) {
      return { matrix: null, error: null };
    }
    try {
      return { matrix: createMatrix(data, design.errorCorrection), error: null };
    } catch (cause) {
      return {
        matrix: null,
        error:
          cause instanceof Error && /too (long|big)/i.test(cause.message)
            ? "That is more data than a QR code can hold. Shorten it, or drop the error correction level."
            : "That content could not be encoded.",
      };
    }
  }, [data, design.errorCorrection]);

  const updateDesign = (patch: Partial<Design>) =>
    setDesign((current) => ({ ...current, ...patch }));

  const updatePayload = (next: Payload) =>
    setPayloads((current) => ({ ...current, [next.kind]: next }));

  const handleLogoChange = (patch: Partial<Design>) => {
    const addingLogo = patch.logoId !== undefined && patch.logoId !== NO_LOGO;
    // A center icon covers data modules, so raise the redundancy to cover it.
    const bumpCorrection =
      addingLogo && (design.errorCorrection === "L" || design.errorCorrection === "M");

    updateDesign(bumpCorrection ? { ...patch, errorCorrection: "H" } : patch);
  };

  const warnings = collectWarnings(design);

  return (
    <div className={cn("not-prose flex flex-col gap-6", className)} {...props}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <div className="flex flex-col gap-4 lg:order-2">
          <div className="lg:sticky lg:top-6">
            <QrPreview
              matrix={matrix}
              emptyReason={error ?? "Fill in the content to generate a code."}
              design={design}
              data={data}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:order-1">
          <Panel title="Content" icon={TextTIcon}>
            <SegmentedControl
              label="Content type"
              options={PAYLOAD_KINDS}
              value={kind}
              onChange={setKind}
            />
            <PayloadForm payload={payload} onChange={updatePayload} />
          </Panel>

          <Panel title="Colors & shapes" icon={PaletteIcon}>
            <DesignControls design={design} onChange={updateDesign} />
          </Panel>

          <Panel title="Center icon" icon={ImageIcon}>
            <LogoControls
              design={design}
              onChange={handleLogoChange}
              onUploadError={setUploadError}
            />
            {uploadError && <p className="text-red-600 text-xs dark:text-red-400">{uploadError}</p>}
          </Panel>

          <Panel title="Frame" icon={FrameCornersIcon}>
            <FrameControls design={design} onChange={updateDesign} />
          </Panel>

          <Panel title="Encoding" icon={SlidersHorizontalIcon}>
            <Field
              label="Error correction"
              hint="Higher levels survive damage and center icons, but need a denser code."
            >
              {(id) => (
                <Select
                  id={id}
                  value={design.errorCorrection}
                  onChange={(event) =>
                    updateDesign({ errorCorrection: event.target.value as ErrorCorrection })
                  }
                >
                  {(Object.keys(ERROR_CORRECTION_LABELS) as ErrorCorrection[]).map((level) => (
                    <option key={level} value={level}>
                      {ERROR_CORRECTION_LABELS[level]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </Panel>

          {warnings.length > 0 && (
            <ul className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900 text-xs dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
              {warnings.map((warning) => (
                <li key={warning} className="flex items-start gap-2">
                  <WarningIcon size={14} weight="fill" className="mt-0.5 shrink-0" />
                  {warning}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Scannability checks. These are advisory rather than blocking: a code that
 * trips one of them may still read fine on a good camera, so the visitor gets
 * the caveat and keeps the choice.
 */
function collectWarnings(design: Design): string[] {
  const warnings: string[] = [];

  if (contrastRatio(design.foreground, design.background) < MIN_SCAN_CONTRAST) {
    warnings.push(
      "The modules and background are too close in tone for most scanners. Try a darker foreground or a lighter background.",
    );
  }

  if (design.logoId !== NO_LOGO && design.logoRatio > LOGO_RATIO_WARNING) {
    warnings.push(
      "This icon covers a lot of the code. Keep error correction on High and test the result before printing it.",
    );
  }

  if (design.logoId !== NO_LOGO && design.errorCorrection !== "H") {
    warnings.push("Center icons are most reliable with High error correction.");
  }

  return warnings;
}
