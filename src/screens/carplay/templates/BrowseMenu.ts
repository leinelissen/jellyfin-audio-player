import { ListTemplate } from '@iternio/react-native-auto-play';
import type { Store } from '@/store';
import { t } from '@/localisation';
import { 
    createRecentAlbumsTemplate,
    createAllAlbumsTemplate,
} from './AlbumsList';
import { createPlaylistsTemplate } from './PlaylistsList';
import { createArtistsTemplate } from './ArtistsList';

export function createBrowseMenu(store: Store): ListTemplate {
    // Note: Templates created on-demand get fresh state from the store
    // Each navigation creates a new template with current data
    return new ListTemplate({
        title: { text: t('browse') },
        sections: {
            type: 'default',
            items: [
                {
                    type: 'default',
                    title: { text: t('recent-albums') },
                    onPress: async () => {
                        console.log('[BrowseMenu] Recent Albums selected');
                        try {
                            // Create template with fresh state on each navigation
                            const template = createRecentAlbumsTemplate(store);
                            await template.push();
                            console.log('[BrowseMenu] Recent Albums template pushed');
                        } catch (error) {
                            console.error('[BrowseMenu] Error pushing Recent Albums:', error);
                        }
                    },
                },
                {
                    type: 'default',
                    title: { text: t('all-albums') },
                    onPress: async () => {
                        console.log('[BrowseMenu] All Albums selected');
                        try {
                            // Create template with fresh state on each navigation
                            const template = createAllAlbumsTemplate(store);
                            await template.push();
                            console.log('[BrowseMenu] All Albums template pushed');
                        } catch (error) {
                            console.error('[BrowseMenu] Error pushing All Albums:', error);
                        }
                    },
                },
                {
                    type: 'default',
                    title: { text: t('playlists') },
                    onPress: async () => {
                        console.log('[BrowseMenu] Playlists selected');
                        try {
                            // Create template with fresh state on each navigation
                            const template = createPlaylistsTemplate(store);
                            await template.push();
                            console.log('[BrowseMenu] Playlists template pushed');
                        } catch (error) {
                            console.error('[BrowseMenu] Error pushing Playlists:', error);
                        }
                    },
                },
                {
                    type: 'default',
                    title: { text: t('artists') },
                    onPress: async () => {
                        console.log('[BrowseMenu] Artists selected');
                        try {
                            // Create template with fresh state on each navigation
                            const template = createArtistsTemplate(store);
                            await template.push();
                            console.log('[BrowseMenu] Artists template pushed');
                        } catch (error) {
                            console.error('[BrowseMenu] Error pushing Artists:', error);
                        }
                    },
                },
            ],
        },
    });
}
