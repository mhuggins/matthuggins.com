import type { ColumnInfo, DatasetRow } from "../types";

export interface StoredDataset {
  ref: string;
  columns: ColumnInfo[];
  rows: DatasetRow[];
}

/**
 * In-memory, per-conversation store of fetched datasets. Query tools stash
 * their rows here and hand the model only an opaque `dataRef`; downstream tools
 * (and the chart renderer) resolve that ref back to the real rows. This keeps
 * large payloads out of the model's context, mirroring the opaque-artifact
 * pattern from the blog post.
 */
export interface DataStore {
  put(columns: ColumnInfo[], rows: DatasetRow[]): StoredDataset;
  get(ref: string): StoredDataset | undefined;
}

export function createDataStore(): DataStore {
  const store = new Map<string, StoredDataset>();
  let counter = 0;

  return {
    put(columns, rows) {
      counter += 1;
      const ref = `ds_${counter}`;
      const dataset: StoredDataset = { ref, columns, rows };
      store.set(ref, dataset);
      return dataset;
    },
    get(ref) {
      return store.get(ref);
    },
  };
}
