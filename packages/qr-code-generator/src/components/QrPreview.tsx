import { CheckIcon, CopyIcon, DownloadSimpleIcon, QrCodeIcon } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { downloadBlob, serializeSvg, svgToPngBlob, toFilename } from "../lib/download";
import type { QrMatrix } from "../lib/matrix";
import type { Design } from "../types";
import { Button } from "./Button";
import { QrArtwork } from "./QrArtwork";
import { Select } from "./TextInput";

const PNG_SIZES = [512, 1024, 2048];

export interface QrPreviewProps {
  matrix: QrMatrix | null;
  /** Why there is nothing to render, if there is nothing to render. */
  emptyReason: string;
  design: Design;
  /** The encoded string, shown as a readout and used to name downloads. */
  data: string;
}

export function QrPreview({ matrix, emptyReason, design, data }: QrPreviewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pngSize, setPngSize] = useState(1024);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filename = toFilename(design.label.trim() || data);

  const withMarkup = async (run: (markup: string) => Promise<void> | void) => {
    if (!svgRef.current) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await run(serializeSvg(svgRef.current));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Export failed");
    } finally {
      setBusy(false);
    }
  };

  const downloadPng = () =>
    withMarkup(async (markup) => {
      downloadBlob(await svgToPngBlob(markup, pngSize), `${filename}-${pngSize}.png`);
    });

  const downloadSvg = () =>
    withMarkup((markup) => {
      downloadBlob(new Blob([markup], { type: "image/svg+xml" }), `${filename}.svg`);
    });

  const copySvg = () =>
    withMarkup(async (markup) => {
      await navigator.clipboard.writeText(markup);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800">
        {matrix ? (
          <QrArtwork
            ref={svgRef}
            matrix={matrix}
            design={design}
            title={design.label.trim() ? `QR code: ${design.label.trim()}` : "QR code"}
            className="h-auto w-full max-w-[240px] drop-shadow-sm sm:max-w-[320px]"
          />
        ) : (
          <div className="flex aspect-square w-full max-w-[240px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-gray-300 border-dashed p-6 text-center sm:max-w-[320px] dark:border-gray-600">
            <QrCodeIcon size={36} className="text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 text-sm dark:text-gray-400">{emptyReason}</p>
          </div>
        )}
      </div>

      {matrix && (
        <p className="text-center text-gray-400 text-xs dark:text-gray-500">
          Version {matrix.version} · {matrix.size}&#x00d7;{matrix.size} modules ·{" "}
          {design.errorCorrection} error correction
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label="PNG size"
          value={pngSize}
          disabled={!matrix}
          onChange={(event) => setPngSize(Number(event.target.value))}
          className="w-auto"
        >
          {PNG_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} px
            </option>
          ))}
        </Select>
        <Button intent="primary" onClick={downloadPng} disabled={!matrix || busy}>
          <DownloadSimpleIcon size={14} weight="bold" />
          PNG
        </Button>
        <Button onClick={downloadSvg} disabled={!matrix || busy}>
          <DownloadSimpleIcon size={14} weight="bold" />
          SVG
        </Button>
        <Button onClick={copySvg} disabled={!matrix || busy}>
          {copied ? <CheckIcon size={14} weight="bold" /> : <CopyIcon size={14} />}
          {copied ? "Copied" : "Copy SVG"}
        </Button>
      </div>

      {error && <p className="text-red-600 text-xs dark:text-red-400">{error}</p>}

      {data && (
        <details className="text-gray-500 text-xs dark:text-gray-400">
          <summary className="cursor-pointer select-none">Encoded data</summary>
          {/* A div rather than a <pre>, which the site styles as a code block. */}
          <div className="mt-1.5 max-h-32 overflow-auto whitespace-pre-wrap break-all rounded-md bg-gray-100 p-2 font-mono text-[11px] dark:bg-gray-800">
            {data}
          </div>
        </details>
      )}
    </div>
  );
}
