import { useTypedSelector, AppState } from '@/store';
import { parseISO } from 'date-fns';
import { ALPHABET_LETTERS } from '@/CONSTANTS';
import { createSelector } from '@reduxjs/toolkit';
import { SectionListData } from 'react-native';
import { MusicArtist } from './types';

/**
 * Retrieves a list of the n most recent albums
 */
export function useRecentAlbums(amount: number) {
    const albums = useTypedSelector((state) => state.music.albums.entities);
    const albumIds = useTypedSelector((state) => state.music.albums.ids);

    const sorted = [...albumIds].sort((a, b) => {
        const albumA = albums[a];
        const albumB = albums[b];
        const dateA = albumA && albumA.DateCreated ? parseISO(albumA.DateCreated).getTime() : 0;
        const dateB = albumB && albumB.DateCreated ? parseISO(albumB.DateCreated).getTime() : 0;
        return dateB - dateA;
    });

    return sorted.slice(0, amount);
}

/**
 * Sort all albums by AlbumArtist
 */
function albumsByArtist(state: AppState['music']['albums']) {
    const { entities: albums, ids: albumIds } = state;

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

export const selectAlbumsByArtist = createSelector(
    (state: AppState) => state.music.albums,
    albumsByArtist,
);

export type SectionedId = SectionListData<string[]>;

/**
 * Splits a set of albums into a list that is split by alphabet letters
 */
function splitAlbumsByAlphabet(state: AppState['music']['albums']): SectionedId[] {
    const { entities: albums } = state;
    const albumIds = albumsByArtist(state);
    const sections: SectionedId[] = ALPHABET_LETTERS.split('').map((l) => ({ label: l, data: [[]] }));

    albumIds.forEach((id) => {
        // Retrieve the album letter and corresponding letter index
        const album = albums[id];
        const letter = album?.AlbumArtist?.toUpperCase().charAt(0);
        const index = letter ? ALPHABET_LETTERS.indexOf(letter) : 26;

        // Then find the current row in this section (note that albums are
        // grouped in pairs so we can render them more easily).
        const section = sections[index >= 0 ? index : 26];
        const row = section.data.length - 1;

        // Add the album to the row
        section.data[row].push(id);

        // GUARD: Check if the row is overflowing. If so, add a new row.
        if (section.data[row].length >= 2) {
            (section.data as string[][]).push([]);
        }
    });

    return sections;
}

/**
 * Wrap splitByAlphabet into a memoized selector
 */
export const selectAlbumsByAlphabet = createSelector(
    (state: AppState) => state.music.albums,
    splitAlbumsByAlphabet,
);

export type SectionArtistItem = MusicArtist;

export type SectionedArtist = SectionListData<MusicArtist>;

function splitArtistsByAlphabet(state: AppState['music']['artists']) {
    const artists = Object.values(state.entities);
    const sections: SectionedArtist[] = ALPHABET_LETTERS.split('').map((l) => ({ label: l, data: [] }));

    artists.forEach((artist) => {
        const letter = artist.Name.toUpperCase().charAt(0);
        const index = letter ? ALPHABET_LETTERS.indexOf(letter) : 26;

        // Then find the current row in this section (note that albums are
        // grouped in pairs so we can render them more easily).
        const section = sections[index >= 0 ? index : 26];

        // Add the album to the row
        (section.data as unknown as MusicArtist[]).push(artist);
    });

    return sections;
}

/**
 * Wrap splitByAlphabet into a memoized selector
 */
export const selectArtists = createSelector(
    (state: AppState) => state.music.artists,
    splitArtistsByAlphabet,
);
