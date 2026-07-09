class SimpleCache {
  private cache = new Map<string, { data: any; expiry: number }>();

  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  set(key: string, data: any, ttlMs: number = 30000): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

declare global {
  var memoryCache: SimpleCache | undefined;
}

if (!globalThis.memoryCache) {
  globalThis.memoryCache = new SimpleCache();
}

export const memoryCache = globalThis.memoryCache;
