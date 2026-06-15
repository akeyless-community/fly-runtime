export interface CacheEntry<T> {
  value: T;
  expiresAtMs: number;
}

export class TtlCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();

  get(key: string, nowMs = Date.now()): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }
    if (nowMs >= entry.expiresAtMs) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number, nowMs = Date.now()): void {
    this.entries.set(key, {
      value,
      expiresAtMs: nowMs + ttlMs,
    });
  }

  delete(key: string): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }
}
