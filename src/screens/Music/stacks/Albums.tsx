import React, { useCallback, useEffect } from 'react';
import { useGetImage } from 'utility/JellyfinApi';
import { Album, NavigationProp } from '../types';
import { Text, SafeAreaView, FlatList } from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { differenceInDays } from 'date-fns';
import { useTypedSelector } from 'store';
import { fetchAllAlbums } from 'store/music/actions';
import { ALBUM_CACHE_AMOUNT_OF_DAYS } from 'CONSTANTS';
import TouchableHandler from 'components/TouchableHandler';
import ListContainer from './components/ListContainer';
import AlbumImage, { AlbumItem } from './components/AlbumImage';
import { useAlbumsByArtist } from 'store/music/selectors';

const Albums: React.FC = () => {
    // Retrieve data from store
    const { entities: albums } = useTypedSelector((state) => state.music.albums);
    const ids = useAlbumsByArtist();
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
            <ListContainer>
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
            </ListContainer>
        </SafeAreaView>
    );
};


export default Albums;