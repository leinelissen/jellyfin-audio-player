import { HybridAutoPlay } from '@iternio/react-native-auto-play';
import type { Store } from '@/store';
import { createBrowseMenu } from './templates/BrowseMenu';

let store: Store | null = null;

export function initializeAutoPlay(appStore: Store): void {
    store = appStore;
}

export function registerAutoPlay(): void {
    const onConnect = () => {
        console.log('[AutoPlay] Connected');
        
        // GUARD: Store must be initialized
        if (!store) {
            console.error('[AutoPlay] Store not initialized');
            return;
        }

        try {
            const browseTemplate = createBrowseMenu(store);
            browseTemplate.setRootTemplate();
            console.log('[AutoPlay] Root template set');
        } catch (error) {
            console.error('[AutoPlay] Error setting up templates:', error);
        }
    };

    const onDisconnect = () => {
        console.log('[AutoPlay] Disconnected');
    };

    HybridAutoPlay.addListener('didConnect', onConnect);
    HybridAutoPlay.addListener('didDisconnect', onDisconnect);
}
