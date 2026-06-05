import { cn } from "@matthuggins/ui";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { useCallback, useMemo, useState } from "react";
import { VegaEmbed } from "react-vega";
import type { VisualizationSpec } from "vega-embed";
import type { DatasetRow, VegaLiteSpec } from "../types";

interface ChartViewProps {
  spec: VegaLiteSpec;
  rows: DatasetRow[];
  className?: string;
}

/** Renders a Vega-Lite spec on a light surface, injecting its rows inline.
 * The spec schema is intentionally loose, so a structurally-valid but
 * unrenderable spec can still fail in Vega; `onError` catches that (it surfaces
 * asynchronously, not as a render throw) and shows a fallback. */
export function ChartView({ spec, rows, className }: ChartViewProps) {
  const [failed, setFailed] = useState(false);

  const fullSpec = useMemo<VisualizationSpec>(
    () =>
      ({
        ...spec,
        data: { values: rows },
        config: { background: "transparent", view: { stroke: "transparent" } },
      }) as unknown as VisualizationSpec,
    [spec, rows],
  );

  const handleError = useCallback((error: unknown) => {
    console.warn("Vega could not render the chart spec.", error);
    setFailed(true);
  }, []);

  return (
    <div
      className={cn(
        "flex min-h-[360px] items-center justify-center rounded-xl border border-gray-200 bg-white p-4",
        className,
      )}
    >
      {failed ? (
        <div className="flex flex-col items-center gap-2 text-center text-gray-400">
          <WarningCircleIcon className="size-10" weight="duotone" />
          <p className="text-sm">This chart spec could not be rendered.</p>
        </div>
      ) : (
        <VegaEmbed
          spec={fullSpec}
          options={{ actions: false, renderer: "svg" }}
          onError={handleError}
          className="w-full"
        />
      )}
    </div>
  );
}
