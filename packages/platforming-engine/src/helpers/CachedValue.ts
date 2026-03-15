export class CachedValue<T> {
  private value: T | undefined;
  private prevDeps: unknown[] = [];

  /** Returns the cached value, recomputing only when deps change. */
  get(compute: () => T, deps: unknown[]): T {
    if (this.value !== undefined && depsEqual(this.prevDeps, deps)) {
      return this.value;
    }
    this.value = compute();
    this.prevDeps = deps.slice();
    return this.value;
  }

  /** Force invalidation (e.g., on add/remove). */
  invalidate(): void {
    this.value = undefined;
  }
}

function depsEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
