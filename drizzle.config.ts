import { defineConfig } from 'drizzle-kit';

// Note: We use schema.drizzle.ts instead of schema.ts because:
// - schema.ts uses drizzle-orm/sqlite-core imports (correct for runtime)
// - drizzle-kit requires these same imports
// - Both files should be kept in sync - any changes to schema.ts must be reflected in schema.drizzle.ts
export default defineConfig({
  schema: './src/store/database/schema.drizzle.ts',
  out: './src/store/database/migrations',
  dialect: 'sqlite',
});
