import { PayloadAction, createSlice } from '@reduxjs/toolkit';

type SearchType = 'Audio' | 'MusicAlbum' | 'MusicArtist' | 'Playlist';

export interface SearchQuery {
    query: string;
    filters: SearchType[];
    localPlaybackOnly: boolean;
    timestamp: number;
}

export interface State {
    queryHistory: SearchQuery[];
}

export const initialState: State = {
    queryHistory: [],
};

const search = createSlice({
    name: 'search',
    initialState,
    reducers: {
        addSearchQuery(state, action: PayloadAction<Omit<SearchQuery, 'timestamp'>>) {
            const newQuery: SearchQuery = {
                ...action.payload,
                timestamp: Date.now(),
            };

            // Remove duplicate queries (same query and filters)
            state.queryHistory = state.queryHistory.filter(
                item => !(item.query === newQuery.query && 
                         JSON.stringify(item.filters.sort()) === JSON.stringify(newQuery.filters.sort()) &&
                         item.localPlaybackOnly === newQuery.localPlaybackOnly)
            );

            // Add new query to the beginning
            state.queryHistory.unshift(newQuery);

            // Keep only the last 10 queries
            if (state.queryHistory.length > 10) {
                state.queryHistory = state.queryHistory.slice(0, 10);
            }
        },
        clearSearchHistory(state) {
            state.queryHistory = [];
        },
    },
});

export const { addSearchQuery, clearSearchHistory } = search.actions;

export default search;
