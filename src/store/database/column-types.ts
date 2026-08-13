import { customType } from 'drizzle-orm/sqlite-core';

/**
 * A SQLite TEXT column that automatically serialises values to JSON on write
 * and deserialises them back to the typed value on read.
 *
 * Usage:
 *
 *   metadata: jsonColumn<MyApiResponse>('metadata'),
 *   metadata: jsonColumn<MyApiResponse>('metadata').notNull(),
 *
 * The column stores a plain JSON string in SQLite, so it is fully compatible
 * with existing rows. Switching an existing `text()` column over to
 * `jsonColumn()` requires no migration — the on-disk representation is
 * identical; only the TypeScript type and the automatic parse/serialise
 * behaviour change.
 *
 * Type parameter T:
 *   The TypeScript type of the deserialised value (i.e. what you get back
 *   when you read a row). Pass `unknown` when the shape is intentionally
 *   untyped.
 */
export const jsonColumn = customType<{
    data: unknown;
    driverData: string;
    config: { $type?: unknown };
}>({
    dataType() {
        return 'text';
    },

    toDriver(value: unknown): string {
        return JSON.stringify(value);
    },

    fromDriver(value: string): unknown {
        return JSON.parse(value);
    },
}) as <T>(
    name: string,
    config?: Record<string, unknown>,
) => ReturnType<
    ReturnType<
        typeof customType<{ data: T; driverData: string }>
    >
>;