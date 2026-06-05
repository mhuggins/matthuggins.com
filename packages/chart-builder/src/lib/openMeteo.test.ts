import { describe, expect, it } from "vitest";
import {
  buildWeatherUrl,
  openMeteoDailyResponseSchema,
  parseWeatherRows,
  weatherColumns,
} from "./openMeteo";

const TODAY = "2026-06-04";

describe("buildWeatherUrl", () => {
  it("maps friendly variables to exact Open-Meteo daily params", () => {
    const { url } = buildWeatherUrl(
      {
        latitude: 35.68,
        longitude: 139.69,
        variables: ["max_temp", "precipitation"],
        range: { mode: "forecast_days", days: 7 },
      },
      TODAY,
    );
    const daily = new URL(url).searchParams.get("daily");
    expect(daily).toBe("temperature_2m_max,precipitation_sum");
  });

  it("routes forecast_days to the forecast endpoint", () => {
    const { endpoint, url } = buildWeatherUrl(
      {
        latitude: 0,
        longitude: 0,
        variables: ["max_temp"],
        range: { mode: "forecast_days", days: 10 },
      },
      TODAY,
    );
    expect(endpoint).toBe("forecast");
    expect(url).toContain("/v1/forecast");
    expect(new URL(url).searchParams.get("forecast_days")).toBe("10");
  });

  it("routes past_days to the forecast endpoint with past_days set", () => {
    const { endpoint, url } = buildWeatherUrl(
      {
        latitude: 0,
        longitude: 0,
        variables: ["max_temp"],
        range: { mode: "past_days", days: 14 },
      },
      TODAY,
    );
    expect(endpoint).toBe("forecast");
    expect(new URL(url).searchParams.get("past_days")).toBe("14");
  });

  it("routes a historical explicit range to the archive endpoint", () => {
    const { endpoint, url } = buildWeatherUrl(
      {
        latitude: 0,
        longitude: 0,
        variables: ["max_temp"],
        range: { mode: "date_range", startDate: "2023-01-01", endDate: "2023-01-31" },
      },
      TODAY,
    );
    expect(endpoint).toBe("archive");
    expect(url).toContain("/v1/archive");
    expect(new URL(url).searchParams.get("start_date")).toBe("2023-01-01");
  });

  it("keeps a future-touching explicit range on the forecast endpoint", () => {
    const { endpoint } = buildWeatherUrl(
      {
        latitude: 0,
        longitude: 0,
        variables: ["max_temp"],
        range: { mode: "date_range", startDate: "2026-06-04", endDate: "2026-06-10" },
      },
      TODAY,
    );
    expect(endpoint).toBe("forecast");
  });
});

describe("parseWeatherRows", () => {
  it("reshapes column-oriented daily arrays into rows keyed by friendly variable", () => {
    const rows = parseWeatherRows(
      {
        daily: {
          time: ["2026-06-01", "2026-06-02"],
          series: {
            temperature_2m_max: [21.5, 23.1],
            precipitation_sum: [0, 4.2],
          },
        },
      },
      ["max_temp", "precipitation"],
    );
    expect(rows).toEqual([
      { date: "2026-06-01", max_temp: 21.5, precipitation: 0 },
      { date: "2026-06-02", max_temp: 23.1, precipitation: 4.2 },
    ]);
  });

  it("fills missing values with null", () => {
    const rows = parseWeatherRows({ daily: { time: ["2026-06-01"], series: {} } }, ["max_temp"]);
    expect(rows).toEqual([{ date: "2026-06-01", max_temp: null }]);
  });
});

describe("openMeteoDailyResponseSchema", () => {
  it("coerces numeric-string series to numbers, preserves nulls, and splits out time", () => {
    const parsed = openMeteoDailyResponseSchema.parse({
      latitude: 35.68,
      daily: {
        time: ["2026-06-01", "2026-06-02"],
        temperature_2m_max: ["21.5", "23.1"],
        precipitation_sum: [0, null],
      },
      daily_units: { temperature_2m_max: "°C" },
    });
    expect(parsed.daily).toEqual({
      time: ["2026-06-01", "2026-06-02"],
      series: {
        temperature_2m_max: [21.5, 23.1],
        precipitation_sum: [0, null],
      },
    });
  });

  it("rejects a payload whose daily.time is not an array of strings", () => {
    expect(() => openMeteoDailyResponseSchema.parse({ daily: { time: [1, 2] } })).toThrow();
  });
});

describe("weatherColumns", () => {
  it("always leads with a temporal date column", () => {
    const cols = weatherColumns(["max_temp"]);
    expect(cols[0]).toEqual({ name: "date", type: "temporal", label: "Date" });
    expect(cols[1]?.type).toBe("quantitative");
  });
});
