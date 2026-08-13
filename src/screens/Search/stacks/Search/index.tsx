import React, { useState, useEffect, useCallback, useMemo } from 'react';
import debounce from 'lodash/debounce';
import Input from '@/components/Input';
import { Animated, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import styled from 'styled-components/native';

import { useAlbumSearch } from '@/store/albums/hooks';
import { useTrackSearch } from '@/store/tracks/hooks';
import { useArtistSearch } from '@/store/artists/hooks';
import { usePlaylistSearch } from '@/store/playlists/hooks';
import { useSearchQueries } from '@/store/search-queries/hooks';
import { clearSearchQueries, upsertSearchQuery } from '@/store/search-queries/actions';

import type { Album } from '@/store/albums/types';
import type { Track } from '@/store/tracks/types';
import type { Artist } from '@/store/artists/types';
import type { Playlist } from '@/store/playlists/types';
import type { SearchQuery } from '@/store/search-queries/types';

import { FlatList } from 'react-native-gesture-handler';
import TouchableHandler from '@/components/TouchableHandler';
import { useNavigation } from '@react-navigation/native';
import Artwork from '@/store/sources/artwork-manager';
import { t } from '@/localisation';
import useDefaultStyles from '@/components/Colors';
import { SubHeader, Text } from '@/components/Typography';
import ChevronRight from '@/assets/icons/chevron-right.svg';
import SearchIcon from '@/assets/icons/magnifying-glass.svg';
import { ShadowWrapper } from '@/components/Shadow';
import { NavigationProp } from '@/screens/types';
import { useNavigationOffsets } from '@/components/SafeNavigatorView';
import BaseAlbumImage from '@/screens/Music/stacks/components/AlbumImage';
import usePlayTracks from '@/utility/usePlayTracks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MicrophoneIcon from '@/assets/icons/microphone.svg';
import AlbumIcon from '@/assets/icons/collection.svg';
import TrackIcon from '@/assets/icons/note.svg';
import PlaylistIcon from '@/assets/icons/note-list.svg';
import LocalIcon from '@/assets/icons/internal-drive.svg';
import TrashIcon from '@/assets/icons/trash.svg';
import XMarkIcon from '@/assets/icons/xmark.svg';
import SelectableFilter from './components/SelectableFilter';
import Button from '@/components/Button';
import { retrieveInstantMixByTrackId } from '@/utility/playlist';

const KEYBOARD_OFFSET = Platform.select({
    ios: 0,
    // Android 15+ has edge-to-edge support, changing the keyboard offset to 0
    android: parseInt(Platform.Version as string, 10) >= 35 ? 0 : 72,
});
const SEARCH_INPUT_HEIGHT = 104;

const SEARCH_INPUT_OFFSET = Platform.select({
    ios: 100,
    android: 110,
});

const Container = styled(View)`
    padding: 4px 24px 0 24px;
    margin-bottom: 0px;
    padding-bottom: 0px;
    border-top-width: 0.5px;
`;

const FullSizeContainer = styled.View`
    flex: 1;
`;

const ClearButton = styled.TouchableOpacity`
    position: absolute;
    right: 6px;
    top: 0;
    height: 100%;
    justify-content: center;
    padding: 0 8px;
`;

const SearchItemImage = styled(BaseAlbumImage)`
    border-radius: 4px;
    width: 32px;
    height: 32px;
    margin-right: 10px;
`;

const HalfOpacity = styled.Text`
    opacity: 0.5;
    margin-top: 2px;
    font-size: 12px;
    flex: 1 1 auto;
`;

const SearchResult = styled.View`
    flex-direction: row;
    align-items: center;
    padding: 8px 32px;
    height: 54px;
`;

const HistoryItem = styled.View`
    flex-direction: row;
    align-items: center;
    padding: 12px 32px;
    min-height: 54px;
`;

const HistoryTextContainer = styled.View`
    flex: 1;
    margin-right: 12px;
`;

const HistoryIconWrapper = styled.View`
    margin-right: 12px;
`;

type SearchType = 'Audio' | 'MusicAlbum' | 'MusicArtist' | 'Playlist';

type SearchResultItem =
    | (Album   & { _type: 'MusicAlbum' })
    | (Track   & { _type: 'Audio' })
    | (Artist  & { _type: 'MusicArtist' })
    | (Playlist & { _type: 'Playlist' });

interface SearchQueryMeta {
    filters: SearchType[];
    localPlaybackOnly: boolean;
}

export default function Search() {
    const defaultStyles = useDefaultStyles();
    const offsets = useNavigationOffsets({ includeOverlay: false });
    const playTracks = usePlayTracks();

    // The committed search term — updated with a short debounce so FTS queries
    // don't fire on every single keystroke.
    const [inputValue, setInputValue] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Set<SearchType>>(new Set());
    const [localPlaybackOnly, setLocalPlaybackOnly] = useState(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const commitSearchTerm = useCallback(debounce((term: string) => {
        setSearchTerm(term);
    }, 150), []);

    useEffect(() => {
        commitSearchTerm(inputValue);
    }, [inputValue, commitSearchTerm]);

    // FTS hooks — each fires its own reactive SQLite query
    const { data: albumResults }    = useAlbumSearch(searchTerm);
    const { data: trackResults }    = useTrackSearch(searchTerm);
    const { data: artistResults }   = useArtistSearch(searchTerm);
    const { data: playlistResults } = usePlaylistSearch(searchTerm);

    // Merge all four result sets into the unified typed list, applying active
    // type filters if any are selected.
    const results = useMemo<SearchResultItem[]>(() => {
        const activeSet = activeFilters;
        const include = (type: SearchType) => activeSet.size === 0 || activeSet.has(type);

        return [
            ...(include('MusicArtist')  ? (artistResults  ?? []).map(a => ({ ...a, _type: 'MusicArtist'  as const })) : []),
            ...(include('MusicAlbum')   ? (albumResults   ?? []).map(a => ({ ...a, _type: 'MusicAlbum'   as const })) : []),
            ...(include('Audio')        ? (trackResults   ?? []).map(track => ({ ...track, _type: 'Audio' as const })) : []),
            ...(include('Playlist')     ? (playlistResults ?? []).map(p => ({ ...p, _type: 'Playlist'    as const })) : []),
        ];
    }, [albumResults, trackResults, artistResults, playlistResults, activeFilters]);

    // Search history
    const { data: searchHistoryRaw } = useSearchQueries(undefined, 10);

    const searchHistory = useMemo((): Array<{ query: string; filters: SearchType[]; localPlaybackOnly: boolean }> => {
        if (!searchHistoryRaw) return [];
        return searchHistoryRaw.map((row: SearchQuery) => {
            let meta: SearchQueryMeta = { filters: [], localPlaybackOnly: false };
            try {
                if (row.metadata) meta = row.metadata as SearchQueryMeta;
            } catch {
                // ignore malformed metadata
            }
            return {
                query: row.query,
                filters: meta.filters ?? [],
                localPlaybackOnly: meta.localPlaybackOnly ?? row.localPlaybackOnly,
            };
        });
    }, [searchHistoryRaw]);

    const navigation = useNavigation<NavigationProp>();

    /**
     * Persist the search query to history after the user has stopped typing
     * for 10 seconds — avoids storing half-typed queries.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const saveSearchToHistory = useCallback(debounce(async (
        query: string,
        filters: SearchType[],
        localOnly: boolean,
    ) => {
        if (!query.trim()) return;
        const now = Date.now();
        const meta: SearchQueryMeta = { filters, localPlaybackOnly: localOnly };

        // sourceId is required by the schema. We pick it from the first
        // available result across any type — they all belong to a valid source.
        const firstResult = (artistResults ?? [])[0] ?? (albumResults ?? [])[0]
            ?? (trackResults ?? [])[0] ?? (playlistResults ?? [])[0];
        const sourceId: string | undefined = (firstResult as any)?.sourceId;
        if (!sourceId) return;

        await upsertSearchQuery({
            sourceId,
            query: query.trim(),
            localPlaybackOnly: localOnly,
            metadata: meta,
            createdAt: now,
            updatedAt: now,
        });
    }, 10_000), [artistResults, albumResults, trackResults, playlistResults]);

    useEffect(() => {
        if (!searchTerm) return;
        saveSearchToHistory(searchTerm, Array.from(activeFilters), localPlaybackOnly);
    }, [searchTerm, activeFilters, localPlaybackOnly, saveSearchToHistory]);

    const toggleFilter = useCallback((filterType: SearchType) => {
        setActiveFilters(prev => {
            const next = new Set(prev);
            if (next.has(filterType)) {
                next.delete(filterType);
            } else {
                next.add(filterType);
            }
            return next;
        });
    }, []);

    const selectItem = useCallback(async (item: SearchResultItem) => {
        // Immediately persist when the user picks a result
        const meta: SearchQueryMeta = { filters: Array.from(activeFilters), localPlaybackOnly };
        const sourceId: string | undefined = (item as any).sourceId;
        if (sourceId && inputValue.trim()) {
            await upsertSearchQuery({
                sourceId,
                query: inputValue.trim(),
                localPlaybackOnly,
                metadata: meta,
            });
        }

        switch (item._type) {
            case 'Audio': {
                playTracks([{ ...item, download: null }], { play: true });
                const similarSongs = await retrieveInstantMixByTrackId([item.sourceId, item.id]);
                similarSongs.shift();
                playTracks(
                    similarSongs,
                    { play: false, method: 'add-to-end' },
                );
                break;
            }
            case 'MusicAlbum':
                navigation.navigate('Album', { id: [item.sourceId, item.id] });
                break;
            case 'MusicArtist':
                navigation.navigate('Artist', { id: [item.sourceId, item.id] });
                break;
            case 'Playlist':
                navigation.navigate('Playlist', { id: [item.sourceId, item.id] });
                break;
        }
    }, [navigation, playTracks, inputValue, activeFilters, localPlaybackOnly]);

    const applyHistoryItem = useCallback((
        query: string,
        filters: SearchType[],
        localOnly: boolean,
    ) => {
        setInputValue(query);
        setActiveFilters(new Set(filters));
        setLocalPlaybackOnly(localOnly);
    }, []);

    const handleClearSearch = useCallback(() => {
        saveSearchToHistory.flush();
        setInputValue('');
    }, [saveSearchToHistory]);

    const handleClearHistory = useCallback(async () => {
        await clearSearchQueries();
    }, []);

    const SearchInput = React.useMemo(() => (
        <Animated.View style={{ paddingBottom: SEARCH_INPUT_OFFSET }}>
            <Container style={[defaultStyles.border]}>
                <View>
                    <Input
                        value={inputValue}
                        onChangeText={setInputValue}
                        style={[defaultStyles.view, { marginBottom: 12 }]}
                        placeholder={t('search') + '...'}
                        icon={<SearchIcon width={14} height={14} fill={defaultStyles.textHalfOpacity.color} />}
                        testID="search-input"
                        autoCorrect={false}
                    />
                    {inputValue.length > 0 ? (
                        <ClearButton onPress={handleClearSearch} style={{ marginTop: -4 }}>
                            <XMarkIcon width={16} height={16} fill={defaultStyles.textHalfOpacity.color} />
                        </ClearButton>
                    ) : null}
                </View>
            </Container>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ paddingHorizontal: 32, paddingBottom: 12, flex: 1, flexDirection: 'row' }}>
                    <SelectableFilter
                        text="Artists"
                        icon={MicrophoneIcon}
                        active={activeFilters.has('MusicArtist')}
                        onPress={() => toggleFilter('MusicArtist')}
                    />
                    <SelectableFilter
                        text="Albums"
                        icon={AlbumIcon}
                        active={activeFilters.has('MusicAlbum')}
                        onPress={() => toggleFilter('MusicAlbum')}
                    />
                    <SelectableFilter
                        text="Tracks"
                        icon={TrackIcon}
                        active={activeFilters.has('Audio')}
                        onPress={() => toggleFilter('Audio')}
                    />
                    <SelectableFilter
                        text="Playlist"
                        icon={PlaylistIcon}
                        active={activeFilters.has('Playlist')}
                        onPress={() => toggleFilter('Playlist')}
                    />
                    <SelectableFilter
                        text="Local Playback"
                        icon={LocalIcon}
                        active={localPlaybackOnly}
                        onPress={() => setLocalPlaybackOnly(prev => !prev)}
                    />
                </View>
            </ScrollView>
        </Animated.View>
    ), [inputValue, defaultStyles, activeFilters, toggleFilter, localPlaybackOnly, handleClearSearch]);

    const insets = useSafeAreaInsets();

    const hasResults = results.length > 0;
    const isSearching = inputValue.length > 0;

    return (
        <View style={{ flex: 1, paddingTop: insets.top, marginBottom: offsets.bottom }}>
            <KeyboardAvoidingView behavior="height" style={{ flex: 1 }} keyboardVerticalOffset={KEYBOARD_OFFSET}>
                {isSearching ? (
                    <>
                        {hasResults ? (
                            <FlatList
                                keyboardShouldPersistTaps="handled"
                                style={{ flex: 2 }}
                                contentContainerStyle={{ paddingTop: offsets.top, paddingBottom: SEARCH_INPUT_HEIGHT }}
                                scrollIndicatorInsets={{ top: offsets.top / 2, bottom: offsets.bottom / 2 + 10 + SEARCH_INPUT_HEIGHT }}
                                data={results}
                                renderItem={({ item }: { item: SearchResultItem }) => (
                                    <TouchableHandler<SearchResultItem>
                                        id={item}
                                        onPress={selectItem}
                                        testID={`search-result-${item.id}`}
                                    >
                                        <SearchResult>
                                            <ShadowWrapper>
                                                <SearchItemImage
                                                    source={{ uri: Artwork.getUrl(item) }}
                                                    style={defaultStyles.imageBackground}
                                                />
                                            </ShadowWrapper>
                                            <View style={{ flex: 1 }}>
                                                <Text numberOfLines={1}>{item.name}</Text>
                                                <HalfOpacity style={defaultStyles.text} numberOfLines={1}>
                                                    {item._type === 'MusicAlbum' ? (
                                                        <>
                                                            <AlbumIcon width={12} height={12} fill={defaultStyles.textHalfOpacity.color} />
                                                            {' '}{t('album')}{' • '}
                                                            {item.albumArtist}
                                                        </>
                                                    ) : null}
                                                    {item._type === 'Audio' ? (
                                                        <>
                                                            <TrackIcon width={12} height={12} fill={defaultStyles.textHalfOpacity.color} />
                                                            {' '}{t('track')}{' • '}
                                                            {item.albumArtist}
                                                            {' — '}
                                                            {item.album}
                                                        </>
                                                    ) : null}
                                                    {item._type === 'MusicArtist' ? (
                                                        <>
                                                            <MicrophoneIcon width={12} height={12} fill={defaultStyles.textHalfOpacity.color} />
                                                            {' '}{t('artist')}
                                                        </>
                                                    ) : null}
                                                    {item._type === 'Playlist' ? (
                                                        <>
                                                            <PlaylistIcon width={12} height={12} fill={defaultStyles.textHalfOpacity.color} />
                                                            {' '}{t('playlist')}
                                                        </>
                                                    ) : null}
                                                </HalfOpacity>
                                            </View>

                                            <View style={{ marginLeft: 16 }}>
                                                <ChevronRight width={14} height={14} fill={defaultStyles.textQuarterOpacity.color} />
                                            </View>
                                        </SearchResult>
                                    </TouchableHandler>
                                )}
                                keyExtractor={item => `${item._type}-${item.id}`}
                                extraData={activeFilters}
                            />
                        ) : (
                            <FullSizeContainer style={{ paddingTop: offsets.top + SEARCH_INPUT_HEIGHT }}>
                                <Text style={{ textAlign: 'center', opacity: 0.5, fontSize: 18 }}>{t('no-results')}</Text>
                            </FullSizeContainer>
                        )}
                    </>
                ) : searchHistory.length > 0 ? (
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ paddingTop: offsets.top, paddingBottom: SEARCH_INPUT_HEIGHT }}
                    >
                        <View style={{ paddingTop: 20, paddingBottom: 10, paddingHorizontal: 32 }}>
                            <SubHeader>{t('recent-searches')}</SubHeader>
                        </View>
                        {searchHistory.map((item, index) => (
                            <TouchableHandler
                                key={index}
                                id={item}
                                onPress={() => applyHistoryItem(item.query, item.filters, item.localPlaybackOnly)}
                            >
                                <HistoryItem>
                                    <HistoryIconWrapper>
                                        <SearchIcon
                                            width={18}
                                            height={18}
                                            fill={defaultStyles.textHalfOpacity.color}
                                        />
                                    </HistoryIconWrapper>
                                    <HistoryTextContainer>
                                        <Text numberOfLines={1} style={{ fontSize: 16 }}>
                                            {item.query}
                                        </Text>
                                        {(item.filters.length > 0 || item.localPlaybackOnly) ? (
                                            <HalfOpacity style={defaultStyles.text} numberOfLines={1}>
                                                {item.filters.length > 0
                                                    ? item.filters.map(f => {
                                                        switch (f) {
                                                            case 'MusicArtist': return 'Artists';
                                                            case 'MusicAlbum': return 'Albums';
                                                            case 'Audio': return 'Tracks';
                                                            case 'Playlist': return 'Playlist';
                                                        }
                                                    }).join(', ')
                                                    : null}
                                                {item.filters.length > 0 && item.localPlaybackOnly ? ' • ' : null}
                                                {item.localPlaybackOnly ? 'Local Playback' : null}
                                            </HalfOpacity>
                                        ) : null}
                                    </HistoryTextContainer>
                                </HistoryItem>
                            </TouchableHandler>
                        ))}
                        <View style={{ paddingHorizontal: 32, paddingTop: 12 }}>
                            <Button title={t('clear-history')} icon={TrashIcon} onPress={handleClearHistory} />
                        </View>
                    </ScrollView>
                ) : (
                    <View style={{ flex: 1 }} />
                )}
                {SearchInput}
            </KeyboardAvoidingView>
        </View>
    );
}
