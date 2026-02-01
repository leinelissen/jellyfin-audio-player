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
        sections: [
            {
                type: 'default',
                title: '',
                items: [
                    {
                        type: 'default',
                        title: { text: t('recent-albums') },
                        onPress: () => {
                            console.log('[BrowseMenu] Recent Albums selected');
                            const template = createRecentAlbumsTemplate(store);
                            template.push();
                        },
                    },
                    {
                        type: 'default',
                        title: { text: t('all-albums') },
                        onPress: () => {
                            console.log('[BrowseMenu] All Albums selected');
                            const template = createAllAlbumsTemplate(store);
                            template.push();
                        },
                    },
                    {
                        type: 'default',
                        title: { text: t('playlists') },
                        onPress: () => {
                            console.log('[BrowseMenu] Playlists selected');
                            const template = createPlaylistsTemplate(store);
                            template.push();
                        },
                    },
                    {
                        type: 'default',
                        title: { text: t('artists') },
                        onPress: () => {
                            console.log('[BrowseMenu] Artists selected');
                            const template = createArtistsTemplate(store);
                            template.push();
                        },
                    },
                ],
            },
        ],
    });
}
