import { EventEmitter } from 'events';

export type QueryKey = string;
export type QueryFn<T> = () => Promise<T>;

interface QueryEntry<T = any> {
  key: QueryKey;
  queryFn: QueryFn<T>;
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  hasExecuted: boolean; // Track if query has run at least once
  listeners: Set<() => void>;
}

class LiveQueryManager {
  private emitter: EventEmitter;
  private queries: Map<QueryKey, QueryEntry>;

  constructor() {
    this.emitter = new EventEmitter();
    this.queries = new Map();
    this.emitter.setMaxListeners(100); // Support many active queries
  }

  /**
   * Register a query and subscribe to its changes
   */
  subscribe<T>(
    key: QueryKey,
    queryFn: QueryFn<T>,
    listener: () => void
  ): () => void {
    let entry = this.queries.get(key) as QueryEntry<T> | undefined;

    if (!entry) {
      entry = {
        key,
        queryFn,
        data: null,
        error: null,
        isLoading: false,
        hasExecuted: false,
        listeners: new Set(),
      };
      this.queries.set(key, entry);
    }

    // Add listener
    entry.listeners.add(listener);

    // Execute query if not already executed or running
    if (!entry.isLoading && !entry.hasExecuted) {
      this.executeQuery(key);
    }

    // Return unsubscribe function
    return () => {
      const currentEntry = this.queries.get(key);
      if (currentEntry) {
        currentEntry.listeners.delete(listener);
        // Clean up if no more listeners
        if (currentEntry.listeners.size === 0) {
          this.queries.delete(key);
        }
      }
    };
  }

  /**
   * Execute a query and update its entry
   */
  private async executeQuery<T>(key: QueryKey): Promise<void> {
    const entry = this.queries.get(key) as QueryEntry<T> | undefined;
    if (!entry) return;

    entry.isLoading = true;
    entry.error = null;

    try {
      const data = await entry.queryFn();
      entry.data = data;
      entry.error = null;
      entry.hasExecuted = true;
    } catch (error) {
      entry.error = error as Error;
      entry.data = null;
      entry.hasExecuted = true;
      console.error(`[LiveQuery] Query error for key "${key}":`, error);
    } finally {
      entry.isLoading = false;
      // Notify all listeners
      entry.listeners.forEach((listener) => listener());
    }
  }

  /**
   * Get current query state
   */
  getQueryState<T>(key: QueryKey): {
    data: T | null;
    error: Error | null;
    isLoading: boolean;
  } {
    const entry = this.queries.get(key) as QueryEntry<T> | undefined;
    return {
      data: entry?.data ?? null,
      error: entry?.error ?? null,
      isLoading: entry?.isLoading ?? false,
    };
  }

  /**
   * Invalidate specific queries by key or pattern
   */
  invalidateQueries(keyOrPattern?: QueryKey | RegExp): void {
    const keysToInvalidate: QueryKey[] = [];

    if (!keyOrPattern) {
      // Invalidate all queries
      keysToInvalidate.push(...Array.from(this.queries.keys()));
    } else if (typeof keyOrPattern === 'string') {
      // Invalidate specific key
      if (this.queries.has(keyOrPattern)) {
        keysToInvalidate.push(keyOrPattern);
      }
    } else {
      // Invalidate by pattern
      Array.from(this.queries.keys()).forEach((key) => {
        if (keyOrPattern.test(key)) {
          keysToInvalidate.push(key);
        }
      });
    }

    // Re-execute invalidated queries
    keysToInvalidate.forEach((key) => {
      this.executeQuery(key);
    });
  }

  /**
   * Create a live query wrapper that can be used for manual query execution
   */
  createLiveQuery<T>(key: QueryKey, queryFn: QueryFn<T>): () => Promise<T> {
    return async () => {
      const entry = this.queries.get(key);
      
      // If query has executed successfully and not loading, return cached data
      if (entry && entry.hasExecuted && !entry.isLoading && entry.error === null) {
        return entry.data as T;
      }

      // Execute fresh query
      const tempEntry: QueryEntry<T> = {
        key,
        queryFn,
        data: null,
        error: null,
        isLoading: true,
        hasExecuted: false,
        listeners: new Set(),
      };
      
      this.queries.set(key, tempEntry);
      
      try {
        const data = await queryFn();
        tempEntry.data = data;
        tempEntry.isLoading = false;
        tempEntry.hasExecuted = true;
        return data;
      } catch (error) {
        tempEntry.error = error as Error;
        tempEntry.isLoading = false;
        tempEntry.hasExecuted = true;
        throw error;
      }
    };
  }

  /**
   * Get all active query keys
   */
  getActiveQueries(): QueryKey[] {
    return Array.from(this.queries.keys());
  }

  /**
   * Clear all queries
   */
  clear(): void {
    this.queries.clear();
  }
}

// Export singleton instance
export const liveQueryManager = new LiveQueryManager();

// Convenience exports
export const invalidateQueries = (keyOrPattern?: QueryKey | RegExp) =>
  liveQueryManager.invalidateQueries(keyOrPattern);

export const createLiveQuery = <T>(key: QueryKey, queryFn: QueryFn<T>) =>
  liveQueryManager.createLiveQuery(key, queryFn);
