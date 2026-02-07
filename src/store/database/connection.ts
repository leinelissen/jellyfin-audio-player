import { open } from '@op-engineering/op-sqlite';
import { drizzle } from 'drizzle-orm/op-sqlite';
import * as schema from './schema';

// Retry configuration
const MAX_RETRIES = 5;
const INITIAL_DELAY = 100; // milliseconds

/**
 * Sleep for a given number of milliseconds
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Initialize SQLite database with retry logic
 */
const initializeDatabase = async () => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[Database] Connection attempt ${attempt}/${MAX_RETRIES}`);

      // Open SQLite database
      const sqliteDb = open({
        name: 'fintunes.db',
      });

      // Create Drizzle instance with schema
      const db = drizzle(sqliteDb, { schema });

      console.log('[Database] Successfully connected to fintunes.db');
      return db;
    } catch (error) {
      lastError = error as Error;
      console.error(
        `[Database] Connection attempt ${attempt} failed:`,
        error
      );

      if (attempt < MAX_RETRIES) {
        // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms
        const delay = INITIAL_DELAY * Math.pow(2, attempt - 1);
        console.log(`[Database] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  // All retries failed
  const errorMessage = `Failed to initialize database after ${MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`;
  console.error(`[Database] ${errorMessage}`);
  throw new Error(errorMessage);
};

// Initialize database and export
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let initializationPromise: Promise<ReturnType<typeof drizzle<typeof schema>>> | null = null;

export const getDatabase = async () => {
  if (dbInstance) {
    return dbInstance;
  }
  
  // Prevent race condition by reusing the same initialization promise
  if (!initializationPromise) {
    initializationPromise = initializeDatabase();
  }
  
  dbInstance = await initializationPromise;
  return dbInstance;
};

// Export for synchronous access after initialization
// Note: This will be undefined until getDatabase() completes
// Consumers should use getDatabase() for guaranteed initialization
export let db: ReturnType<typeof drizzle<typeof schema>> | undefined;

// Initialize immediately
getDatabase()
  .then((instance) => {
    db = instance;
  })
  .catch((error) => {
    console.error('[Database] Fatal initialization error:', error);
  });
