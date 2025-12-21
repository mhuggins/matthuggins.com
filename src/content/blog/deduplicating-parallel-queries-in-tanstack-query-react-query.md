---
title: Deduplicating Parallel Queries in TanStack Query (React Query)
date: 2025-12-21
published: false
tags: [react, typescript, react-query, tanstack query, data fetching]
summary: When building time series charts that display percentages, you often need to fetch both numerator and denominator values for each data series. But what happens when multiple series share the same denominator? Here's how I used TanStack Query's `hashKey` function to deduplicate overlapping queries and map the results back to the original data structure.
---

During a recent project related to visualizing data over time, I needed to make a separate request for each data set that was to appear as a series in the generated line chart. This straightforward feature became a little bit more complex as soon as I was tasked with displaying the data for any given point in time as not just a pure numeric piece of data, but also as a percentage based upon a relative denominator.

Because calculating these percentages would require two pieces of data per series, and because it's possible for multiple series to share the same denominator, some extra thought needed to be put into how to approach solving this problem. Naively, this could mean fetching 10 queries when only 7 are unique. Making these extra requests would not only be wasteful, but also had the potential to cause subtle issues with TanStack Query's (a.k.a.: React Query's) cache.

## The Problem

Consider a chart tracking regional sales over time. Each column represents a different geographic level:

- Los Angeles _(city)_
- San Francisco _(city)_
- California _(state)_
- Texas _(state)_
- West Coast _(region)_

This data is represented in our system hierarchically:

```
├── United States
│   ├── West Coast
│   │   └── California
│   │       ├── Los Angeles
│   │       └── San Francisco
│   ├── South
│   │   └── Texas
│   └── ...other regions...
└── ...other countries...
```

To show these as percentages of their parent geography, each column needs two values:

| Numerator    | Denominator   |
|--------------|---------------|
| City sales   | State sales   |
| State sales  | Region sales  |
| Region sales | Country sales |

Notice that Los Angeles and San Francisco share the same denominator: California's total sales. If we fetch both denominators separately, we're making duplicate requests. With more locations, this duplication compounds.

Beyond wasted bandwidth, duplicate requests that resolve to the same `queryKey` when calling `useQueries` can result in unexpected behavior with TanStack Query's caching. (They even give you a console warning if this happens!) If two identical queries are running simultaneously, they might not share cache entries the way you'd expect.

## Deriving Denominators by Removing Specificity

Based upon our hierarchical data, the denominator for any given scope is "one level up" in specificity. A city-level numerator needs a state-level denominator. A state-level numerator needs a region-level denominator.

In practice, we can implement this by creating a set of types with increasing specificity. Determining the denominator simply requires removing the most detailed level of geographical specificity:

```typescript
import { omit } from "remeda";

type CountryScope = { country: string };
type RegionScope = CountryScope & { region: string };
type StateScope = RegionScope & { state: string };
type CityScope = StateScope & { city: string };

type GeographicScope = CountryScope | RegionScope | StateScope | CityScope;

function getDenominatorScope(scope: GeographicScope): GeographicScope {
  // Step up one level in specificity
  if ("city" in scope) {
    return omit(scope, ["city"]);
  }
  if ("state" in scope) {
    return omit(scope, ["state"]);
  }
  if ("region" in scope) {
    return omit(scope, ["region"]);
  }

  // If already at country level, denominator is country-wide as well
  return scope;
}
```

## Building the Query Map

With the denominator logic in place, we can build a map of all needed queries, including both our numerators and denominators:

```typescript
import { startOfDay, startOfHour, subDays } from "date-fns";

// Deterministic function for generating a string key based upon a geographic scope
function buildScopeKey(scope: GeographicScope): string {
  return Object.entries(scope)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

// Build the options necessary to call TanStack Query's `useQuery` or `useQueries` hook
function buildTimeSeriesQuery({
  startDate,
  endDate,
  scope,
}: {
  startDate: Date;
  endDate: Date;
  scope: GeographicScope;
}) {
  return {
    queryKey: [startDate, endDate, scope],
    queryFn: () => service.historicSales({ startDate, endDate, scope }),
  };
}

// React hook for building our queries & fetching the necessary sales data
export function useSalesData(scopes: GeographicScope[], daysAgo = 7) {
  const endDate = startOfHour(new Date());
  const startDate = subDays(startOfDay(endDate), daysAgo);

  const scopeQueries: Record<string, QueryOptions> = {};

  // Helper function for adding queries, mapping to a deterministically generated scope key
  const addQuery = (scope: GeographicScope) => {
    const scopeKey = buildScopeKey(scope);
    scopeQueries[scopeKey] = buildTimeSeriesQuery({ startDate, endDate, scope });
  };

  // Build numerator & denominator queries for each geographic scope
  scopes.forEach((scope) => {
    addQuery(scope);
    addQuery(getDenominatorScope(scope));
  });

  // Deduplication comes next...
}
```

At this point, `scopeQueries` is an object mapping scope keys -- along with their denominator counterparts -- to query configurations. If we have 5 scopes, we now have 10 entries, with some of those queries potentially being duplicates.

## Deduplication via `hashKey`

TanStack Query exports a `hashKey` function that serializes a query key into a stable string. Two queries with the same parameters will produce the same hash. This is exactly what we need for finding and removing duplicate queries:

```typescript
import { hashKey, useQueries } from "@tanstack/react-query";
import { uniqueBy } from "remeda";

// Deduplicate queries by their serialized key
const uniqueQueries = uniqueBy(
  Object.values(scopeQueries),
  (query) => hashKey(query.queryKey)
);
```

The `uniqueBy` function keeps the first occurrence of each unique hash, discarding duplicates. If two geographical locations share the same denominator query, we only fetch it once.

## Mapping Results Back with `combine`

After deduplication, the `uniqueQueries` array no longer matches our original `scopeQueries` structure. If we had 10 scope entries but only 7 unique queries, the results array will have 7 items, meaning we need to map each result back to all 10 geographic scopes.

TanStack Query's `useQueries` hook accepts a `combine` function for exactly this purpose:

```typescript
return useQueries({
  queries: uniqueQueries,
  combine: (results) => ({
    isLoading: results.some((result) => result.isPending),
    data: Object.fromEntries(
      Object.entries(scopeQueries).map(([scopeKey, query]) => {
        // Find the result that matches this query's hash
        const queryKey = hashKey(query.queryKey);
        const resultIndex = uniqueQueries.findIndex(
          (q) => hashKey(q.queryKey) === queryKey
        );
        return [scopeKey, results[resultIndex]?.data];
      })
    ),
  }),
});
```

The `combine` function receives the array of query results and returns whatever shape we need. For each entry in our original `scopeQueries` map, we:

1. Compute the hash of that query's key,
2. Find the index of the matching query in `uniqueQueries`, and
3. Return the data from that index.

This way, duplicate queries share the same result. Both Los Angeles and San Francisco will reference California's sales data as their denominator, which is fetched only once.

## Aggregating for Chart Consumption

With the data fetched and mapped, the final step is aggregating it into a format suitable for charting. Using a `Map` for date-based grouping should be efficient enough for our needs:

```typescript
// A data value at a single point in time as represented by the API
interface TimeSeriesEntry {
  date: string; // YYYY-MM-DD format
  value: number;
}

// A simple mapping for storing key/value pairs
type ValueMap = Record<string, number>;

// The format we're converting to: a date with two value mappings
// 1. geographical scope key -> raw value
// 2. geographical scope key -> percentage value
interface ChartDataPoint {
  date: string; // YYYY-MM-DD format
  values: ValueMap;
  percentages: ValueMap;
}

export function aggregateSalesData({
  data,
  labelMap,
}: {
  data: Record<string, TimeSeriesEntry[]>;
  labelMap: Map<string, string>;
}): ChartDataPoint[] {
  // Aggregate values by date
  const mapping = Object.entries(data).reduce(
    (acc, [scopeKey, entries]) => {
      entries?.forEach((entry) => {
        const val = acc.get(entry.date) ?? {};
        val[scopeKey] = (val[scopeKey] ?? 0) + entry.value;
        acc.set(entry.date, val);
      });
      return acc;
    },
    new Map<string, ValueMap>(),
  );

  // Transform to chart data points with percentages
  return [...mapping.entries()].map(([date, dataPoint]) => {
    return Object.entries(dataPoint).reduce(
      (acc: ChartDataPoint, [scopeKey, numerator]) => {
        // Exclude denominator scopes from the final output,
        // as they're only used for percentage calculation
        if (isDenominatorKey(scopeKey)) {
          return acc;
        }

        const label = labelMap.get(scopeKey) ?? scopeKey;
        const denominator = dataPoint[getDenominatorKey(scopeKey)];

        acc.values[label] = numerator;

        // Calculate the percentage while avoiding division by zero
        acc.percentages[label] = denominator === 0
          ? 0
          : numerator / denominator;

        return acc;
      },
      { date, values: {}, percentages: {} }
    );
  });
}

function isDenominatorKey(key: string): boolean {
  // Domain-specific implementation
}

function getGeographicScopeFromKey(key: string): GeographicScope {
  // Inverse of `buildScopeKey`
}

// Get the denominator scope key for a given numerator scope key
function getDenominatorKey(key: string): string {
  const scope = getGeographicScopeFromKey(key);
  const denominatorScope = getDenominatorScope(scope);
  return buildScopeKey(denominatorScope);
}
```

## When to Use This Pattern

This approach works well when:

1. **You have parallel queries with potential overlap.** If you're fetching data for multiple related entities, some queries might be identical.

2. **Query keys are serializable and stable.** TanStack Query's `hashKey` relies on JSON serialization. If your query keys contain functions or unstable references, this won't work.

3. **You need to reconstruct the original data shape.** The `combine` function lets you map deduplicated results back to whatever structure your components expect.

The trade-off is complexity. This is more code than simply firing off all queries and letting TanStack Query handle caching. But when you have many overlapping queries, the efficiency gains are worth it, both in terms of network requests and cache consistency.

## Key Takeaways

- TanStack Query's `hashKey` function serializes query keys into stable strings, enabling reliable comparison and deduplication.
- The `useQueries` queries hook coupled with the `combine` function provides full control over how results are shaped, making it possible to map deduplicated results back to the original structure.
- When computing derived values like percentages, consider whether multiple data series share the same denominator, as deduplicating these can significantly reduce API calls.
