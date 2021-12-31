import React, { useCallback, useEffect } from 'react';
import { useGetImage } from 'utility/JellyfinApi';
import { NavigationProp } from '../types';
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
import { t } from '@localisation';
import useDefaultStyles from 'components/Colors';
import { Album } from 'store/music/types';

const styles = StyleSheet.create({
    columnWrapper: {
        paddingLeft: 10,
        paddingRight: 10
    }
});

const NavigationHeader: React.FC = () => {
    const navigation = useNavigation();
    const defaultStyles = useDefaultStyles();
    const handleAllAlbumsClick = useCallback(() => { navigation.navigate('Albums'); }, [navigation]);
    const handleSearchClick = useCallback(() => { navigation.navigate('Search'); }, [navigation]);
    
    return (
        <>
            <ListButton onPress={handleAllAlbumsClick}>{t('all-albums')}</ListButton>
            <ListButton onPress={handleSearchClick}>{t('search')}</ListButton>
            <ListContainer>
                <Header style={defaultStyles.text}>{t('recent-albums')}</Header>
            </ListContainer>
        </>
    );
};

const RecentAlbums: React.FC = () => {
    const defaultStyles = useDefaultStyles();

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
            <FlatList
                data={recentAlbums as string[]} 
                refreshing={isLoading}
                onRefresh={retrieveData}
                numColumns={2}
                keyExtractor={d => d}
                columnWrapperStyle={styles.columnWrapper}
                ListHeaderComponent={NavigationHeader}
                renderItem={({ item }) => (
                    <TouchableHandler id={item} onPress={selectAlbum}>
                        <AlbumItem>
                            <AlbumImage source={{ uri: getImage(item) }} style={defaultStyles.imageBackground} />
                            <Text style={defaultStyles.text} numberOfLines={1}>{albums[item]?.Name}</Text>
                            <Text style={defaultStyles.textHalfOpacity} numberOfLines={1}>{albums[item]?.AlbumArtist}</Text>
                        </AlbumItem>
                    </TouchableHandler>
                )}
            />
        </SafeAreaView>
    );
};

export default RecentAlbums;