import React, { useCallback, useEffect } from 'react';
import { useGetImage } from 'utility/JellyfinApi';
import { Album, NavigationProp } from '../types';
import { Text, SafeAreaView, FlatList, Dimensions } from 'react-native';
import styled from 'styled-components/native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { differenceInDays } from 'date-fns';
import { useTypedSelector } from 'store';
import { fetchAllAlbums } from 'store/music/actions';
import { ALBUM_CACHE_AMOUNT_OF_DAYS } from 'CONSTANTS';
import TouchableHandler from 'components/TouchableHandler';

const Screen = Dimensions.get('screen');

const Container = styled.View`
    /* flex-direction: row;
    flex-wrap: wrap;
    flex: 1; */
    padding: 10px;
    background-color: #f6f6f6;
`;

const AlbumItem = styled.View`
    width: ${Screen.width / 2 - 10}px;
    padding: 10px;
`;

const AlbumImage = styled(FastImage)`
    border-radius: 10px;
    width: ${Screen.width / 2 - 40}px;
    height: ${Screen.width / 2 - 40}px;
    background-color: #fefefe;
    margin-bottom: 5px;
`;

const Albums: React.FC = () => {
    // Retrieve data from store
    const { ids, entities: albums } = useTypedSelector((state) => state.music.albums);
    const isLoading = useTypedSelector((state) => state.music.albums.isLoading);
    const lastRefreshed = useTypedSelector((state) => state.music.lastRefreshed);
    
    // Initialise helpers
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp>();
    const getImage = useGetImage();

    // Set callbacks
    const retrieveData = useCallback(() => dispatch(fetchAllAlbums()), [dispatch]);
    const selectAlbum = useCallback((id: string) => navigation.navigate('Album', { id, album: albums[id] as Album }), [navigation, albums]);
    
    // Retrieve data on mount
    useEffect(() => { 
        // GUARD: Only refresh this API call every set amounts of days
        if (!lastRefreshed || differenceInDays(lastRefreshed, new Date()) > ALBUM_CACHE_AMOUNT_OF_DAYS) {
            retrieveData(); 
        }
    }, []);
    
    return (
        <SafeAreaView>
            <Container>
                <FlatList
                    data={ids as string[]} 
                    refreshing={isLoading}
                    onRefresh={retrieveData}
                    numColumns={2}
                    keyExtractor={d => d}
                    renderItem={({ item }) => (
                        <TouchableHandler id={item} onPress={selectAlbum}>
                            <AlbumItem>
                                <AlbumImage source={{ uri: getImage(item) }} />
                                <Text>{albums[item]?.Name}</Text>
                                <Text style={{ opacity: 0.5 }}>{albums[item]?.AlbumArtist}</Text>
                            </AlbumItem>
                        </TouchableHandler>
                    )}
                />
            </Container>
        </SafeAreaView>
    );
};


export default Albums;