import React, { useCallback, useMemo } from 'react';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useAlbum, useAlbumSimilar } from '@/store/albums/hooks';
import { useTracksByAlbum } from '@/store/tracks/hooks';
import Sync from '@/store/sources/sync-manager';
import useSyncAction from '@/utility/useSyncAction';
import TrackListView from './components/TrackListView';
import { t } from '@/localisation';
import { NavigationProp, StackParams } from '@/screens/types';
import { SubHeader, Text } from '@/components/Typography';
import { ScrollView } from 'react-native-gesture-handler';
import Artwork from '@/store/sources/artwork-manager';
import { Dimensions, Pressable } from 'react-native';
import AlbumImage from './components/AlbumImage';
import useDefaultStyles from '@/components/Colors';
import styled from 'styled-components/native';
import type { Album } from '@/store/albums/types';
import type { EntityId } from '@/store/types';

type Route = RouteProp<StackParams, 'Album'>;

const Screen = Dimensions.get('screen');

const Cover = styled(AlbumImage)`
    height: ${Screen.width / 2.8}px;
    width: ${Screen.width / 2.8}px;
    border-radius: 12px;
    margin-bottom: 8px;
`;

function SimilarAlbum({ album }: { album: Album }) {
    const navigation = useNavigation<NavigationProp>();

    const handlePress = useCallback(() => {
        navigation.push('Album', { id: [album.sourceId, album.id] });
    }, [album, navigation]);

    return (
        <Pressable
            style={({ pressed }) => ({
                opacity: pressed ? 0.5 : 1.0,
                width: Screen.width / 2.8,
                marginRight: 12,
            })}
            onPress={handlePress}
        >
            <Cover source={{ uri: Artwork.getUrl(album) }} />
            <Text numberOfLines={1} style={{ fontSize: 13, marginBottom: 2 }}>{album.name}</Text>
            <Text numberOfLines={1} style={{ opacity: 0.5, fontSize: 13 }}>{album.albumArtist}</Text>
        </Pressable>
    );
}

const AlbumScreen: React.FC = () => {
    const { params: { id } } = useRoute<Route>();
    const defaultStyles = useDefaultStyles();

    const entityId = useMemo<EntityId>(() => id, [id]);

    const { data: album } = useAlbum(entityId);
    const { data: tracks } = useTracksByAlbum(entityId);
    const { data: similarAlbumData } = useAlbumSimilar(entityId);
    const similarAlbums = similarAlbumData?.similarAlbums ?? [];

    const albumMetadata = useMemo(() => {
        if (!album?.metadata) return null;
        return album.metadata as { Overview?: string };
    }, [album?.metadata]);

    const [isLoading, refresh] = useSyncAction(async () => {
        await Promise.all([
            Sync.syncAlbumTracks(entityId),
            Sync.syncSimilarAlbums(entityId),
        ]);
    });

    return (
        <TrackListView
            tracks={tracks ?? []}
            title={album?.name ?? ''}
            artist={album?.albumArtist ?? undefined}
            entityId={entityId}
            refresh={refresh}
            isLoading={isLoading}
            playButtonText={t('play-album')}
            shuffleButtonText={t('shuffle-album')}
            downloadButtonText={t('download-album')}
            deleteButtonText={t('delete-album')}
        >
            {albumMetadata?.Overview ? (
                <Text style={[defaultStyles.textSmall, { paddingBottom: 24 }]}>{albumMetadata.Overview}</Text>
            ) : null}
            {similarAlbums.length > 0 && (
                <>
                    <SubHeader>{t('similar-albums')}</SubHeader>
                    <ScrollView
                        horizontal
                        style={{ marginLeft: -24, marginRight: -24, marginTop: 8 }}
                        contentContainerStyle={{ paddingHorizontal: 24 }}
                        showsHorizontalScrollIndicator={false}
                    >
                        {similarAlbums.map(similar => (
                            <SimilarAlbum album={similar} key={similar.id} />
                        ))}
                    </ScrollView>
                </>
            )}
        </TrackListView>
    );
};

export default AlbumScreen;
