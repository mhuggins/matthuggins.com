import { keys } from "remeda";
import { z } from "zod";
import type { ColumnInfo, DatasetRow } from "../types";

const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE_ENDPOINT = "https://archive-api.open-meteo.com/v1/archive";
const GEOCODING_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";

/**
 * Friendly weather variables the model is allowed to request. The key is what
 * the model picks (constrained by an enum in the tool schema); the encoder maps
 * it to Open-Meteo's exact daily parameter name. This is the deterministic
 * boundary: the model expresses intent, the code emits perfect API syntax.
 */
export const WEATHER_VARIABLES = {
  max_temp: { param: "temperature_2m_max", label: "Max temperature (°C)" },
  min_temp: { param: "temperature_2m_min", label: "Min temperature (°C)" },
  mean_temp: { param: "temperature_2m_mean", label: "Mean temperature (°C)" },
  apparent_max_temp: {
    param: "apparent_temperature_max",
    label: "Max feels-like temperature (°C)",
  },
  precipitation: { param: "precipitation_sum", label: "Precipitation (mm)" },
  rain: { param: "rain_sum", label: "Rain (mm)" },
  snowfall: { param: "snowfall_sum", label: "Snowfall (cm)" },
  precipitation_hours: { param: "precipitation_hours", label: "Precipitation hours" },
  wind_speed: { param: "wind_speed_10m_max", label: "Max wind speed (km/h)" },
  wind_gusts: { param: "wind_gusts_10m_max", label: "Max wind gusts (km/h)" },
  uv_index: { param: "uv_index_max", label: "Max UV index" },
} as const;

export type WeatherVariable = keyof typeof WEATHER_VARIABLES;

export const WEATHER_VARIABLE_KEYS: WeatherVariable[] = keys(WEATHER_VARIABLES);

export type WeatherEndpoint = "forecast" | "archive";

export type WeatherDateRange =
  | { mode: "past_days"; days: number }
  | { mode: "forecast_days"; days: number }
  | { mode: "date_range"; startDate: string; endDate: string };

export interface WeatherQuery {
  latitude: number;
  longitude: number;
  variables: WeatherVariable[];
  range: WeatherDateRange;
}

export interface GeocodeResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  timezone: string;
}

/** Parse a YYYY-MM-DD string to a UTC day number for comparison. */
function toDayNumber(date: string): number {
  return Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 86_400_000);
}

/**
 * Decide which Open-Meteo endpoint a query needs and build its URL. Pure and
 * deterministic so it can be unit-tested without the network. Historical
 * explicit ranges go to the archive API; recent/relative and future ranges go
 * to the forecast API (which also serves recent past via `past_days`).
 */
export function buildWeatherUrl(
  query: WeatherQuery,
  today: string,
): { endpoint: WeatherEndpoint; url: string } {
  const daily = query.variables.map((v) => WEATHER_VARIABLES[v].param).join(",");
  const params = new URLSearchParams();

  params.set("latitude", String(query.latitude));
  params.set("longitude", String(query.longitude));
  params.set("daily", daily);
  params.set("timezone", "auto");

  const { range } = query;

  if (range.mode === "forecast_days") {
    params.set("forecast_days", String(range.days));
    return { endpoint: "forecast", url: `${FORECAST_ENDPOINT}?${params.toString()}` };
  }

  if (range.mode === "past_days") {
    params.set("past_days", String(range.days));
    params.set("forecast_days", "1");
    return { endpoint: "forecast", url: `${FORECAST_ENDPOINT}?${params.toString()}` };
  }

  // date_range: archive when the whole range is in the past, otherwise forecast.
  params.set("start_date", range.startDate);
  params.set("end_date", range.endDate);

  const isHistorical = toDayNumber(range.endDate) < toDayNumber(today);
  const endpoint = isHistorical ? "archive" : "forecast";
  const base = isHistorical ? ARCHIVE_ENDPOINT : FORECAST_ENDPOINT;

  return { endpoint, url: `${base}?${params.toString()}` };
}

