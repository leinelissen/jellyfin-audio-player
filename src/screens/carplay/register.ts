import { HybridAutoPlay } from '@iternio/react-native-auto-play';
import { createBrowseMenu } from './templates/BrowseMenu';

/**
 * Registers CarPlay AutoPlay listeners and sets up the root browse menu
 * template when the device is connected to a CarPlay-enabled vehicle.
 */
export function registerAutoPlay(): void {
    // Listen for CarPlay connection events
    HybridAutoPlay.addListener('didConnect', async () => {
        console.log('[AutoPlay] Connected');

        try {
            // Set up and display the browse menu as the root template
            const browseTemplate = createBrowseMenu();
            await browseTemplate.setRootTemplate();
            
            console.log('[AutoPlay] Root template set successfully');
        } catch (error) {
            console.error('[AutoPlay] Error setting up templates:', error);
        }
    });

    // Listen for CarPlay disconnection events
    HybridAutoPlay.addListener('didDisconnect', () => {
        console.log('[AutoPlay] Disconnected');
    });
}
