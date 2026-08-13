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

import { useState, useEffect, useRef, useMemo, useCallback, DependencyList } from "react";
import { sqliteDb } from '@/store'
import { QueryPromise } from 'drizzle-orm';

export type UseFtsQueryResult<T> = {
    data: T[];
    error: Error | undefined;
};

/**
 * Reactive hook for raw FTS5 MATCH queries that can't be expressed through
 * drizzle's query builder. Subscribes to changes on the given `watchTables`
 * and re-executes the query whenever any of them are written to.
 *
 * @param sql        Raw SQL string with `?` placeholders.
 * @param params     Positional parameters for the placeholders.
 * @param watchTables Base table names to watch for reactive updates (e.g. `['albums']`).
 *                   Use the real content tables, not the FTS shadow tables — writes
 *                   flow through the real tables via triggers.
 * @param enabled    Set to false to skip the query entirely (e.g. when the search
 *                   term is empty). Defaults to true.
 */
export function useFtsQuery<T>(
    rawSql: string,
    params: unknown[],
    watchTables: string[],
    enabled: boolean = true,
): UseFtsQueryResult<T> {
    const [data, setData] = useState<T[]>([]);
    const [error, setError] = useState<Error | undefined>(undefined);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    // Stable key so we only re-subscribe when the query or params actually change
    const queryKey = useMemo(
        () => enabled ? JSON.stringify({ rawSql, params }) : null,
        [enabled, rawSql, params],
    );

    useEffect(() => {
        if (!queryKey) {
            setData([]);
            setError(undefined);
            return;
        }

        try {
            const fireOn = watchTables.map((table) => ({ table }));

            // Initial fetch (sync so we can read rows immediately in the effect)
            const result = sqliteDb.executeSync(rawSql, params as any[]);
            setData((result.rows as T[]) ?? []);
            setError(undefined);

            // Subscribe to reactive updates
            unsubscribeRef.current = sqliteDb.reactiveExecute({
                query: rawSql,
                arguments: params as any[],
                fireOn,
                callback: (response) => {
                    setData((response.rows as T[]) ?? []);
                },
            });
        } catch (e) {
            console.error('[useFtsQuery] Setup error:', e);
            setError(e instanceof Error ? e : new Error(String(e)));
        }

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    // rawSql, params, and watchTables are all captured via queryKey — their
    // values are stable for the lifetime of the subscription, so listing
    // queryKey alone is sufficient and avoids re-subscribing on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryKey]); // rawSql, params, watchTables intentionally omitted — captured in queryKey

    return { data, error };
}

type DrizzleQuery<T> = QueryPromise<T> &{
    toSQL: () => { sql: string; params: unknown[] };
};

type UseLiveQueryResult<T> = {
    data: T | null;
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
 * Accepts a factory function that returns a drizzle query, plus an optional
 * dependency array (defaults to []). The factory is re-run — and the
 * subscription re-established — only when the deps change, preventing
 * unnecessary re-subscriptions on every render.
 *
 * @example
 * // Static query — no deps needed
 * const { data } = useLiveQuery(() => db.query.sources.findMany());
 *
 * // Dynamic query — list deps that should trigger a re-query
 * const { data } = useLiveQuery(
 *     () => db.query.tracks.findFirst({ where: { sourceId, id } }),
 *     [sourceId, id]
 * );
 *
 * Based on: https://op-engineering.github.io/op-sqlite/docs/reactive_queries
 * Workaround until drizzle-orm adds native support:
 * https://github.com/drizzle-team/drizzle-orm/issues/2926
 */
export function useLiveQuery<T>(
    queryFn: () => DrizzleQuery<T> | undefined | null,
    deps: DependencyList = [],
): UseLiveQueryResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<Error | undefined>(undefined);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    // Stable factory — only re-runs when deps change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const stableQueryFn = useCallback(queryFn, deps);
    const query = useMemo(() => stableQueryFn(), [stableQueryFn]);

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
                .then((result: T) => {
                    setData(result);
                    setError(undefined);
                })
                .catch((e: Error) => {
                    console.error("[useLiveQuery] Initial fetch error:", e);
                    setError(e);
                });

            // Subscribe to reactive updates via op-sqlite.
            // We intentionally ignore response.rows here because op-sqlite's
            // reactive callback returns raw SQLite rows that bypass Drizzle's
            // ORM transformations (column mapping, type coercions, relation
            // hydration, etc.).  Instead we re-execute the original Drizzle
            // query so the result always has the correct shape.
            unsubscribeRef.current = sqliteDb.reactiveExecute({
                query: sql,
                arguments: params as any[],
                fireOn,
                callback: () => {
                    query
                        .then((result: T) => {
                            setData(result);
                            setError(undefined);
                        })
                        .catch((e: Error) => {
                            console.error("[useLiveQuery] Reactive re-fetch error:", e);
                            setError(e);
                        });
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
    }, [sqlKey, query]); // query is stable — only changes when deps change

    return { data, error };
}
