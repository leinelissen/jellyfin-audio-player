import { HybridAutoPlay } from '@iternio/react-native-auto-play';
import type { Store } from '@/store';
import { createBrowseMenu } from './templates/BrowseMenu';
import reduxStore from '@/store';

let store: Store | null = null;

export function initializeAutoPlay(appStore: Store): void {
    store = appStore;
}

export function registerAutoPlay(): void {
    const onConnect = async () => {
        console.log('[AutoPlay] Connected');
        
        // GUARD: Store must be initialized
        if (!store) {
            console.error('[AutoPlay] Store not initialized');
            store = reduxStore;
        }

        // Wait longer for the screen manager to be ready
        // The screen needs to be pushed to the stack before screenManager is available
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const browseTemplate = createBrowseMenu(store);
            await browseTemplate.setRootTemplate();
            console.log('[AutoPlay] Root template set successfully');
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
