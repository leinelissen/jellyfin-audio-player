/**
 * A tuple that uniquely identifies any entity stored in the local database.
 *
 * Because every entity is scoped to a source (Jellyfin / Emby server), both
 * the source's own identifier and the entity's identifier are required together
 * to unambiguously address a single row.
 *
 * Usage:
 *   const id: EntityId = [sourceId, itemId];
 *   const [sourceId, itemId] = id;
 */
export type EntityId = [sourceId: string, itemId: string];
