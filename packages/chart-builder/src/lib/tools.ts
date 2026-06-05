import { tool } from "ai";
import { z } from "zod";
import { AGGREGATE_OPS, buildChartSpec, MARK_TYPES } from "./buildChartSpec";
import type { DataStore } from "./dataStore";
import { fetchWeather, geocode, WEATHER_VARIABLE_KEYS, type WeatherDateRange } from "./openMeteo";

export interface ToolContext {
  store: DataStore;
  /** Today's date as YYYY-MM-DD, used to route forecast vs. archive. */
  today: string;
}

/**
 * Schema for the buildChartSpec tool's result. Tools return their raw output;
 * these schemas validate it at the boundary where the result is received (see
 * agent.ts), the way you would validate a response from a remote service. The
 * `spec` is kept loose because the encoder owns its exact shape; the chart's
 * rows are resolved from the data store via `dataRef` and never reach the model.
 */
export const chartToolOutputSchema = z.object({
  dataRef: z.string(),
  mark: z.enum(MARK_TYPES),
  spec: z.record(z.string(), z.unknown()),
});

export type ChartToolOutput = z.infer<typeof chartToolOutputSchema>;

/** Schema for the geocodeLocation tool's result. */
export const geocodeToolOutputSchema = z.object({
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  country: z.string(),
  timezone: z.string(),
});

export type GeocodeToolOutput = z.infer<typeof geocodeToolOutputSchema>;

const columnSchema = z.object({
  name: z.string(),
  type: z.enum(["quantitative", "temporal", "nominal", "ordinal"]),
  label: z.string(),
});

/** Schema for the getWeather tool's result. */
export const weatherToolOutputSchema = z.object({
  dataRef: z.string(),
  endpoint: z.enum(["forecast", "archive"]),
  rowCount: z.number(),
  columns: z.array(columnSchema),
  sample: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.null()]))),
});

export type WeatherToolOutput = z.infer<typeof weatherToolOutputSchema>;

const fieldEncoding = z.object({
  field: z.string().describe("A column name from the dataset returned by getWeather."),
  type: z
    .enum(["quantitative", "temporal", "nominal", "ordinal"])
    .optional()
    .describe("Vega-Lite field type. Usually omit it; it is inferred from the column."),
});

const quantEncoding = fieldEncoding.extend({
  aggregate: z
    .enum(AGGREGATE_OPS)
    .optional()
    .describe("Optional aggregation across rows, e.g. 'mean' or 'sum'."),
});

const dateRangeSchema = z
  .object({
    mode: z
      .enum(["past_days", "forecast_days", "date_range"])
      .describe(
        "How to choose dates: 'past_days' for recent history, 'forecast_days' for the future, " +
          "'date_range' for an explicit historical window.",
      ),
    days: z
      .number()
      .int()
      .min(1)
      .max(92)
      .optional()
      .describe("Number of days for past_days or forecast_days mode (1-92)."),
    startDate: z
      .string()
      .optional()
      .describe("Start date (YYYY-MM-DD); required for date_range mode."),
    endDate: z.string().optional().describe("End date (YYYY-MM-DD); required for date_range mode."),
  })
  .describe("The time window to fetch.");

function normalizeRange(input: z.infer<typeof dateRangeSchema>): WeatherDateRange {
  if (input.mode === "date_range") {
    if (!input.startDate || !input.endDate) {
      throw new Error("date_range mode requires both startDate and endDate (YYYY-MM-DD).");
    }
    return { mode: "date_range", startDate: input.startDate, endDate: input.endDate };
  }
  return { mode: input.mode, days: input.days ?? 7 };
}

/**
 * Build the request-scoped tool set. Each tool's execute is a closure over the
 * shared context (data store and today's date), mirroring the per-request tool
 * factory pattern from the blog post.
 */
export function buildTools(ctx: ToolContext) {
  return {
    geocodeLocation: tool({
      description:
        "Look up the coordinates of a place by name. Call this before getWeather; " +
        "the model must not invent latitude/longitude.",
      inputSchema: z.object({
        query: z.string().describe("A place name, e.g. 'Tokyo' or 'Seattle, WA'."),
      }),
      outputSchema: geocodeToolOutputSchema,
      execute: async ({ query }) => geocode(query),
    }),

    getWeather: tool({
      description:
        "Fetch daily weather data for a set of coordinates. Returns an opaque dataRef plus the " +
        "columns and a small sample; pass the dataRef to buildChartSpec to draw it.",
      inputSchema: z.object({
        latitude: z.number().describe("Latitude from geocodeLocation."),
        longitude: z.number().describe("Longitude from geocodeLocation."),
        variables: z
          .array(z.enum(WEATHER_VARIABLE_KEYS))
          .min(1)
          .describe("One or more weather variables to fetch."),
        range: dateRangeSchema,
      }),
      outputSchema: weatherToolOutputSchema,
      execute: async ({ latitude, longitude, variables, range }) => {
        const { endpoint, rows, columns } = await fetchWeather(
          { latitude, longitude, variables, range: normalizeRange(range) },
          ctx.today,
        );
        const dataset = ctx.store.put(columns, rows);
        return {
          dataRef: dataset.ref,
          endpoint,
          rowCount: rows.length,
          columns,
          sample: rows.slice(0, 3),
        };
      },
    }),

    buildChartSpec: tool({
      description:
        "Render a chart from data already fetched by getWeather. Provide the dataRef and how to " +
        "encode the columns. Produces a valid Vega-Lite chart.",
      inputSchema: z.object({
        dataRef: z
          .string()
          .describe(
            "The opaque dataRef returned by getWeather. Forward it verbatim; never construct it yourself.",
          ),
        mark: z.enum(MARK_TYPES).describe("Chart type. Use 'arc' for pie/donut charts."),
        title: z.string().optional().describe("Optional chart title."),
        encodings: z
          .object({
            x: fieldEncoding.optional().describe("Field for the x-axis (often 'date')."),
            y: quantEncoding.optional().describe("Field for the y-axis (a measured value)."),
            color: fieldEncoding.optional().describe("Field to split/color series by."),
          })
          .describe("How columns map to chart channels."),
        sort: z
          .enum(["ascending", "descending"])
          .optional()
          .describe("Optional sort for the x-axis."),
      }),
      outputSchema: chartToolOutputSchema,
      execute: async ({ dataRef, mark, title, encodings, sort }) => {
        const dataset = ctx.store.get(dataRef);
        if (!dataset) {
          throw new Error(
            `Unknown dataRef "${dataRef}". Call getWeather first and pass the dataRef it returns.`,
          );
        }
        const spec = buildChartSpec({ mark, title, encodings, sort }, dataset.columns);
        return { dataRef, mark, spec };
      },
    }),
  };
}

export type ChartBuilderTools = ReturnType<typeof buildTools>;
