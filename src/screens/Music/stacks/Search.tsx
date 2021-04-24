import React, { useState, useEffect, useRef, useCallback } from 'react';
import Input from 'components/Input';
import { Text, View } from 'react-native';
import styled from 'styled-components/native';
import { useAppDispatch, useTypedSelector } from 'store';
import Fuse from 'fuse.js';
import { Album, AlbumTrack } from 'store/music/types';
import { FlatList } from 'react-native-gesture-handler';
import TouchableHandler from 'components/TouchableHandler';
import { useNavigation } from '@react-navigation/native';
import { useGetImage } from 'utility/JellyfinApi';
import { NavigationProp } from '../types';
import FastImage from 'react-native-fast-image';
import { t } from '@localisation';
import useDefaultStyles from 'components/Colors';
import { searchAndFetchAlbums } from 'store/music/actions';

const Container = styled.View`
    padding: 0 20px;
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
    const [searchTerm, setSearchTerm] = useState('');
    const albums = useTypedSelector(state => state.music.albums.entities);
    const [results, setResults] = useState<CombinedResults>([]);
    // const [isLoading, setLoading] = useState(false);
    const fuse = useRef<Fuse<Album>>();

    // Prepare helpers
    const navigation = useNavigation<NavigationProp>();
    const getImage = useGetImage();
    const credentials = useTypedSelector(state => state.settings.jellyfin);
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
    }, [albums]);

    /**
     * Whenever the search term changes, we gather results from Fuse and assign
     * them to state
     */
    useEffect(() => {
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
            const albumIds = fuseResults.map(({ item }) => item.Id);
            
            // Assign the preliminary results
            setResults(albums);

            // Then query the Jellyfin API
            const { payload } = await dispatch(searchAndFetchAlbums({ term: searchTerm }));

            const items = (payload as 
                { results: (Album | AlbumTrack)[] }
            ).results.filter(item => (
                !(item.Type === 'MusicAlbum' && albumIds.includes(item.Id))
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

            // Then add those to the results
            // console.log(results, items);
            setResults([...albums, ...items] as CombinedResults);
        };

        retrieveResults();
    }, [searchTerm, setResults, fuse, credentials, dispatch]);

    // Handlers
    const selectAlbum = useCallback((id: string) => 
        navigation.navigate('Album', { id, album: albums[id] as Album }), [navigation, albums]
    );

    const HeaderComponent = React.useMemo(() => (
        <Container>
            <Input value={searchTerm} onChangeText={setSearchTerm} style={defaultStyles.input} placeholder={t('search') + '...'} />
            {(searchTerm.length && !results.length)
                ? <Text style={{ textAlign: 'center' }}>{t('no-results')}</Text> 
                : null}
        </Container>
    ), [searchTerm, results, setSearchTerm, defaultStyles]);

    // GUARD: We cannot search for stuff unless Fuse is loaded with results.
    // Therefore we delay rendering to when we are certain it's there.
    if (!fuse.current) {
        return null;
    }

    return (
        <>
            <FlatList
                data={results}
                renderItem={({ item: { id, type, album: trackAlbum, name: trackName } }: { item: AlbumResult | AudioResult }) => {
                    const album = albums[trackAlbum || id];

                    if (!album) {
                        console.log('Couldnt find ', trackAlbum, id);
                        return null;
                    }

                    return (
                        <TouchableHandler id={album.Id} onPress={selectAlbum}>
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
                extraData={[searchTerm, albums]}
            />
        </>
    );
}