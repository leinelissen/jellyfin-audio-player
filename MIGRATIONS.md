# Database Migrations

This document explains how database migrations work in the Jellyfin Audio Player and how to create new migrations.

## Overview

We use [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview) to manage database schema migrations. Since this is a React Native app, migrations are embedded in the app bundle and run automatically on app startup.

## Architecture

### Schema Files

- **`src/store/database/schema.ts`** - The main schema file used at runtime (imports from `drizzle-orm/sqlite-core`)
- **`src/store/database/schema.drizzle.ts`** - Mirror schema file for drizzle-kit compatibility (same imports)

> **Note**: Currently both files use the same imports (`drizzle-orm/sqlite-core`), so they should be identical. Keep both files in sync when making schema changes. We maintain two files to isolate drizzle-kit from the main codebase.

### Migration System

- **`drizzle.config.ts`** - Drizzle Kit configuration
- **`src/store/database/migrations/`** - Generated migration SQL files
- **`src/store/database/migrations/meta/`** - Migration metadata (journal and snapshots)
- **`src/store/database/migrate.ts`** - Migration runner that executes on app startup

### Migration Tracking

Migrations are tracked in the `__drizzle_migrations` table:
- `id` - Auto-increment ID
- `hash` - Migration identifier (e.g., "0000_initial")
- `created_at` - Timestamp when migration was applied

## Creating a New Migration

### Step 1: Update the Schema

Edit both schema files with your changes:

1. Update `src/store/database/schema.ts` (runtime schema)
2. Update `src/store/database/schema.drizzle.ts` (drizzle-kit schema)

Example - adding a new column:

```typescript
// In both schema files
export const artists = sqliteTable('artists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  jellyfin_id: text('jellyfin_id').notNull().unique(),
  bio: text('bio'), // NEW COLUMN
  created_at: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  // ...
});
```

### Step 2: Generate the Migration

Run the migration generator:

```bash
npm run db:generate
```

This will:
1. Compare your schema with the last snapshot
2. Generate a new SQL migration file (e.g., `0001_some_name.sql`)
3. Update the migration journal and snapshot

### Step 3: Embed the Migration

Copy the SQL content from the generated migration file and add it to `src/store/database/migrate.ts`:

```typescript
const migrations = [
  {
    id: '0000_initial',
    sql: `...existing migration...`,
  },
  {
    id: '0001_add_artist_bio', // Use descriptive name
    sql: `ALTER TABLE artists ADD COLUMN bio text;`, // Your SQL from generated file
  },
];
```

⚠️ **Important**: The migration ID must match the filename (without `.sql` extension).

### Step 4: Test the Migration

1. Build and run the app
2. Check the console logs for migration success:
   ```
   [Database] Applying migration: 0001_add_artist_bio
   [Database] ✓ Migration 0001_add_artist_bio applied successfully
   ```
3. Verify the schema changes in your database

## Migration Scripts

Available npm scripts:

- **`npm run db:generate`** - Generate a new migration from schema changes
- **`npm run db:push`** - Push schema directly to database (development only, skips migrations)
- **`npm run db:studio`** - Open Drizzle Studio (note: won't connect to React Native database)

## Best Practices

### 1. Always Use Migrations for Schema Changes

Never modify the database schema manually. Always create a migration to ensure:
- Changes are tracked
- Changes are applied consistently across all devices
- Changes can be rolled back if needed

### 2. Test Migrations Thoroughly

Before releasing:
- Test on a fresh install (no existing database)
- Test on an existing install (with data)
- Test data migration if you're transforming existing data

### 3. Keep Migrations Small and Focused

Each migration should represent a single logical change:
- ✅ "Add artist bio field"
- ✅ "Create favorites table"
- ❌ "Add bio, update indexes, and add favorites" (too much)

### 4. Never Modify Existing Migrations

Once a migration is released:
- Never change its SQL
- Never change its ID
- Create a new migration to fix issues

### 5. Handle Data Migration Carefully

When transforming data, consider:
- Default values for new required columns
- Data type conversions
- Performance for large datasets

Example:

```sql
-- Add new column with default
ALTER TABLE tracks ADD COLUMN play_count INTEGER DEFAULT 0;

-- Populate from existing data if needed
UPDATE tracks SET play_count = 0 WHERE play_count IS NULL;
```

## Migration Execution

### When Migrations Run

Migrations execute automatically when:
1. The app starts
2. The Redux store initializes
3. Before any database operations

### Migration Order

Migrations run in order by their numeric prefix:
- `0000_initial.sql`
- `0001_add_bio.sql`
- `0002_create_favorites.sql`

### Handling Failures

If a migration fails:
1. The error is logged to the console
2. The app continues without the migration
3. The migration will retry on next app start

To fix:
1. Identify the failing migration from logs
2. Create a new migration to fix the issue
3. Release an update

## React Native Considerations

### Why Embed Migrations?

Unlike server applications, React Native can't read migration files from disk at runtime. We embed migrations in the bundle by copying SQL into the `migrate.ts` file.

### Bundle Size Impact

Each migration adds to the app bundle size. To minimize:
- Keep migrations focused and small
- Use concise SQL
- Consider a migration consolidation strategy for major versions

### Testing Migrations

Test on both platforms:
- iOS simulator and device
- Android emulator and device

Database paths differ by platform:
- iOS: `Library/LocalDatabase/`
- Android: `databases/`

## Troubleshooting

### "Migration already applied"

The migration hash is already in `__drizzle_migrations`. This is normal - migrations only run once.

### "No pending migrations"

All migrations in `migrate.ts` have been applied. Generate a new migration if you have schema changes.

### "Table already exists"

The migration tried to create a table that exists. Check:
1. Migration order is correct
2. No duplicate migrations
3. Migration wasn't partially applied

### Drizzle Kit errors during generation

If you see import errors:
1. Verify `schema.drizzle.ts` uses `drizzle-orm/sqlite-core` imports
2. Check `drizzle.config.ts` points to the correct schema file
3. Ensure both schema files are in sync

## Schema Sync Checklist

When updating schemas, verify:

- [ ] Changes made to `schema.ts`
- [ ] Same changes made to `schema.drizzle.ts`
- [ ] Migration generated with `npm run db:generate`
- [ ] Migration SQL copied to `migrate.ts`
- [ ] Migration tested on fresh install
- [ ] Migration tested on existing database
- [ ] Changes documented in PR

## Example Workflow

Let's add a "rating" field to albums:

```bash
# 1. Update both schema files
# Add: rating: integer('rating')
# to albums table in schema.ts and schema.drizzle.ts

# 2. Generate migration
npm run db:generate

# 3. Check generated file
cat src/store/database/migrations/0001_*.sql

# 4. Copy SQL to migrate.ts
# Add new migration object to migrations array

# 5. Test
npm run ios
# Check logs for: ✓ Migration 0001_* applied successfully

# 6. Verify
# Use the app and check that rating field works
```

## Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [op-sqlite Documentation](https://github.com/OP-Engineering/op-sqlite)
