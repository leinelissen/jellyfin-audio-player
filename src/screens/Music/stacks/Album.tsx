import React, { useCallback, useEffect } from 'react';
import { StackParams } from '../types';
import { Text, ScrollView, Dimensions, Button, RefreshControl, StyleSheet } from 'react-native';
import { useGetImage } from 'utility/JellyfinApi';
import styled, { css } from 'styled-components/native';
import { useRoute, RouteProp } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { useDispatch } from 'react-redux';
import { differenceInDays } from 'date-fns';
import { useTypedSelector } from 'store';
import { fetchTracksByAlbum } from 'store/music/actions';
import { ALBUM_CACHE_AMOUNT_OF_DAYS, THEME_COLOR } from 'CONSTANTS';
import usePlayAlbum from 'utility/usePlayAlbum';
import usePlayTrack from 'utility/usePlayTrack';
import TouchableHandler from 'components/TouchableHandler';
import useCurrentTrack from 'utility/useCurrentTrack';
import { colors } from 'components/Colors';

type Route = RouteProp<StackParams, 'Album'>;

const Screen = Dimensions.get('screen');

const styles = StyleSheet.create({
    name: {
        ...colors.text,
        fontSize: 36, 
        fontWeight: 'bold'
    },
    artist: {
        ...colors.text,
        fontSize: 24,
        opacity: 0.5,
        marginBottom: 24
    },
    index: {
        ...colors.text,
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
    // Retrieve state
    const { params: { id } } = useRoute<Route>();
    const tracks = useTypedSelector((state) => state.music.tracks.entities);
    const album = useTypedSelector((state) => state.music.albums.entities[id]);
    const isLoading = useTypedSelector((state) => state.music.tracks.isLoading);

    // Retrieve helpers
    const dispatch = useDispatch();
    const getImage = useGetImage();
    const playAlbum = usePlayAlbum();
    const currentTrack = useCurrentTrack();

    // Setup callbacks
    const selectAlbum = useCallback(() => { playAlbum(id); }, [playAlbum, id]);
    const selectTrack = usePlayTrack();
    const refresh = useCallback(() => { dispatch(fetchTracksByAlbum(id)); }, [id, dispatch]);

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
            <AlbumImage source={{ uri: getImage(album?.Id) }} style={colors.imageBackground} />
            <Text style={styles.name} >{album?.Name}</Text>
            <Text style={styles.artist}>{album?.AlbumArtist}</Text>
            <Button title="Play Album" onPress={selectAlbum} color={THEME_COLOR} />
            {album?.Tracks?.length ? album.Tracks.map((trackId) =>
                <TouchableHandler key={trackId} id={trackId} onPress={selectTrack}>
                    <TrackContainer isPlaying={currentTrack?.id.startsWith(trackId) || false} style={colors.border}>
                        <Text style={styles.index}>
                            {tracks[trackId]?.IndexNumber}
                        </Text>
                        <Text style={colors.text}>{tracks[trackId]?.Name}</Text>
                    </TrackContainer>
                </TouchableHandler>
            ) : undefined}
        </ScrollView>
    );
};

export default Album;