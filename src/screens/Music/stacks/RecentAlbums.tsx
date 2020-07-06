import React, { useCallback, useEffect } from 'react';
import { useGetImage } from 'utility/JellyfinApi';
import { Album, NavigationProp } from '../types';
import { Text, SafeAreaView, FlatList, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'store';
import { fetchRecentAlbums } from 'store/music/actions';
import TouchableHandler from 'components/TouchableHandler';
import ListContainer from './components/ListContainer';
import AlbumImage, { AlbumItem } from './components/AlbumImage';
import { useRecentAlbums } from 'store/music/selectors';
import { Header } from 'components/Typography';
import ListButton from 'components/ListButton';

const NavigationHeader: React.FC = () => {
    const navigation = useNavigation();
    const handleAllAlbumsClick = useCallback(() => { navigation.navigate('Albums'); }, [navigation]);
    const handleSearchClick = useCallback(() => { navigation.navigate('Search'); }, [navigation]);
    
    return (
        <ListContainer>
            <ListButton onPress={handleAllAlbumsClick}>All Albums</ListButton>
            <ListButton onPress={handleSearchClick}>Search</ListButton>
            <Header>Recent Albums</Header>
        </ListContainer>
    );
};

const RecentAlbums: React.FC = () => {
    // Retrieve data from store
    const { entities: albums } = useTypedSelector((state) => state.music.albums);
    const recentAlbums = useRecentAlbums(24);
    const isLoading = useTypedSelector((state) => state.music.albums.isLoading);
    
    // Initialise helpers
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp>();
    const getImage = useGetImage();

    // Set callbacks
    const retrieveData = useCallback(() => dispatch(fetchRecentAlbums()), [dispatch]);
    const selectAlbum = useCallback((id: string) => navigation.navigate('Album', { id, album: albums[id] as Album }), [navigation, albums]);
    
    console.log(recentAlbums.map((d) => albums[d]?.DateCreated));
    
    // Retrieve data on mount
    useEffect(() => { retrieveData(); }, [retrieveData]);
    
    return (
        <SafeAreaView>
            <ListContainer>
                <FlatList
                    data={recentAlbums as string[]} 
                    refreshing={isLoading}
                    onRefresh={retrieveData}
                    numColumns={2}
                    keyExtractor={d => d}
                    ListHeaderComponent={NavigationHeader}
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

export default RecentAlbums;