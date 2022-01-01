import React, { useState, useEffect, useRef, useCallback } from 'react';
import Input from 'components/Input';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import styled from 'styled-components/native';
import { useAppDispatch, useTypedSelector } from 'store';
import Fuse from 'fuse.js';
import { Album, AlbumTrack } from 'store/music/types';
import { FlatList } from 'react-native-gesture-handler';
import TouchableHandler from 'components/TouchableHandler';
import { useNavigation } from '@react-navigation/native';
import { useGetImage } from 'utility/JellyfinApi';
import { MusicNavigationProp } from '../types';
import FastImage from 'react-native-fast-image';
import { t } from '@localisation';
import useDefaultStyles from 'components/Colors';
import { searchAndFetchAlbums } from 'store/music/actions';
import { debounce } from 'lodash';

const Container = styled.View`
    padding: 0 20px;
    position: relative;
`;

const FullSizeContainer = styled(Container)`
    flex: 1;
`;

const Loading = styled.View`
    position: absolute;
    right: 32px;
    top: 0;
    height: 100%;
    flex: 1;
    justify-content: center;
`;

const AlbumImage = styled(FastImage)`
    border-radius: 4px;
    width: 25px;
    height: 25px;
    margin-right: 10px;
`;

const HalfOpacity = styled.Text`
    opacity: 0.5;
    margin-top: 2px;
    font-size: 12px;
`;

const SearchResult = styled.View`
    flex-direction: row;
    align-items: center;
    border-bottom-width: 1px;
    margin-left: 15px;
    padding-right: 15px;
    height: 50px;
`;

const fuseOptions = {
    keys: ['Name', 'AlbumArtist', 'AlbumArtists', 'Artists'],
    threshold: 0.1,
    includeScore: true,
};

type AudioResult = {
    type: 'Audio',
    id: string;
    album: string;
    name: string;
};

type AlbumResult = {
    type: 'AlbumArtist',
    id: string;
    album: undefined;
    name: undefined;
}

type CombinedResults = (AudioResult | AlbumResult)[];

