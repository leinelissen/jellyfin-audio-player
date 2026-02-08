import React, { useCallback, useEffect } from 'react';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useAlbums, useTracksByAlbum } from '@/store/music/hooks';
import * as musicFetchers from '@/store/music/fetchers';
import { useSourceId } from '@/store/db/useSourceId';
import TrackListView from './components/TrackListView';
import { differenceInDays } from 'date-fns';
import { ALBUM_CACHE_AMOUNT_OF_DAYS } from '@/CONSTANTS';
import { t } from '@/localisation';
import { NavigationProp, StackParams } from '@/screens/types';
import { SubHeader, Text } from '@/components/Typography';
import { ScrollView } from 'react-native-gesture-handler';
import { useGetImage } from '@/utility/JellyfinApi/lib';
import styled from 'styled-components';
import { Dimensions, Pressable } from 'react-native';
import AlbumImage from './components/AlbumImage';
import useDefaultStyles from '@/components/Colors';

type Route = RouteProp<StackParams, 'Album'>;

const Screen = Dimensions.get('screen');

const Cover = styled(AlbumImage)`
    height: ${Screen.width / 2.8}px;
    width: ${Screen.width / 2.8}px;
    border-radius: 12px;
    margin-bottom: 8px;
`;

function SimilarAlbum({ id }: { id: string }) {
    const navigation = useNavigation<NavigationProp>();
    const getImage = useGetImage();
    const sourceId = useSourceId();
    const { albums } = useAlbums(sourceId);
    const album = albums[id];

    const handlePress = useCallback(() => {
        album && navigation.push('Album', { id, album });
    }, [id, album, navigation]);
    
    return (
        <Pressable
            style={({ pressed }) => ({ 
                opacity: pressed ? 0.5 : 1.0,
                width: Screen.width / 2.8,
                marginRight: 12 
            })}
            onPress={handlePress}
        >
            <Cover key={id} source={{ uri: getImage(album) }} />
            <Text numberOfLines={1} style={{ fontSize: 13, marginBottom: 2 }}>{album?.Name}</Text>
            <Text numberOfLines={1} style={{ opacity: 0.5, fontSize: 13 }}>{album?.Artists.join(', ')}</Text>
        </Pressable>
    );
}

const Album: React.FC = () => {
    const { params: { id } } = useRoute<Route>();
    const defaultStyles = useDefaultStyles();

    // Retrieve the album data from the store
    const sourceId = useSourceId();
    const { albums } = useAlbums(sourceId);
    const album = albums[id];
    const { ids: albumTrackIds } = useTracksByAlbum(sourceId, id);

    // Define a function for refreshing this entity
    const refresh = useCallback(() => { 
        musicFetchers.fetchAndStoreTracksByAlbum(id); 
        musicFetchers.fetchAndStoreAlbum(id);
        musicFetchers.fetchAndStoreSimilarAlbums(id);
    }, [id]);

    // Auto-fetch the track data periodically
    useEffect(() => {
        if (!album?.lastRefreshed || differenceInDays(album?.lastRefreshed, new Date()) > ALBUM_CACHE_AMOUNT_OF_DAYS) {
            refresh();
        }
    }, [album?.lastRefreshed, refresh]);

    return (
        <TrackListView
            trackIds={albumTrackIds || []}
            title={album?.Name}
            artist={album?.AlbumArtist}
            entityId={album?.PrimaryImageItemId || album.Id}
            refresh={refresh}
            playButtonText={t('play-album')}
            shuffleButtonText={t('shuffle-album')}
            downloadButtonText={t('download-album')}
            deleteButtonText={t('delete-album')}
        >
            {album?.Overview ? (
                <Text style={[defaultStyles.textSmall, { paddingBottom: 24 }]}>{album?.Overview}</Text>
            ) : null}
            {album?.Similar?.length ? (
                <>
                    <SubHeader>{t('similar-albums')}</SubHeader>
                    <ScrollView horizontal style={{ marginLeft: -24, marginRight: -24, marginTop: 8 }} contentContainerStyle={{ paddingHorizontal: 24 }} showsHorizontalScrollIndicator={false}>
                        {album.Similar.map((id) => (
                            <SimilarAlbum id={id} key={id} />
                        ))}
                    </ScrollView>
                </>
            ) : null}
        </TrackListView>
    );
};

export default Album;