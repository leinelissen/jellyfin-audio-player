import { Album, AlbumTrack, MusicArtist, Playlist } from '@/store/music/types';
import { fetchApi } from './lib';

const searchParams = {
    IncludeItemTypes: 'Audio,MusicAlbum,MusicArtist,Playlist',
    SortBy: 'SearchScore,Album,SortName',
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

    const results = await fetchApi<{ Items: (Album | AlbumTrack | MusicArtist | Playlist)[]}>(({ user_id }) => `/Users/${user_id}/Items?${params}`);

    return results.Items;
}
