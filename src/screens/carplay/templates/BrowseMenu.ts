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
