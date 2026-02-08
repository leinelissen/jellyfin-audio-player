/**
 * Live Queries for Reactive UI
 * 
 * Provides React hooks for live database queries that automatically
 * re-render when data changes.
 * 
 * Note: This is a simple implementation. For production, consider using
 * a more sophisticated solution like @powersync/react or similar.
 */

import { useState, useEffect, useCallback } from 'react';
import { db } from './index';
import { sql } from 'drizzle-orm';

/**
 * Table change listeners
 */
type TableListener = () => void;
const tableListeners = new Map<string, Set<TableListener>>();

/**
 * Register a listener for table changes
 */
function subscribeToTable(tableName: string, listener: TableListener) {
    if (!tableListeners.has(tableName)) {
        tableListeners.set(tableName, new Set());
    }
    tableListeners.get(tableName)!.add(listener);

    return () => {
        const listeners = tableListeners.get(tableName);
        if (listeners) {
            listeners.delete(listener);
            if (listeners.size === 0) {
                tableListeners.delete(tableName);
            }
        }
    };
}

/**
 * Notify listeners that a table has changed
 */
export function invalidateTable(tableName: string) {
    const listeners = tableListeners.get(tableName);
    if (listeners) {
        listeners.forEach(listener => listener());
    }
}

/**
 * Invalidate multiple tables at once
 */
export function invalidateTables(tableNames: string[]) {
    tableNames.forEach(invalidateTable);
}

/**
 * Hook for live query results
 * 
 * @param query - SQL query string
 * @param params - Query parameters
 * @param tables - Array of table names to watch for changes
 * @returns Query results that update when tables change
 * 
 * @example
 * ```typescript
 * const albums = useLiveQuery(
 *   'SELECT * FROM albums WHERE source_id = ? ORDER BY name',
 *   [sourceId],
 *   ['albums']
 * );
 * ```
 */
export function useLiveQuery<T = unknown>(
    query: string,
    params: unknown[] = [],
    tables: string[] = []
): T[] | null {
    const [data, setData] = useState<T[] | null>(null);
    const [version, setVersion] = useState(0);

    // Increment version when any watched table changes
    useEffect(() => {
        if (tables.length === 0) return;

        const unsubscribers = tables.map(table =>
            subscribeToTable(table, () => setVersion(v => v + 1))
        );

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [tables]);

    // Execute query whenever version changes
    const serializedParams = JSON.stringify(params);
    useEffect(() => {
        let cancelled = false;

        async function executeQuery() {
            try {
                // Execute raw SQL query using Drizzle's sql helper
                const result = await db.all(sql.raw(query));
                
                if (!cancelled) {
                    setData(result as T[]);
                }
            } catch (error) {
                console.error('Live query error:', error);
                if (!cancelled) {
                    setData([]);
                }
            }
        }

        executeQuery();

        return () => {
            cancelled = true;
        };
    }, [query, serializedParams, version]);

    return data;
}

/**
 * Hook for a single live query result
 */
export function useLiveQueryOne<T = unknown>(
    query: string,
    params: unknown[] = [],
    tables: string[] = []
): T | null {
    const results = useLiveQuery<T>(query, params, tables);
    return results && results.length > 0 ? results[0] : null;
}

/**
 * Hook to invalidate tables manually
 */
export function useInvalidateTables() {
    return useCallback((tableNames: string | string[]) => {
        const tables = Array.isArray(tableNames) ? tableNames : [tableNames];
        invalidateTables(tables);
    }, []);
}
