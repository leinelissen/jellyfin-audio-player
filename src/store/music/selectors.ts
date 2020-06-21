import { useTypedSelector } from 'store';
import { parseISO } from 'date-fns';
import { Album } from './types';

/**
 * Retrieves a list of the n most recent albums
 */
export function useRecentAlbums(amount: number) {
    const albums = useTypedSelector((state) => state.music.albums.entities);
    const albumIds = useTypedSelector((state) => state.music.albums.ids);

    const sorted = [...albumIds].sort((a, b) => {
        const albumA = albums[a];
        const albumB = albums[b];
        const dateA = albumA ? parseISO(albumA.DateCreated).getTime() : 0;
        const dateB = albumB ? parseISO(albumB.DateCreated).getTime() : 0;
        return dateB - dateA;
    });

    return sorted.slice(0, amount);
}

export function useAlbumsByArtist() {
    const albums = useTypedSelector((state) => state.music.albums.entities);
    const albumIds = useTypedSelector((state) => state.music.albums.ids);

    const sorted = [...albumIds].sort((a, b) => {
        const albumA = albums[a];
        const albumB = albums[b];
        if ((!albumA && !albumB) || (!albumA?.AlbumArtist && !albumB?.AlbumArtist)) {
            return 0;
        } else if (!albumA || !albumA.AlbumArtist) {
            return 1;
        } else if (!albumB || !albumB.AlbumArtist) {
            return -1;
        }

        return albumA.AlbumArtist.localeCompare(albumB.AlbumArtist);
    });

    return sorted;
}