import React, { useState, useEffect, useCallback, useMemo } from 'react';
import debounce from 'lodash/debounce';
import Input from '@/components/Input';
import { ActivityIndicator, Animated, KeyboardAvoidingView, Platform, SafeAreaView, View } from 'react-native';
import styled from 'styled-components/native';

import { AppState, useAppDispatch, useTypedSelector } from '@/store';
import Fuse, { IFuseOptions } from 'fuse.js';
import { Album, AlbumTrack, MusicArtist, Playlist } from '@/store/music/types';

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
// import MicrophoneIcon from '@/assets/icons/microphone.svg';
// import AlbumIcon from '@/assets/icons/collection.svg';
// import TrackIcon from '@/assets/icons/note.svg';
// import PlaylistIcon from '@/assets/icons/note-list.svg';
// import StreamIcon from '@/assets/icons/cloud.svg';
// import LocalIcon from '@/assets/icons/internal-drive.svg';
// import SelectableFilter from './components/SelectableFilter';

const KEYBOARD_OFFSET = Platform.select({
    ios: 0,
    android: 72,
});
const SEARCH_INPUT_HEIGHT = 62;

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

type AudioResult = {
    type: 'Audio';
    id: string;
    album: string;
    name: string;
};

type AlbumResult = {
    type: 'Album';
    id: string;
    album: undefined;
    name: string;
}

type MusicArtistResult = {
    type: 'MusicArtist';
    id: string;
    album: undefined;
    name: string;
}

type PlaylistResult = {
    type: 'Playlist';
    id: string;
    album: undefined;
    name: string;
}

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

export default function Search() {
    const defaultStyles = useDefaultStyles();
    const offsets = useNavigationOffsets({ includeOverlay: false });

    // Prepare state for fuse and albums
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setLoading] = useState(false);
    const [fuseResults, setFuseResults] = useState<SearchResult[]>([]);

    const albumEntities: Record<string, Album> = useTypedSelector(albumSelector);
    const tracksEntities: Record<string, AlbumTrack> = useTypedSelector(tracksSelector);
    const artistsEntities: Record<string, MusicArtist> = useTypedSelector(artistsSelector);
    const playlistsEntities: Record<string, Playlist> = useTypedSelector(playlistsSelector);

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

    
    const searchItems = useMemo(() => ({
        ...albumEntities,
        ...tracksEntities,
        ...artistsEntities,
        ...playlistsEntities
    }), [albumEntities, tracksEntities, artistsEntities, playlistsEntities, fetchJellyfinResults]);

    /**
     * Since it is impractical to have a global fuse variable, we need to
     * instantiate it for thsi function. With this effect, we generate a new
     * Fuse instance every time the albums change. This can of course be done
     * more intelligently by removing and adding the changed albums, but this is
     * an open todo.
     */
    const fuse = useMemo(
        () => new Fuse(Object.values(searchItems) as SearchItem[], fuseOptions),
        [searchItems, fetchJellyfinResults]
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
            const results: SearchResult[] = fuseResults
                .map(({ item }) => ({
                    id: item.Id,
                    type: item.Type as SearchType,
                    album: (item as AlbumTrack)?.Album,
                    name: item.Name,
                }));
            
            // Assign the preliminary results
            setFuseResults(results);
            setLoading(true);
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
    }, [searchTerm, setFuseResults, setLoading, fuse, fetchJellyfinResults, albumEntities, tracksEntities, artistsEntities, playlistsEntities]);

    // Handlers
    const selectItem = useCallback(({ id, type }: { id: string; type: SearchType; }) => {
        switch (type) {
            case 'Audio':
                navigation.navigate('Playlist', { id, isMix: true });
                break;
            case 'MusicAlbum':
                navigation.navigate('Album', { id, album: searchItems?.[id] as Album });
                break;
            case 'MusicArtist':
                {
                    const { Name, Id } = searchItems?.[id] as MusicArtist;
                    const albumIds = [];

                    for (const album of Object.values(albumEntities) as Album[]) {
                        if (album.ArtistItems.find(item => item.Id === Id)) {
                            albumIds.push(album.Id);
                        }
                    }

                    navigation.navigate('Artist', { Name, Id, albumIds });
                
                }
                break;
            case 'Playlist':
                navigation.navigate('Playlist', { id });
                break;
        }
    }, [navigation, albumEntities]);

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
                        {isLoading && <Loading style={{ marginTop: -4 }}><ActivityIndicator /></Loading>}
                    </View>
                </Container>
                {/* <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ paddingHorizontal: 32, paddingBottom: 12, flex: 1, flexDirection: 'row' }}>
                        <SelectableFilter
                            text="Artists"
                            icon={MicrophoneIcon}
                            active
                        />
                        <SelectableFilter
                            text="Albums"
                            icon={AlbumIcon}
                            active={false}
                        />
                        <SelectableFilter
                            text="Tracks"
                            icon={TrackIcon}
                            active={false}
                        />
                        <SelectableFilter
                            text="Playlist"
                            icon={PlaylistIcon}
                            active={false}
                        />
                        <SelectableFilter
                            text="Streaming"
                            icon={StreamIcon}
                            active={false}
                        />
                        <SelectableFilter
                            text="Local Playback"
                            icon={LocalIcon}
                            active={false}
                        />
                    </View>
                </ScrollView> */}
            </ColoredBlurView>
        </Animated.View>
    ), [searchTerm, setSearchTerm, defaultStyles, isLoading]);

    return (
        <SafeAreaView style={{ flex: 1, marginBottom: offsets.bottom }}>
            <KeyboardAvoidingView behavior="height" style={{ flex: 1 }} keyboardVerticalOffset={KEYBOARD_OFFSET}>
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
                                        <SearchItemImage source={{ uri: getImage(id) }} style={defaultStyles.imageBackground} />
                                    </ShadowWrapper>
                                    <View style={{ flex: 1 }}>
                                        <Text numberOfLines={1}>
                                            {name}
                                        </Text>
                                        <HalfOpacity style={defaultStyles.text} numberOfLines={1}>
                                            { type === 'MusicAlbum' ? `${t('album')} • ${(searchItem as Album)?.AlbumArtist}` : null }
                                            { type === 'Audio' ? `${t('track')} • ${(searchItem as AlbumTrack)?.AlbumArtist} — ${searchItem?.Name}` : null }
                                            { type === 'MusicArtist' ? `${t('artist')}` : null }
                                            { type === 'Playlist' ? `${t('playlist')}` : null }
                                        </HalfOpacity>
                                    </View>
                                    <View style={{ marginLeft: 16 }}>
                                        <DownloadIcon trackId={id} />
                                    </View>
                                    <View style={{ marginLeft: 16 }}>
                                        <ChevronRight width={14} height={14} fill={defaultStyles.textQuarterOpacity.color}  />
                                    </View>
                                </SearchResult>
                            </TouchableHandler>
                        );
                    }}
                    keyExtractor={(item) => item.id}
                    extraData={[searchTerm, searchItems]}
                />
                {(searchTerm.length && !fuseResults.length && !isLoading) ? (
                    <FullSizeContainer>
                        <Text style={{ textAlign: 'center', opacity: 0.5, fontSize: 18 }}>{t('no-results')}</Text> 
                    </FullSizeContainer>
                ) : null}
                {SearchInput}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
