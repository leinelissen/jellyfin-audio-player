import React, { useCallback, useEffect } from 'react';
import { useGetImage } from '@/utility/JellyfinApi/lib';
import { Text, SafeAreaView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useTypedSelector } from '@/store';
import { fetchRecentAlbums } from '@/store/music/actions';
import TouchableHandler from '@/components/TouchableHandler';
import ListContainer from './components/ListContainer';
import AlbumImage, { AlbumItem } from './components/AlbumImage';
import { useRecentAlbums } from '@/store/music/selectors';
import { Header } from '@/components/Typography';
import ListButton from '@/components/ListButton';
import { t } from '@/localisation';
import useDefaultStyles from '@/components/Colors';
import { Album } from '@/store/music/types';
import Divider from '@/components/Divider';
import styled from 'styled-components/native';
import { ShadowWrapper } from '@/components/Shadow';
import { NavigationProp } from '@/screens/types';
import { SafeFlatList } from '@/components/SafeNavigatorView';

const styles = StyleSheet.create({
    columnWrapper: {
        paddingHorizontal: 16,
    }
});

const HeaderContainer = styled.View`
    display: flex;
    flex-direction: row;
    align-items: center;
`;

const NavigationHeader: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const handleAllAlbumsClick = useCallback(() => { navigation.navigate('Albums'); }, [navigation]);
    const handlePlaylistsClick = useCallback(() => { navigation.navigate('Playlists'); }, [navigation]);
    const handleArtistsClick = useCallback(() => { navigation.navigate('Artists'); }, [navigation]);
    
    return (
        <>
            <ListButton onPress={handleAllAlbumsClick} testID="all-albums">
                {t('all-albums')}
            </ListButton>
            <ListButton onPress={handleArtistsClick} testID="artists">
                {t('artists')}
            </ListButton>
            <ListButton onPress={handlePlaylistsClick} testID="playlists">
                {t('playlists')}
            </ListButton>
            <ListContainer>
                <HeaderContainer>
                    <Header>{t('recent-albums')}</Header>
                    <Divider style={{ marginLeft: 24 }} />
                </HeaderContainer>
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
    const dispatch = useAppDispatch();
    const navigation = useNavigation<NavigationProp>();
    const getImage = useGetImage();

    // Set callbacks
    const retrieveData = useCallback(() => dispatch(fetchRecentAlbums()), [dispatch]);
    const selectAlbum = useCallback((id: string) => navigation.navigate('Album', { id, album: albums[id] as Album }), [navigation, albums]);
    
    // Retrieve data on mount
    useEffect(() => { retrieveData(); }, [retrieveData]);
    
    return (
        <SafeAreaView>
            <SafeFlatList
                data={recentAlbums as string[]} 
                refreshing={isLoading}
                onRefresh={retrieveData}
                numColumns={2}
                keyExtractor={d => d}
                columnWrapperStyle={styles.columnWrapper}
                ListHeaderComponent={NavigationHeader}
                renderItem={({ item }) => (
                    <TouchableHandler id={item} onPress={selectAlbum} testID={`select-album-${item}`}>
                        <AlbumItem>
                            <ShadowWrapper size="medium">
                                <AlbumImage source={{ uri: getImage(albums[item]) }} style={defaultStyles.imageBackground} />
                            </ShadowWrapper>
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