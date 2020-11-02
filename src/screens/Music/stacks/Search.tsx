import React, { useState, useEffect, useRef, useCallback } from 'react';
import Input from 'components/Input';
import { Text, View } from 'react-native';
import styled from 'styled-components/native';
import { useTypedSelector } from 'store';
import Fuse from 'fuse.js';
import { Album } from 'store/music/types';
import { FlatList } from 'react-native-gesture-handler';
import TouchableHandler from 'components/TouchableHandler';
import { useNavigation } from '@react-navigation/native';
import { useGetImage } from 'utility/JellyfinApi';
import { NavigationProp } from '../types';
import FastImage from 'react-native-fast-image';
import { colors } from 'components/Colors';
import { t } from '@localisation';

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

export default function Search() {
    // Prepare state
    const [searchTerm, setSearchTerm] = useState('');
    const albums = useTypedSelector(state => state.music.albums.entities);
    const [results, setResults] = useState<Fuse.FuseResult<Album>[]>([]);
    const fuse = useRef<Fuse<Album, typeof fuseOptions>>();

    // Prepare helpers
    const navigation = useNavigation<NavigationProp>();
    const getImage = useGetImage();

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
        // GUARD: In some extraordinary cases, Fuse might not be presented since
        // it is assigned via refs. In this case, we can't handle any searching.
        if (!fuse.current) {
            return;
        }

        setResults(fuse.current.search(searchTerm));
    }, [searchTerm, setResults, fuse]);

    // Handlers
    const selectAlbum = useCallback((id: string) => 
        navigation.navigate('Album', { id, album: albums[id] as Album }), [navigation, albums]
    );

    const HeaderComponent = React.useMemo(() => (
        <Container>
            <Input value={searchTerm} onChangeText={setSearchTerm} style={colors.input} placeholder={t('search') + '...'} />
            {(searchTerm.length && !results.length) ? <Text>{t('no-results')}</Text> : null}
        </Container>
    ), [searchTerm, results, setSearchTerm]);

    // GUARD: We cannot search for stuff unless Fuse is loaded with results.
    // Therefore we delay rendering to when we are certain it's there.
    if (!fuse.current) {
        return null;
    }

    return (
        <FlatList
            data={results}
            renderItem={({ item: { item: album } }) =>(
                <TouchableHandler id={album.Id} onPress={selectAlbum}>
                    <SearchResult style={colors.border}>
                        <AlbumImage source={{ uri: getImage(album.Id) }} />
                        <View>
                            <Text numberOfLines={1} ellipsizeMode="tail" style={colors.text}>
                                {album.Name} - {album.AlbumArtist}
                            </Text>
                            <HalfOpacity style={colors.text}>{t('album')}</HalfOpacity>
                        </View>
                    </SearchResult>
                </TouchableHandler>
            )}
            keyExtractor={(item) => item.refIndex.toString()}
            ListHeaderComponent={HeaderComponent}
            extraData={searchTerm}
        />
    );
}