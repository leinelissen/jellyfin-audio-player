import React, { useCallback } from 'react';
import Artwork from '@/store/sources/artwork-manager';
import { Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRecentAlbums } from '@/store/albums/hooks';
import Sync from '@/store/sources/sync-manager';
import useSyncAction from '@/utility/useSyncAction';
import TouchableHandler from '@/components/TouchableHandler';
import ListContainer from './components/ListContainer';
import AlbumImage, { AlbumItem } from './components/AlbumImage';
import { Header } from '@/components/Typography';
import ListButton from '@/components/ListButton';
import { t } from '@/localisation';
import useDefaultStyles from '@/components/Colors';
import type { Album } from '@/store/albums/types';
import Divider from '@/components/Divider';
import styled from 'styled-components/native';
import { ShadowWrapper } from '@/components/Shadow';
import { NavigationProp } from '@/screens/types';
import { SafeFlatList } from '@/components/SafeNavigatorView';
import { StyleSheet } from 'react-native';

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

    // Retrieve data from store — album entities directly, no ID mapping needed
    const { data: recentAlbums } = useRecentAlbums(24);

    // Initialise helpers
    const navigation = useNavigation<NavigationProp>();

    // Set callbacks
    const [isLoading, retrieveData] = useSyncAction(() => Sync.syncAlbums());

    const selectAlbum = useCallback((album: Album) => {
        navigation.navigate('Album', { id: [album.sourceId, album.id] });
    }, [navigation]);

    return (
        <SafeFlatList
            data={recentAlbums ?? []}
            refreshing={isLoading}
            onRefresh={retrieveData}
            numColumns={2}
            keyExtractor={album => album.id}
            columnWrapperStyle={styles.columnWrapper}
            ListHeaderComponent={NavigationHeader}
            renderItem={({ item: album }) => (
                <TouchableHandler
                    id={album}
                    onPress={selectAlbum}
                    testID={`select-album-${album.id}`}
                >
                    <AlbumItem>
                        <ShadowWrapper size="medium">
                            <AlbumImage source={{ uri: Artwork.getUrl(album) }} style={defaultStyles.imageBackground} />
                        </ShadowWrapper>
                        <Text style={defaultStyles.text} numberOfLines={1}>{album.name}</Text>
                        <Text style={defaultStyles.textHalfOpacity} numberOfLines={1}>{album.albumArtist}</Text>
                    </AlbumItem>
                </TouchableHandler>
            )}
        />
    );
};

export default RecentAlbums;
