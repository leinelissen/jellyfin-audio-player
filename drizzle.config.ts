import type { Config } from 'drizzle-kit';

export default {
    schema: './src/store/**/entity.ts',
    out: './src/store/database/migrations',
    dialect: 'sqlite',
    driver: 'expo',
} satisfies Config;
