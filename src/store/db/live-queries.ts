/**
 * Caveats
 * 1. Reactive queries only fire on transactions - op-sqlite limitation. If you're mutating via
 *   drizzle directly (not using db.transaction()), you may need to call
 *   db.flushPendingReactiveQueries() after writes.
 * 2. Table name extraction is basic - The shim parses FROM/JOIN clauses. Complex CTEs or subqueries
 *   might not be detected correctly.
 * 3. Raw rows from reactive callback - The reactive callback returns raw row data (not through
 *   drizzle's transformations). For simple queries this works, but complex joins might differ
 *   from initial fetch.
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { sqliteDb } from '@/store/db'

type DrizzleQuery = {
    toSQL: () => { sql: string; params: unknown[] };
    then: (onfulfilled?: (value: any) => any) => Promise<any>;
};

type UseLiveQueryResult<T> = {
    data: T[];
    error: Error | undefined;
};

/**
 * Extract table names from a SQL query string.
 * Basic parser handling FROM and JOIN clauses.
 */
function extractTableNames(sql: string): string[] {
    const tables: string[] = [];
    const normalized = sql.toLowerCase();

    const fromMatch = normalized.match(/from\s+["'`]?(\w+)["'`]?/i);
    if (fromMatch) {
        tables.push(fromMatch[1]);
    }

    const joinMatches = normalized.matchAll(/join\s+["'`]?(\w+)["'`]?/gi);
    for (const match of joinMatches) {
        if (!tables.includes(match[1])) {
            tables.push(match[1]);
        }
    }

    return tables;
}

/**
 * Shim for useLiveQuery that bridges Drizzle ORM with op-sqlite's reactiveExecute.
 *
 * Based on: https://op-engineering.github.io/op-sqlite/docs/reactive_queries
 * Workaround until drizzle-orm adds native support:
 * https://github.com/drizzle-team/drizzle-orm/issues/2926
 */
export function useLiveQuery<T>(
    query: DrizzleQuery | undefined | null
): UseLiveQueryResult<T> {
    const [data, setData] = useState<T[]>([]);
    const [error, setError] = useState<Error | undefined>(undefined);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    // Memoize the SQL to avoid re-subscribing on every render
    const sqlKey = useMemo(() => {
        if (!query) return null;
        try {
            const { sql, params } = query.toSQL();
            return JSON.stringify({ sql, params });
        } catch {
            return null;
        }
    }, [query]);

    useEffect(() => {
        if (!query || !sqlKey) {
            return;
        }

        try {
            const { sql, params } = query.toSQL();
            const tables = extractTableNames(sql);

            if (tables.length === 0) {
                console.warn("[useLiveQuery] Could not extract table names from query");
            }

            const fireOn = tables.map((table) => ({ table }));

            // Initial fetch via drizzle (preserves ORM transformations)
            query
                .then((result: T[]) => {
                    setData(result);
                    setError(undefined);
                })
                .catch((e: Error) => {
                    console.error("[useLiveQuery] Initial fetch error:", e);
                    setError(e);
                });

            // Subscribe to reactive updates via op-sqlite
            unsubscribeRef.current = sqliteDb.reactiveExecute({
                query: sql,
                arguments: params as any[],
                fireOn,
                callback: (response) => {
                    // response.rows contains raw row data from reactive callback
                    setData(response.rows as T[]);
                },
            });
        } catch (e) {
            console.error("[useLiveQuery] Setup error:", e);
            setError(e instanceof Error ? e : new Error(String(e)));
        }

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [sqlKey, query]);

    return { data, error };
}