import { Album, AlbumTrack } from '@/store/music/types';
import { fetchApi } from './lib';

const searchParams = {
    IncludeItemTypes: 'Audio,MusicAlbum',
    SortBy: 'Album,SortName',
    SortOrder: 'Ascending',
    Recursive: 'true',
};

/**
 * Remotely search the Jellyfin library for a particular search term
 */
export async function searchItem(
    term: string, limit = 24
) {
    const params = new URLSearchParams({
        ...searchParams,
        SearchTerm: term,
        Limit: limit.toString(),
    }).toString();

    const results = await fetchApi<{ Items: (Album | AlbumTrack)[]}>(({ user_id }) => `/Users/${user_id}/Items?${params}`);

    return results.Items
        .filter((item) => (
            // GUARD: Ensure that we're either dealing with an album or a track from an album.
            item.Type === 'MusicAlbum' || (item.Type === 'Audio' && item.AlbumId)
        ));
}