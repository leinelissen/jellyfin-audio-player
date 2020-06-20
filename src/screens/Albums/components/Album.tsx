import React, { useCallback, useEffect } from 'react';
import TrackPlayer from 'react-native-track-player';
import { StackParams } from '../types';
import { Text, ScrollView, Dimensions, Button, TouchableOpacity, RefreshControl } from 'react-native';
import { generateTrack, useGetImage } from '../../../utility/JellyfinApi';
import styled from 'styled-components/native';
import { useRoute, RouteProp } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { useDispatch } from 'react-redux';
import { differenceInDays } from 'date-fns';
import { useTypedSelector } from '../../../store';
import { fetchTracksByAlbum } from '../../../store/music/actions';
import { ALBUM_CACHE_AMOUNT_OF_DAYS } from '../../../CONSTANTS';

type Route = RouteProp<StackParams, 'Album'>;

const Screen = Dimensions.get('screen');

const AlbumImage = styled(FastImage)`
    border-radius: 10px;
    width: ${Screen.width * 0.6}px;
    height: ${Screen.width * 0.6}px;
    margin: 10px auto;
`;

const TrackContainer = styled.View`
    padding: 15px;
    border-bottom-width: 1px;
    border-bottom-color: #eee;
    flex-direction: row;
`;

interface TouchableTrackProps {
    id: string;
    onPress: (id: string) => void;
}

const TouchableTrack: React.FC<TouchableTrackProps>  = ({ id, onPress, children }) => {
    const handlePress = useCallback(() => {
        return onPress(id);
    }, [id]);

    return (
        <TouchableOpacity onPress={handlePress}>
            <TrackContainer>
                {children}
            </TrackContainer>
        </TouchableOpacity>
    );
};

const Album: React.FC = () => {
    // Retrieve state
    const { params: { id } } = useRoute<Route>();
    const tracks = useTypedSelector((state) => state.music.tracks.entities);
    const album = useTypedSelector((state) => state.music.albums.entities[id]);
    const isLoading = useTypedSelector((state) => state.music.tracks.isLoading);
    const credentials = useTypedSelector((state) => state.settings.jellyfin);

    // Retrieve helpers
    const dispatch = useDispatch();
    const getImage = useGetImage();

    // Set callbacks
    const selectTrack = useCallback(async (trackId) => { 
        const newTrack = generateTrack(tracks[trackId], credentials);
        console.log(newTrack);
        await TrackPlayer.add([ newTrack ]);
        await TrackPlayer.skip(trackId);
        TrackPlayer.play();
    }, [tracks, credentials]);
    const playAlbum = useCallback(async () => { 
        const newTracks = album.Tracks.map((trackId) => generateTrack(tracks[trackId], credentials));
        await TrackPlayer.removeUpcomingTracks();
        await TrackPlayer.add(newTracks);
        await TrackPlayer.skip(album.Tracks[0]);
        TrackPlayer.play();
    }, [tracks, credentials]);
    const refresh = useCallback(() => { dispatch(fetchTracksByAlbum(id)); }, [id]);

    // Retrieve album tracks on load
    useEffect(() => {
        if (!album?.lastRefreshed || differenceInDays(album.lastRefreshed, new Date()) > ALBUM_CACHE_AMOUNT_OF_DAYS) {
            refresh();
        }
    }, []);

    return (
        <ScrollView
            style={{ backgroundColor: '#f6f6f6', padding: 20, paddingBottom: 50 }}
            refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={refresh} />
            }
        >
            <AlbumImage source={{ uri: getImage(album.Id) }} />
            <Text style={{ fontSize: 36, fontWeight: 'bold' }} >{album?.Name}</Text>
            <Text style={{ fontSize: 24, opacity: 0.5, marginBottom: 24 }}>{album?.AlbumArtist}</Text>
            <Button title="Play Album" onPress={playAlbum} />
            {album?.Tracks?.length ? album.Tracks.map((trackId) =>
                <TouchableTrack key={trackId} id={trackId} onPress={selectTrack}>
                    <Text style={{ width: 20, opacity: 0.5, marginRight: 5 }}>{tracks[trackId]?.IndexNumber}</Text>
                    <Text>{tracks[trackId]?.Name}</Text>
                </TouchableTrack>
            ) : undefined}
        </ScrollView>
    );
};

export default Album;