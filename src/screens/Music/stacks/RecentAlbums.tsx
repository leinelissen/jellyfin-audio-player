import React, { useCallback, useEffect } from 'react';
import { useGetImage } from 'utility/JellyfinApi';
import { Album, NavigationProp } from '../types';
import { Text, SafeAreaView, FlatList, StyleSheet } from 'react-native';
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
import { colors } from 'components/Colors';
import { t } from '@localisation';

const styles = StyleSheet.create({
    artist: {
        ...colors.text,
        opacity: 0.5,
    }
});

const NavigationHeader: React.FC = () => {
    const navigation = useNavigation();
    const handleAllAlbumsClick = useCallback(() => { navigation.navigate('Albums'); }, [navigation]);
    const handleSearchClick = useCallback(() => { navigation.navigate('Search'); }, [navigation]);
    
    return (
        <ListContainer>
            <ListButton onPress={handleAllAlbumsClick}>{t('all-albums')}</ListButton>
            <ListButton onPress={handleSearchClick}>{t('search')}</ListButton>
            <Header style={colors.text}>{t('recent-albums')}</Header>
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
                                <AlbumImage source={{ uri: getImage(item) }} style={colors.imageBackground} />
                                <Text style={colors.text} numberOfLines={1}>{albums[item]?.Name}</Text>
                                <Text style={styles.artist} numberOfLines={1}>{albums[item]?.AlbumArtist}</Text>
                            </AlbumItem>
                        </TouchableHandler>
                    )}
                />
            </ListContainer>
        </SafeAreaView>
    );
};

export default RecentAlbums;