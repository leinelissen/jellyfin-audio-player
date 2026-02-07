/**
 * Live Query Shim for op-sqlite
 * Based on: https://gist.github.com/dukedorje/7154ab0601e4f9cc1f337e0010168bf8
 * 
 * Provides reactive query support for SQLite database changes.
 * 
 * CAVEATS:
 * - This shim is not a full reactive query implementation
 * - It relies on manual invalidation after writes
 * - Performance may vary with large result sets
 * - Does not track specific row changes, only table-level changes
 */

import { useEffect, useState, useCallback } from 'react';
import { getRawDatabase } from './client';

type QueryListener = () => void;
type UnsubscribeFn = () => void;

// Table-level listeners map
const tableListeners = new Map<string, Set<QueryListener>>();

/**
 * Subscribe to changes on specific tables
 */
function subscribeToTables(tables: string[], listener: QueryListener): UnsubscribeFn {
  tables.forEach((table) => {
    if (!tableListeners.has(table)) {
      tableListeners.set(table, new Set());
    }
    tableListeners.get(table)!.add(listener);
  });

  // Return unsubscribe function
  return () => {
    tables.forEach((table) => {
      const listeners = tableListeners.get(table);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          tableListeners.delete(table);
        }
      }
    });
  };
}

/**
 * Notify all listeners of a table that it has changed
 */
export function invalidateTable(table: string) {
  const listeners = tableListeners.get(table);
  if (listeners) {
    listeners.forEach((listener) => listener());
  }
}

/**
 * Notify multiple tables of changes
 */
export function invalidateTables(tables: string[]) {
  tables.forEach((table) => invalidateTable(table));
}

/**
 * React hook for live queries
 * 
 * @param sql - SQL query to execute
 * @param params - Query parameters
 * @param tables - Tables to watch for changes
 * @returns Query result array
 * 
 * @example
 * const albums = useLiveQuery(
 *   'SELECT * FROM albums WHERE source_id = ? ORDER BY name',
 *   [sourceId],
 *   ['albums']
 * );
 */
export function useLiveQuery<T = any>(
  sql: string,
  params: any[] = [],
  tables: string[] = []
): T[] | null {
  const [data, setData] = useState<T[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const executeQuery = useCallback(() => {
    try {
      const db = getRawDatabase();
      const result = db.execute(sql, params);
      setData(result.rows?._array || []);
      setError(null);
    } catch (err) {
      console.error('Live query error:', err);
      setError(err as Error);
      setData(null);
    }
  }, [sql, JSON.stringify(params)]);

  useEffect(() => {
    // Execute initial query
    executeQuery();

    // Subscribe to table changes
    const unsubscribe = subscribeToTables(tables, executeQuery);

    return unsubscribe;
  }, [executeQuery, JSON.stringify(tables)]);

  if (error) {
    throw error;
  }

  return data;
}

/**
 * React hook for a single live query result
 */
export function useLiveQueryOne<T = any>(
  sql: string,
  params: any[] = [],
  tables: string[] = []
): T | null {
  const results = useLiveQuery<T>(sql, params, tables);
  return results && results.length > 0 ? results[0] : null;
}

/**
 * Execute a query and return results (non-reactive)
 */
export function executeQuery<T = any>(sql: string, params: any[] = []): T[] {
  const db = getRawDatabase();
  const result = db.execute(sql, params);
  return result.rows?._array || [];
}

/**
 * Execute a query and return the first result (non-reactive)
 */
export function executeQueryOne<T = any>(sql: string, params: any[] = []): T | null {
  const results = executeQuery<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Execute a write query (INSERT, UPDATE, DELETE) and invalidate tables
 */
export function executeWrite(sql: string, params: any[] = [], affectedTables: string[] = []) {
  const db = getRawDatabase();
  db.execute(sql, params);
  invalidateTables(affectedTables);
}

/**
 * Execute multiple write queries in a transaction
 */
export function executeTransaction(
  queries: Array<{ sql: string; params?: any[] }>,
  affectedTables: string[] = []
) {
  const db = getRawDatabase();
  
  db.execute('BEGIN TRANSACTION');
  
  try {
    queries.forEach(({ sql, params = [] }) => {
      db.execute(sql, params);
    });
    db.execute('COMMIT');
    invalidateTables(affectedTables);
  } catch (error) {
    db.execute('ROLLBACK');
    throw error;
  }
}
