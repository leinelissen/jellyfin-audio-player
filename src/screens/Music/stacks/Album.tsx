import React, { useCallback, useEffect } from 'react';
import { StackParams } from '../types';
import { Text, ScrollView, Dimensions, RefreshControl, StyleSheet, View } from 'react-native';
import { useGetImage } from 'utility/JellyfinApi';
import styled, { css } from 'styled-components/native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { useDispatch } from 'react-redux';
import { differenceInDays } from 'date-fns';
import { useTypedSelector } from 'store';
import { fetchTracksByAlbum } from 'store/music/actions';
import { ALBUM_CACHE_AMOUNT_OF_DAYS, THEME_COLOR } from 'CONSTANTS';
import usePlayAlbum from 'utility/usePlayAlbum';
import TouchableHandler from 'components/TouchableHandler';
import useCurrentTrack from 'utility/useCurrentTrack';
import TrackPlayer from 'react-native-track-player';
import { t } from '@localisation';
import Button from 'components/Button';
import Play from 'assets/play.svg';
import useDefaultStyles from 'components/Colors';

type Route = RouteProp<StackParams, 'Album'>;

const Screen = Dimensions.get('screen');

const styles = StyleSheet.create({
    name: {
        fontSize: 36, 
        fontWeight: 'bold'
    },
    artist: {
        fontSize: 24,
        opacity: 0.5,
        marginBottom: 24
    },
    index: {
        width: 20,
        opacity: 0.5,
        marginRight: 5
    }
});

const AlbumImage = styled(FastImage)`
    border-radius: 10px;
    width: ${Screen.width * 0.6}px;
    height: ${Screen.width * 0.6}px;
    margin: 10px auto;
`;

const TrackContainer = styled.View<{isPlaying: boolean}>`
    padding: 15px;
    border-bottom-width: 1px;
    flex-direction: row;

    ${props => props.isPlaying && css`
        background-color: ${THEME_COLOR}16;
        margin: 0 -20px;
        padding: 15px 35px;
    `}
`;

const Album: React.FC = () => {
    const defaultStyles = useDefaultStyles();

    // Retrieve state
    const { params: { id } } = useRoute<Route>();
    const tracks = useTypedSelector((state) => state.music.tracks.entities);
    const album = useTypedSelector((state) => state.music.albums.entities[id]);
    const isLoading = useTypedSelector((state) => state.music.tracks.isLoading);

    // Retrieve helpers
    const dispatch = useDispatch();
    const getImage = useGetImage();
    const playAlbum = usePlayAlbum();
    const { track: currentTrack } = useCurrentTrack();
    const navigation = useNavigation();

    // Setup callbacks
    const selectAlbum = useCallback(() => { playAlbum(id); }, [playAlbum, id]);
    const refresh = useCallback(() => { dispatch(fetchTracksByAlbum(id)); }, [id, dispatch]);
    const selectTrack = useCallback(async (index: number) => {
        await playAlbum(id, false);
        await TrackPlayer.skip(index);
        await TrackPlayer.play();
    }, [playAlbum, id]);
    const longPressTrack = useCallback((index: number) => { 
        navigation.navigate('TrackPopupMenu', { trackId: album?.Tracks?.[index] }); 
    }, [navigation, album]);

    // Retrieve album tracks on load
    useEffect(() => {
        if (!album?.lastRefreshed || differenceInDays(album?.lastRefreshed, new Date()) > ALBUM_CACHE_AMOUNT_OF_DAYS) {
            refresh();
        }
    }, [album?.lastRefreshed, refresh]);

    // GUARD: If there is no album, we cannot render a thing
    if (!album) {
        return null;
    }

    return (
        <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
            refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={refresh} />
            }
        >
            <AlbumImage source={{ uri: getImage(album?.Id) }} style={defaultStyles.imageBackground} />
            <Text style={[ defaultStyles.text, styles.name ]} >{album?.Name}</Text>
            <Text style={[ defaultStyles.text, styles.artist ]}>{album?.AlbumArtist}</Text>
            <Button title={t('play-album')} icon={Play} onPress={selectAlbum} />
            <View style={{ marginTop: 15 }}>
                {album?.Tracks?.length ? album.Tracks.map((trackId, i) =>
                    <TouchableHandler
                        key={trackId}
                        id={i}
                        onPress={selectTrack}
                        onLongPress={longPressTrack}
                    >
                        <TrackContainer isPlaying={currentTrack?.backendId === trackId || false} style={defaultStyles.border}>
                            <Text style={[ defaultStyles.text, styles.index ]}>
                                {tracks[trackId]?.IndexNumber}
                            </Text>
                            <Text style={defaultStyles.text}>{tracks[trackId]?.Name}</Text>
                        </TrackContainer>
                    </TouchableHandler>
                ) : undefined}
            </View>
        </ScrollView>
    );
};

export default Album;