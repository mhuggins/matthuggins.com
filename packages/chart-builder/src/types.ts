import type { ChartToolOutput, GeocodeToolOutput, WeatherToolOutput } from "./lib/tools";

/** Vega-Lite spec. Kept loose on purpose so the encoder owns the shape. */
export type VegaLiteSpec = Record<string, unknown>;

/** Vega-Lite field types the model is allowed to choose from. */
export type FieldType = "quantitative" | "temporal" | "nominal" | "ordinal";

/** A single value in a fetched dataset row. */
export type CellValue = string | number | null;

/** One row of fetched data, keyed by column name. */
export type DatasetRow = Record<string, CellValue>;

/** Describes a column the model can reference when building a chart. */
export interface ColumnInfo {
  name: string;
  type: FieldType;
  /** Short human label, e.g. "Max temperature (°C)". */
  label: string;
}

/** Whether a tool call is still running, succeeded, or threw. */
export type ToolStatus = "running" | "success" | "error";

/**
 * One entry in the chat thread. Text and tool activity are interleaved in the
 * order they occur so the whole turn reads top-to-bottom in a single column.
 */
export type ThreadItem =
  | { kind: "user"; id: string; text: string }
  | { kind: "text"; id: string; text: string }
  | {
      kind: "tool";
      id: string;
      toolCallId: string;
      toolName: string;
      input: unknown;
      status: ToolStatus;
      output?: unknown;
      error?: string;
    }
  | { kind: "chart"; id: string; spec: VegaLiteSpec; rows: DatasetRow[] };

/** Convenience alias for the tool variant of a thread item. */
export type ToolThreadItem = Extract<ThreadItem, { kind: "tool" }>;

/**
 * A successful tool result, discriminated by tool name so each carries its own
 * validated output type. The AI SDK's tool `outputSchema` is types-only at
 * runtime, so the agent validates each tool's raw output at the boundary (see
 * `toToolResultEvent` in agent.ts); consumers of this event can then rely on
 * these types without re-parsing.
 */
export type ToolResultEvent =
  | {
      type: "tool-result";
      toolCallId: string;
      toolName: "geocodeLocation";
      output: GeocodeToolOutput;
    }
  | { type: "tool-result"; toolCallId: string; toolName: "getWeather"; output: WeatherToolOutput }
  | {
      type: "tool-result";
      toolCallId: string;
      toolName: "buildChartSpec";
      output: ChartToolOutput;
    };

/** Events emitted while the agent runs, consumed by the UI. */
export type AgentEvent =
  | { type: "text-delta"; text: string }
  | { type: "tool-call"; toolCallId: string; toolName: string; input: unknown }
  | ToolResultEvent
  | { type: "tool-error"; toolCallId: string; toolName: string; error: string }
  | { type: "error"; message: string };
