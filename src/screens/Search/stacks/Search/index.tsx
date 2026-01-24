import React, { useState, useEffect, useCallback, useMemo } from 'react';
import debounce from 'lodash/debounce';
import Input from '@/components/Input';
import { ActivityIndicator, Animated, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import styled from 'styled-components/native';

import { AppState, useAppDispatch, useTypedSelector } from '@/store';
import Fuse, { IFuseOptions } from 'fuse.js';
import { Album, AlbumTrack, MusicArtist, Playlist } from '@/store/music/types';
import { addSearchQuery, clearSearchHistory } from '@/store/search';

import { FlatList } from 'react-native-gesture-handler';
import TouchableHandler from '@/components/TouchableHandler';
import { useNavigation } from '@react-navigation/native';
import { useGetImage } from '@/utility/JellyfinApi/lib';
import { t } from '@/localisation';
import useDefaultStyles, { ColoredBlurView } from '@/components/Colors';
import { searchAndFetch } from '@/store/music/actions';
import { Text } from '@/components/Typography';
import DownloadIcon from '@/components/DownloadIcon';
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
import { retrieveInstantMixByTrackId } from '@/utility/JellyfinApi/playlist';

const KEYBOARD_OFFSET = Platform.select({
    ios: 0,
    // Android 15+ has edge-to-edge support, changing the keyboard offset to 0
    android: Number.parseInt(Platform.Version as string) >= 35 ? 0 : 72,
});
const SEARCH_INPUT_HEIGHT = 104;

const Container = styled(View)`
    padding: 4px 24px 0 24px;
    margin-bottom: 0px;
    padding-bottom: 0px;
    border-top-width: 0.5px;
`;

const FullSizeContainer = styled.View`
    flex: 1;
`;

const Loading = styled.View`
    position: absolute;
    right: 12px;
    top: 0;
    height: 100%;
    flex: 1;
    justify-content: center;
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

const fuseOptions: IFuseOptions<Album | AlbumTrack | MusicArtist | Playlist> = {
    keys: [
        {
            name: 'Name',
            weight: 5
        },
        {
            name: 'AlbumArtist',
            weight: 0.7
        },
        {
            name: 'AlbumArtists',
            weight: 0.7
        },
        {
            name: 'Artists',
            weight: 0.7
        }
    ],
    threshold: 0.1,
    includeScore: true
};

type SearchType = 'Audio' | 'MusicAlbum' | 'MusicArtist' | 'Playlist';

interface SearchResult {
    type: SearchType;
    id: string;
    name: string;
    album?: string;
}

type SearchItem = Album | AlbumTrack | MusicArtist | Playlist;

const albumSelector = (state: AppState) => state.music.albums.entities;
const tracksSelector = (state: AppState) => state.music.tracks.entities;
const artistsSelector = (state: AppState) => state.music.artists.entities;
const playlistsSelector = (state: AppState) => state.music.playlists.entities;
const downloadsSelector = (state: AppState) => state.downloads.entities;
const searchHistorySelector = (state: AppState) => state.search.queryHistory;

export default function Search() {
    const defaultStyles = useDefaultStyles();
    const offsets = useNavigationOffsets({ includeOverlay: false });
    const playTracks = usePlayTracks();

    // Prepare state for fuse and albums
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setLoading] = useState(false);
    const [fuseResults, setFuseResults] = useState<SearchResult[]>([]);
    const [activeFilters, setActiveFilters] = useState<Set<SearchType>>(new Set());
    const [localPlaybackOnly, setLocalPlaybackOnly] = useState(false);

    const albumEntities: Record<string, Album> = useTypedSelector(albumSelector);
    const trackEntities: Record<string, AlbumTrack> = useTypedSelector(tracksSelector);
    const artistEntities: Record<string, MusicArtist> = useTypedSelector(artistsSelector);
    const playlistEntities: Record<string, Playlist> = useTypedSelector(playlistsSelector);
    const downloadEntities = useTypedSelector(downloadsSelector);
    const searchHistory = useTypedSelector(searchHistorySelector);

    // Prepare helpers
    const navigation = useNavigation<NavigationProp>();
    const getImage = useGetImage();
    const dispatch = useAppDispatch();

    /**
     * This function retrieves search results from Jellyfin. It is a seperate
     * callback, so that we can make sure it is properly debounced and doesn't
     * cause execessive jank in the interface.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const fetchJellyfinResults = useCallback(debounce(async (searchTerm: string) => {
        await dispatch(searchAndFetch({ term: searchTerm }));

        // Loading is now complete
        setLoading(false);
    }, 150), [dispatch]);

    /**
     * Debounced function to save search query to history after 10 seconds
     * to avoid saving incomplete searches
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const saveSearchToHistory = useCallback(debounce((query: string, filters: SearchType[], localOnly: boolean) => {
        dispatch(addSearchQuery({
            query,
            filters,
            localPlaybackOnly: localOnly,
        }));
    }, 10_000), [dispatch]);

    
    const searchItems = useMemo(() => ({
        ...albumEntities,
        ...trackEntities,
        ...artistEntities,
        ...playlistEntities
    }), [albumEntities, trackEntities, artistEntities, playlistEntities]);

    /**
     * Since it is impractical to have a global fuse variable, we need to
     * instantiate it for thsi function. With this effect, we generate a new
     * Fuse instance every time the albums change. This can of course be done
     * more intelligently by removing and adding the changed albums, but this is
     * an open todo.
     */
    const fuse = useMemo(
        () => new Fuse(Object.values(searchItems) as SearchItem[], fuseOptions),
        [searchItems]
    );

    /**
     * Whenever the search term changes, we gather results from Fuse and assign
     * them to state
     */
    useEffect(() => {
        if (!searchTerm) {
            return;
        }

        const retrieveResults = async () => {
            const searchTermTrimmed = searchTerm.trim();

            // First set the immediate results from fuse
            const fuseResults = fuse.search(searchTermTrimmed);
            let results: SearchResult[] = fuseResults
                .map(({ item }) => ({
                    id: item.Id,
                    type: item.Type as SearchType,
                    album: (item as AlbumTrack)?.Album,
                    name: item.Name,
                }));
            
            // Apply active filters (no filters active = all active)
            if (activeFilters.size > 0) {
                results = results.filter(result => activeFilters.has(result.type));
            }
            
            // Apply local playback filter
            if (localPlaybackOnly) {
                results = results.filter(result => {
                    const item = searchItems[result.id];
                    if (!item) return false;
                    
                    switch (result.type) {
                        case 'Audio':
                            // For tracks, check if downloaded
                            return downloadEntities[result.id]?.isComplete === true;
                        case 'MusicAlbum':
                            // For albums, check if any tracks are downloaded
                            return (item as Album).Tracks?.some(trackId => 
                                downloadEntities[trackId]?.isComplete === true
                            ) ?? false;
                        case 'MusicArtist':
                            // For artists, check if any of their tracks are downloaded
                            return Object.values(trackEntities)
                                .filter(track => track.ArtistItems?.some(artist => artist.Id === result.id))
                                .some(track => downloadEntities[track.Id]?.isComplete === true);
                        case 'Playlist':
                            // For playlists, check if any tracks are downloaded
                            return (item as Playlist).Tracks?.some(trackId => 
                                downloadEntities[trackId]?.isComplete === true
                            ) ?? false;
                        default:
                            return false;
                    }
                });
            }
            
            // Assign the preliminary results
            setFuseResults(results);
            setLoading(true);
            
            // Save search query to history after 10 seconds (debounced)
            saveSearchToHistory(searchTermTrimmed, Array.from(activeFilters), localPlaybackOnly);
            
            try {
                // Wrap the call in a try/catch block so that we catch any
                // network issues in search and just use local search if the
                // network is unavailable
                fetchJellyfinResults(searchTermTrimmed);
            } catch {
                // Reset the loading indicator if the network fails
                setLoading(false);
            }
        };

        retrieveResults();
    }, [searchTerm, setFuseResults, setLoading, fuse, fetchJellyfinResults, albumEntities, trackEntities, artistEntities, playlistEntities, activeFilters, localPlaybackOnly, downloadEntities, searchItems, saveSearchToHistory]);

    // Handlers
    const toggleFilter = useCallback((filterType: SearchType) => {
        setActiveFilters(prev => {
            const newFilters = new Set(prev);
            if (newFilters.has(filterType)) {
                newFilters.delete(filterType);
            } else {
                newFilters.add(filterType);
            }
            return newFilters;
        });
    }, []);

    const selectItem = useCallback(async ({ id, type }: { id: string; type: SearchType; }) => {
        // Save search query immediately when user selects a result
        dispatch(addSearchQuery({
            query: searchTerm.trim(),
            filters: Array.from(activeFilters),
            localPlaybackOnly,
        }));

        switch (type) {
            case 'Audio': {
                playTracks([id], { play: true });
                const similarSongs = await retrieveInstantMixByTrackId(id);

                // Remove the first from the list, because it is the same as the currently selected song.
                similarSongs.shift();
                playTracks(similarSongs.map(item => item.Id), { play: false, method: 'add-to-end' });
                break;
            }
            case 'MusicAlbum':
                navigation.navigate('Album', { id, album: searchItems?.[id] as Album });
                break;
            case 'MusicArtist':
                {
                    const { Name: name } = searchItems[id];
                    navigation.navigate('Artist', { id, name });
                }
                break;
            case 'Playlist':
                navigation.navigate('Playlist', { id });
                break;
        }
    }, [navigation, searchItems, dispatch, playTracks, searchTerm, activeFilters, localPlaybackOnly]);

    const applyHistoryItem = useCallback((query: string, filters: SearchType[], localOnly: boolean) => {
        setSearchTerm(query);
        setActiveFilters(new Set(filters));
        setLocalPlaybackOnly(localOnly);
    }, []);

    const handleClearSearch = useCallback(() => {
        saveSearchToHistory(searchTerm.trim(), Array.from(activeFilters), localPlaybackOnly);
        setSearchTerm('');
    }, [searchTerm, activeFilters, localPlaybackOnly, saveSearchToHistory]);

    const handleClearHistory = useCallback(() => {
        dispatch(clearSearchHistory());
    }, [dispatch]);

    const SearchInput = React.useMemo(() => (
        <Animated.View>
            <ColoredBlurView>
                <Container style={[ defaultStyles.border ]}>
                    <View>
                        <Input
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                            style={[defaultStyles.view, { marginBottom: 12 }]}
                            placeholder={t('search') + '...'}
                            icon={<SearchIcon width={14} height={14} fill={defaultStyles.textHalfOpacity.color} />}
                            testID="search-input"
                            autoCorrect={false}
                        />
                        {searchTerm.length > 0 && !isLoading ? (
                            <ClearButton onPress={handleClearSearch} style={{ marginTop: -4 }}>
                                <XMarkIcon width={16} height={16} fill={defaultStyles.textHalfOpacity.color} />
                            </ClearButton>
                        ) : null}
                        {isLoading ? <Loading style={{ marginTop: -4 }}><ActivityIndicator /></Loading> : null}
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
            </ColoredBlurView>
        </Animated.View>
    ), [searchTerm, setSearchTerm, defaultStyles, isLoading, activeFilters, toggleFilter, localPlaybackOnly, handleClearSearch]);

    const insets = useSafeAreaInsets();

    return (
        <View style={{ flex: 1, paddingTop: insets.top, marginBottom: offsets.bottom }}>
            <KeyboardAvoidingView behavior="height" style={{ flex: 1 }} keyboardVerticalOffset={KEYBOARD_OFFSET}>
                {searchTerm ? (
                    <FlatList
                        keyboardShouldPersistTaps="handled"
                        style={{ flex: 2, }}
                        contentContainerStyle={{ paddingTop: offsets.top, paddingBottom: SEARCH_INPUT_HEIGHT }}
                        scrollIndicatorInsets={{ top: offsets.top  / 2, bottom: offsets.bottom / 2 + 10 + SEARCH_INPUT_HEIGHT }}
                        data={fuseResults}
                        renderItem={({ item: { id, type, name } }: { item: SearchResult }) => {
                            const searchItem = searchItems?.[id];

                            // GUARD: If the album cannot be found in the store, we
                            // cannot display it.
                            if (!searchItem) {
                                return null;
                            }

                            return (
                                <TouchableHandler<{ id: string; type: SearchType; }> id={{ id, type }} onPress={selectItem} testID={`search-result-${id}`}>
                                    <SearchResult>
                                        <ShadowWrapper>
                                            <SearchItemImage source={{ uri: getImage(searchItem) }} style={defaultStyles.imageBackground} />
                                        </ShadowWrapper>
                                        <View style={{ flex: 1 }}>
                                            <Text numberOfLines={1}>
                                                {name}
                                            </Text>
                                            <HalfOpacity style={defaultStyles.text} numberOfLines={1}>
                                                { type === 'MusicAlbum' ? 
                                                    <>
                                                        <AlbumIcon width={12} height={12} fill={defaultStyles.textHalfOpacity.color} />
                                                        {' '}
                                                        {t('album')}
                                                        {' • '}
                                                        {(searchItem as Album)?.AlbumArtist}
                                                    </>
                                                    : null 
                                                }
                                                { type === 'Audio' ? 
                                                    <>
                                                        <TrackIcon width={12} height={12} fill={defaultStyles.textHalfOpacity.color} />
                                                        {' '}
                                                        {t('track')}
                                                        {' • '}
                                                        {(searchItem as AlbumTrack)?.AlbumArtist}
                                                        {' — '}
                                                        {searchItem?.Name}
                                                    </>
                                                    : null
                                                }
                                                { type === 'MusicArtist' ? 
                                                    <>
                                                        <MicrophoneIcon width={12} height={12} fill={defaultStyles.textHalfOpacity.color} />
                                                        {' '}
                                                        {t('artist')}
                                                    </>
                                                    : null
                                                }
                                                { type === 'Playlist' ? 
                                                    <>
                                                        <PlaylistIcon width={12} height={12} fill={defaultStyles.textHalfOpacity.color} />
                                                        {' '}
                                                        {t('playlist')}
                                                    </>
                                                    : null
                                                }
                                            </HalfOpacity>
                                        </View>
                                        { type === 'Audio' ?
                                            <View style={{ marginLeft: 16 }}>
                                                <DownloadIcon trackId={id} />
                                            </View>
                                            : null
                                        }
                                        <View style={{ marginLeft: 16 }}>
                                            <ChevronRight width={14} height={14} fill={defaultStyles.textQuarterOpacity.color}  />
                                        </View>
                                    </SearchResult>
                                </TouchableHandler>
                            );
                        }}
                        keyExtractor={(item) => item.id}
                        extraData={[searchTerm, searchItems, activeFilters]}
                    />
                ) : searchHistory.length > 0 ? (
                    <ScrollView 
                        style={{ flex: 1 }} 
                        contentContainerStyle={{ paddingTop: offsets.top, paddingBottom: SEARCH_INPUT_HEIGHT }}
                    >
                        <View style={{ paddingTop: 20, paddingBottom: 10, paddingHorizontal: 32 }}>
                            <Text style={{ ...defaultStyles.text, fontSize: 18, letterSpacing: -0.25 }}>
                                {t('recent-searches')}
                            </Text>
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
                                                {item.filters.length > 0 ? item.filters.map(f => {
                                                    switch (f) {
                                                        case 'MusicArtist': return 'Artists';
                                                        case 'MusicAlbum': return 'Albums';
                                                        case 'Audio': return 'Tracks';
                                                        case 'Playlist': return 'Playlist';
                                                    }
                                                }).join(', ') : null}
                                                {item.filters.length > 0 ? item.localPlaybackOnly ? ' • ' : null : null}
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
                ) : null}
                {(searchTerm.length && !fuseResults.length && !isLoading) ? (
                    <FullSizeContainer>
                        <Text style={{ textAlign: 'center', opacity: 0.5, fontSize: 18 }}>{t('no-results')}</Text> 
                    </FullSizeContainer>
                ) : null}
                {SearchInput}
            </KeyboardAvoidingView>
        </View>
    );
}
