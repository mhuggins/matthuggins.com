import type { ColumnInfo, FieldType, VegaLiteSpec } from "../types";

export const MARK_TYPES = ["bar", "line", "area", "point", "arc"] as const;
export type MarkType = (typeof MARK_TYPES)[number];

export const AGGREGATE_OPS = ["sum", "mean", "median", "min", "max", "count"] as const;
export type AggregateOp = (typeof AGGREGATE_OPS)[number];

export interface FieldEncoding {
  field: string;
  type?: FieldType;
}

export interface QuantitativeEncoding extends FieldEncoding {
  aggregate?: AggregateOp;
}

export interface ChartEncodingInput {
  mark: MarkType;
  title?: string;
  encodings: {
    x?: FieldEncoding;
    y?: QuantitativeEncoding;
    color?: FieldEncoding;
  };
  sort?: "ascending" | "descending";
}

/** Resolve a field's Vega-Lite type from explicit input, then column metadata. */
function resolveType(
  encoding: FieldEncoding | undefined,
  columns: ColumnInfo[],
  fallback: FieldType,
): FieldType {
  if (!encoding) {
    return fallback;
  }
  if (encoding.type) {
    return encoding.type;
  }
  return columns.find((c) => c.name === encoding.field)?.type ?? fallback;
}

/**
 * Deterministically turn structured chart intent into a valid Vega-Lite spec.
 * The model can only express choices the schema permits (mark from an enum,
 * fields by name, aggregate from an enum), and this function owns the grammar,
 * so the emitted spec is always well-formed. Data rows are intentionally NOT
 * inlined here; the caller injects them from the data store at render time so
 * the rows never re-enter the model's context.
 */
export function buildChartSpec(input: ChartEncodingInput, columns: ColumnInfo[]): VegaLiteSpec {
  const { mark, encodings, sort, title } = input;
  const encoding: Record<string, unknown> = {};

  if (mark === "arc") {
    // Pie/donut: angle by the quantitative field, slices colored by a category.
    if (encodings.y) {
      encoding.theta = {
        field: encodings.y.field,
        type: resolveType(encodings.y, columns, "quantitative"),
        ...(encodings.y.aggregate ? { aggregate: encodings.y.aggregate } : {}),
      };
    }
    const category = encodings.color ?? encodings.x;
    if (category) {
      encoding.color = { field: category.field, type: resolveType(category, columns, "nominal") };
    }
  } else {
    if (encodings.x) {
      encoding.x = {
        field: encodings.x.field,
        type: resolveType(encodings.x, columns, "nominal"),
        ...(sort ? { sort } : {}),
      };
    }
    if (encodings.y) {
      encoding.y = {
        field: encodings.y.field,
        type: resolveType(encodings.y, columns, "quantitative"),
        ...(encodings.y.aggregate ? { aggregate: encodings.y.aggregate } : {}),
      };
    }
    if (encodings.color) {
      encoding.color = {
        field: encodings.color.field,
        type: resolveType(encodings.color, columns, "nominal"),
      };
    }
  }

  return {
    $schema: "https://vega.github.io/schema/vega-lite/v6.json",
    ...(title ? { title } : {}),
    mark: mark === "point" ? { type: "point", filled: true } : mark,
    encoding,
    width: "container",
    height: 320,
  };
}
