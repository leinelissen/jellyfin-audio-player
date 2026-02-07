/**
 * Database module - SQLite access layer for Fintunes
 * 
 * This module provides:
 * - Schema definitions (tables, indexes)
 * - Database client and connection management
 * - Live query support for reactive updates
 * - Helper functions for common operations (upsert, bulk operations)
 */

export * from './schema';
export * from './client';
export * from './live-queries';
export * from './helpers';