/** Build the column descriptors for a fetched weather dataset. */
export function weatherColumns(variables: WeatherVariable[]): ColumnInfo[] {
  return [
    { name: "date", type: "temporal", label: "Date" },
    ...variables.map(
      (v): ColumnInfo => ({ name: v, type: "quantitative", label: WEATHER_VARIABLES[v].label }),
    ),
  ];
}

/**
 * Shape of Open-Meteo's daily response, validated with zod at the fetch boundary
 * so a malformed or unexpected payload fails loudly instead of being trusted via
 * a blind cast. The daily series are keyed dynamically by Open-Meteo's parameter
 * names: `time` is declared explicitly (strings) and every other key is a series
 * of primitives. Unknown top-level fields (units, metadata) are stripped.
 *
 * The transform normalizes the dynamic series: it splits `time` out and coerces
 * each remaining series to `(number | null)[]` (Open-Meteo occasionally returns
 * numeric values as strings). Keeping the input union string-inclusive lets the
 * declared `time` key stay compatible with the catchall, and emitting a separate
 * `series` record gives consumers clean numbers with no cast at read time.
 */
export const openMeteoDailyResponseSchema = z.object({
  daily: z
    .object({ time: z.array(z.string()) })
    .catchall(z.array(z.union([z.string(), z.number(), z.null()])))
    .transform(({ time, ...rest }) => {
      const series: Record<string, (number | null)[]> = {};
      for (const [key, values] of Object.entries(rest)) {
        series[key] = values.map((value) => (value === null ? null : Number(value)));
      }
      return { time, series };
    })
    .optional(),
  error: z.boolean().optional(),
  reason: z.string().optional(),
});

type OpenMeteoDailyResponse = z.infer<typeof openMeteoDailyResponseSchema>;

/** Reshape Open-Meteo's column-oriented `daily` arrays into row objects. */
export function parseWeatherRows(
  data: OpenMeteoDailyResponse,
  variables: WeatherVariable[],
): DatasetRow[] {
  const times = data.daily?.time ?? [];
  return times.map((time, i) => {
    const row: DatasetRow = { date: time };
    for (const v of variables) {
      const series = data.daily?.series[WEATHER_VARIABLES[v].param];
      row[v] = series?.[i] ?? null;
    }
    return row;
  });
}

/**
 * Shape of Open-Meteo's geocoding response, validated with zod at the fetch
 * boundary so a malformed payload fails loudly instead of being trusted via a
 * blind cast. Unknown fields (e.g. admin regions, population) are stripped.
 */
const geocodingResponseSchema = z.object({
  results: z
    .array(
      z.object({
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        country: z.string().optional(),
        timezone: z.string().optional(),
      }),
    )
    .optional(),
});

/** Look up a place name and return its coordinates. */
export async function geocode(query: string): Promise<GeocodeResult> {
  const params = new URLSearchParams({ name: query, count: "1", language: "en", format: "json" });
  const res = await fetch(`${GEOCODING_ENDPOINT}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Geocoding failed (${res.status}).`);
  }
  const data = geocodingResponseSchema.parse(await res.json());
  const first = data.results?.[0];
  if (!first) {
    throw new Error(`No location found for "${query}".`);
  }
  return {
    name: first.name,
    latitude: first.latitude,
    longitude: first.longitude,
    country: first.country ?? "",
    timezone: first.timezone ?? "auto",
  };
}

/** Fetch and reshape daily weather for a query. */
export async function fetchWeather(
  query: WeatherQuery,
  today: string,
): Promise<{ endpoint: WeatherEndpoint; rows: DatasetRow[]; columns: ColumnInfo[] }> {
  const { endpoint, url } = buildWeatherUrl(query, today);
  const res = await fetch(url);
  // Tolerate a non-JSON body (e.g. a proxy/500 HTML page) so the status check
  // below can surface a friendly message instead of a raw JSON/zod parse throw.
  const data = openMeteoDailyResponseSchema.parse(await res.json().catch(() => ({})));
  if (!res.ok || data.error) {
    throw new Error(data.reason ?? `Weather request failed (${res.status}).`);
  }
  return {
    endpoint,
    rows: parseWeatherRows(data, query.variables),
    columns: weatherColumns(query.variables),
  };
}
