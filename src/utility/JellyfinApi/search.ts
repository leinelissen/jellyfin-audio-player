import { Album, AlbumTrack, MusicArtist, Playlist } from '@/store/music/types';
import { fetchApi } from './lib';

const searchParams = {
    IncludeItemTypes: 'Audio,MusicAlbum,MusicArtist,Playlist',
    SortBy: 'SearchScore,Album,SortName',
    SortOrder: 'Ascending',
    Recursive: 'true',
};

export type SearchResult = Album | AlbumTrack | MusicArtist | Playlist;

/**
 * Remotely search the Jellyfin library for a particular search term
 */
export function searchItem(
    term: string, limit = 24
) {
    const params = new URLSearchParams({
        ...searchParams,
        SearchTerm: term,
        Limit: limit.toString(),
    }).toString();

    return fetchApi<{ Items: SearchResult[]}>(({ user_id }) => `/Users/${user_id}/Items?${params}`).then(result => result.Items);
}
