/**
 * Data source drivers for media server integration
 * 
 * Provides API clients and sync functions for Jellyfin and Emby servers
 */

import * as jellyfin from './jellyfin';
import * as emby from './emby';

export { jellyfin, emby };

/**
 * Sync all data from the appropriate server based on credentials type
 */
export async function syncAllFromServer(
  userId: string,
  serverType: 'jellyfin' | 'emby'
): Promise<void> {
  console.log(`[Data Sources] Starting sync from ${serverType} server...`);

  try {
    if (serverType === 'jellyfin') {
      await jellyfin.syncAll(userId);
    } else if (serverType === 'emby') {
      await emby.syncAll(userId);
    } else {
      throw new Error(`Unsupported server type: ${serverType}`);
    }

    console.log(`[Data Sources] Sync from ${serverType} complete!`);
  } catch (error) {
    console.error(`[Data Sources] Sync from ${serverType} failed:`, error);
    throw error;
  }
}
