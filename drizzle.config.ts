import type { Config } from 'drizzle-kit';

export default {
  schema: './src/store/db/schema/*.ts',
  out: './src/store/db/migrations',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
