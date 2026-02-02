import { HybridAutoPlay } from '@iternio/react-native-auto-play';
import type { Store } from '@/store';
import { createBrowseMenu } from './templates/BrowseMenu';
import reduxStore from '@/store';

let store: Store | null = null;
let isConnected = false;
let connectListenerCleanup: (() => void) | null = null;
let disconnectListenerCleanup: (() => void) | null = null;

export function initializeAutoPlay(appStore: Store): void {
    store = appStore;
}

export function registerAutoPlay(): void {
    const onConnect = async () => {
        console.log('[AutoPlay] Connected');
        isConnected = true;
        
        // GUARD: Store must be initialized
        if (!store) {
            console.error('[AutoPlay] Store not initialized');
            store = reduxStore;
        }

        // Wait longer for the screen manager to be ready
        // The screen needs to be pushed to the stack before screenManager is available
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            // Always get fresh store state when connecting
            const browseTemplate = createBrowseMenu(store);
            await browseTemplate.setRootTemplate();
            console.log('[AutoPlay] Root template set successfully');
        } catch (error) {
            console.error('[AutoPlay] Error setting up templates:', error);
        }
    };

    const onDisconnect = () => {
        console.log('[AutoPlay] Disconnected');
        isConnected = false;
    };

    // Remove existing listeners if any
    if (connectListenerCleanup) {
        connectListenerCleanup();
        connectListenerCleanup = null;
    }
    if (disconnectListenerCleanup) {
        disconnectListenerCleanup();
        disconnectListenerCleanup = null;
    }

    // Add listeners and store cleanup callbacks
    connectListenerCleanup = HybridAutoPlay.addListener('didConnect', onConnect);
    disconnectListenerCleanup = HybridAutoPlay.addListener('didDisconnect', onDisconnect);
}

export function unregisterAutoPlay(): void {
    if (connectListenerCleanup) {
        connectListenerCleanup();
        connectListenerCleanup = null;
    }
    if (disconnectListenerCleanup) {
        disconnectListenerCleanup();
        disconnectListenerCleanup = null;
    }
    isConnected = false;
    console.log('[AutoPlay] Unregistered listeners');
}

export function isCarPlayConnected(): boolean {
    return isConnected;
}