export default function Search() {
    const defaultStyles = useDefaultStyles();

    // Prepare state
    const [fuseIsReady, setFuseReady] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setLoading] = useState(false);
    const [fuseResults, setFuseResults] = useState<CombinedResults>([]);
    const [jellyfinResults, setJellyfinResults] = useState<CombinedResults>([]);

    const albums = useTypedSelector(state => state.music.albums.entities);

    const fuse = useRef<Fuse<Album>>();
    const searchElement = useRef<TextInput>(null);

    // Prepare helpers
    const navigation = useNavigation<MusicNavigationProp>();
    const getImage = useGetImage();
    const dispatch = useAppDispatch();

    /**
     * Since it is impractical to have a global fuse variable, we need to
     * instantiate it for thsi function. With this effect, we generate a new
     * Fuse instance every time the albums change. This can of course be done
     * more intelligently by removing and adding the changed albums, but this is
     * an open todo.
     */
    useEffect(() => {
        fuse.current = new Fuse(Object.values(albums) as Album[], fuseOptions);
        setFuseReady(true);
    }, [albums, setFuseReady]);

    /**
     * This function retrieves search results from Jellyfin. It is a seperate
     * callback, so that we can make sure it is properly debounced and doesn't
     * cause execessive jank in the interface.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const fetchJellyfinResults = useCallback(debounce(async (searchTerm: string, currentResults: CombinedResults) => {
        // First, query the Jellyfin API
        const { payload } = await dispatch(searchAndFetchAlbums({ term: searchTerm }));

        // Convert the current results to album ids
        const albumIds = currentResults.map(item => item.id);

        // Parse the result in correct typescript form
        const results = (payload as { results: (Album | AlbumTrack)[] }).results;

        // Filter any results that are already displayed
        const items = results.filter(item => (
            !(item.Type === 'MusicAlbum' && albumIds.includes(item.Id))
        // Then convert the results to proper result form
        )).map((item) => ({
            type: item.Type,
            id: item.Id,
            album: item.Type === 'Audio'
                ? item.AlbumId
                : undefined,
            name: item.Type === 'Audio'
                ? item.Name
                : undefined,
        }));

        // Lastly, we'll merge the two and assign them to the state
        setJellyfinResults([...items] as CombinedResults);

        // Loading is now complete
        setLoading(false);
    }, 50), [dispatch, setJellyfinResults]);

    /**
     * Whenever the search term changes, we gather results from Fuse and assign
     * them to state
     */
    useEffect(() => {
        if (!searchTerm) {
            return;
        }

        const retrieveResults = async () => {
            // GUARD: In some extraordinary cases, Fuse might not be presented since
            // it is assigned via refs. In this case, we can't handle any searching.
            if (!fuse.current) {
                return;
            }

            // First set the immediate results from fuse
            const fuseResults = fuse.current.search(searchTerm);
            const albums: AlbumResult[] = fuseResults
                .map(({ item }) => ({ 
                    id: item.Id,
                    type: 'AlbumArtist',
                    album: undefined,
                    name: undefined,
                }));
            
            // Assign the preliminary results
            setFuseResults(albums);
            setLoading(true);
            try {
                // Wrap the call in a try/catch block so that we catch any
                // network issues in search and just use local search if the
                // network is unavailable
                fetchJellyfinResults(searchTerm, albums);
            } catch {
                // Reset the loading indicator if the network fails
                setLoading(false);
            }
        };

        retrieveResults();
    }, [searchTerm, setFuseResults, setLoading, fuse, fetchJellyfinResults]);

    // Automatically focus on the text input on mount
    useEffect(() => {
        // Give the timeout a slight delay so the component has a chance to actually
        // render the text input field.
        setTimeout(() => searchElement.current?.focus(), 10);
    }, []);

    // Handlers
    const selectAlbum = useCallback((id: string) => 
        navigation.navigate('Album', { id, album: albums[id] as Album }), [navigation, albums]
    );

    const HeaderComponent = React.useMemo(() => (
        <Container>
            <Input
                ref={searchElement}
                value={searchTerm}
                onChangeText={setSearchTerm}
                style={defaultStyles.input}
                placeholder={t('search') + '...'}
            />
            {isLoading && <Loading><ActivityIndicator /></Loading>}
        </Container>
    ), [searchTerm, setSearchTerm, defaultStyles, isLoading]);

    // const FooterComponent = React.useMemo(() => (
    //     <FullSizeContainer>
    //         {(searchTerm.length && !jellyfinResults.length && !fuseResults.length && !isLoading)
    //             ? <Text style={{ textAlign: 'center', opacity: 0.5 }}>{t('no-results')}</Text> 
    //             : null}
    //     </FullSizeContainer>
    // ), [searchTerm, jellyfinResults, fuseResults, isLoading]);

    // GUARD: We cannot search for stuff unless Fuse is loaded with results.
    // Therefore we delay rendering to when we are certain it's there.
    if (!fuseIsReady) {
        return null;
    }

    return (
        <>
            <FlatList
                style={{ flex: 1 }}
                data={[...jellyfinResults, ...fuseResults]}
                renderItem={({ item: { id, type, album: trackAlbum, name: trackName } }: { item: AlbumResult | AudioResult }) => {
                    const album = albums[trackAlbum || id];

                    // GUARD: If the album cannot be found in the store, we
                    // cannot display it.
                    if (!album) {
                        return null;
                    }

                    return (
                        <TouchableHandler<string> id={album.Id} onPress={selectAlbum}>
                            <SearchResult style={defaultStyles.border}>
                                <AlbumImage source={{ uri: getImage(album.Id) }} />
                                <View>
                                    <Text numberOfLines={1} ellipsizeMode="tail" style={defaultStyles.text}>
                                        {trackName || album.Name} - {album.AlbumArtist}
                                    </Text>
                                    <HalfOpacity style={defaultStyles.text}>
                                        {type === 'AlbumArtist' ? t('album'): t('track')}
                                    </HalfOpacity>
                                </View>
                            </SearchResult>
                        </TouchableHandler>
                    );
                }}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={HeaderComponent}
                // ListFooterComponent={FooterComponent}
                extraData={[searchTerm, albums]}
            />
            <FullSizeContainer>
                {(searchTerm.length && !jellyfinResults.length && !fuseResults.length && !isLoading)
                    ? <Text style={{ textAlign: 'center', opacity: 0.5, fontSize: 18 }}>{t('no-results')}</Text> 
                    : null}
            </FullSizeContainer>
        </>
    );
}