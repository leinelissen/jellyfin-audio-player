import React, { useCallback } from 'react';
import { Text, ScrollView, RefreshControl, StyleSheet, View } from 'react-native';
import { useGetImage } from 'utility/JellyfinApi';
import styled, { css } from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'store';
import { THEME_COLOR } from 'CONSTANTS';
import TouchableHandler from 'components/TouchableHandler';
import useCurrentTrack from 'utility/useCurrentTrack';
import TrackPlayer from 'react-native-track-player';
import Play from 'assets/play.svg';
import Shuffle from 'assets/shuffle.svg';
import useDefaultStyles from 'components/Colors';
import usePlayTracks from 'utility/usePlayTracks';
import { EntityId } from '@reduxjs/toolkit';
import { WrappableButtonRow, WrappableButton } from 'components/WrappableButtonRow';
import { MusicNavigationProp } from 'screens/Music/types';
import DownloadIcon from 'components/DownloadIcon';
import CloudDownArrow from 'assets/cloud-down-arrow.svg';
import { useDispatch } from 'react-redux';
import { queueTrackForDownload } from 'store/downloads/actions';
import { selectDownloadedTracks } from 'store/downloads/selectors';
import SingleImage from 'components/SingleImage';

const styles = StyleSheet.create({
    name: {
        fontSize: 36, 
        fontWeight: 'bold'
    },
    artist: {
        fontSize: 24,
        opacity: 0.5,
        marginBottom: 12
    },
    index: {
        width: 20,
        opacity: 0.5,
        marginRight: 5
    },
    artistTrackText:{
        opacity: 0.5,
        display: 'flex'
    }
});

const TrackContainer = styled.View<{isPlaying: boolean}>`
    padding: 5px 4px;
    border-bottom-width: 1px;
    flex-direction: row;

    ${props => props.isPlaying && css`
        margin: 0 -20px;
        padding: 15px 24px;
    `}
`;

const SingleInformationContainer = styled.View`
    display: inline;
`;

interface SinglesListViewProps {
    title?: string;
    trackIds: EntityId[];
    refresh: () => void;
    playButtonText: string;
    shuffleButtonText: string;
    downloadButtonText: string;
}

const SinglesListView: React.FC<SinglesListViewProps> = ({
    trackIds,
    refresh,
    playButtonText,
    shuffleButtonText,
    downloadButtonText
}) => {
    const defaultStyles = useDefaultStyles();

    // Retrieve state
    const tracks = useTypedSelector((state) => state.music.tracks.entities);
    const isLoading = useTypedSelector((state) => state.music.tracks.isLoading);
    const downloadedTracks = useTypedSelector(selectDownloadedTracks(trackIds));

    // Retrieve helpers
    const getImage = useGetImage();
    const playTracks = usePlayTracks();
    const { track: currentTrack } = useCurrentTrack();
    const navigation = useNavigation<MusicNavigationProp>();
    const dispatch = useDispatch();

    // Setup callbacks
    const playEntity = useCallback(() => { playTracks(trackIds); }, [playTracks, trackIds]);
    const shuffleEntity = useCallback(() => { playTracks(trackIds, { shuffle: true }); }, [playTracks, trackIds]);
    const selectTrack = useCallback(async (index: number) => {
        await playTracks(trackIds, { play: false });
        await TrackPlayer.skip(index);
        await TrackPlayer.play();
    }, [playTracks, trackIds]);
    const longPressTrack = useCallback((index: number) => { 
        navigation.navigate('TrackPopupMenu', { trackId: trackIds[index] }); 
    }, [navigation, trackIds]);
    const downloadAllTracks = useCallback(() => {
        trackIds.forEach((trackId) => dispatch(queueTrackForDownload(trackId)));
    }, [dispatch, trackIds]);

    return (
        <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
            refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={refresh} />
            }
        >
            <WrappableButtonRow>
                <WrappableButton title={playButtonText} icon={Play} onPress={playEntity} />
                <WrappableButton title={shuffleButtonText} icon={Shuffle} onPress={shuffleEntity} />
            </WrappableButtonRow>
            <View style={{ marginTop: 8 }}>
                {trackIds.map((trackId, i) =>
                    <TouchableHandler
                        key={trackId}
                        id={i}
                        onPress={selectTrack}
                        onLongPress={longPressTrack}
                    >
                        <TrackContainer
                            isPlaying={currentTrack?.backendId === trackId || false}
                            style={[defaultStyles.border, currentTrack?.backendId === trackId || false ? defaultStyles.activeBackground : null ]}
                        >
                            {
                                tracks[trackId]?.AlbumId ?
                                    <SingleImage source={{ uri: getImage(String(tracks[trackId]?.AlbumId)) }} style={defaultStyles.imageBackground} /> :
                                    <SingleImage source={{ uri: getImage(String(trackId)) }} style={defaultStyles.imageBackground} /> 
                            }
                            
                            <View style={[{flexDirection:'column', marginLeft: 20, marginRight:10, flexShrink: 1 }]}>
                                <Text
                                    style={[currentTrack?.backendId === trackId
                                        ? { color: THEME_COLOR, fontWeight: '700' }
                                        : defaultStyles.text,
                                        {flexWrap: 'wrap'},
                                    ]}
                                    numberOfLines={2}
                                >
                                    {tracks[trackId]?.Name}
                                </Text>
                                <Text
                                    style={[
                                        styles.artistTrackText,
                                        currentTrack?.backendId === trackId
                                        ? { color: THEME_COLOR }
                                        : defaultStyles.text
                                    ]}
                                >
                                    {tracks[trackId]?.AlbumArtist}
                                </Text>
                            </View>
                            <View style={{ marginLeft: 'auto'}}>
                                <DownloadIcon trackId={trackId} />
                            </View>
                        </TrackContainer>
                    </TouchableHandler>
                )}
                <WrappableButtonRow style={{ marginTop: 24 }}>
                    <WrappableButton
                        icon={CloudDownArrow}
                        title={downloadButtonText}
                        onPress={downloadAllTracks}
                        disabled={downloadedTracks.length === trackIds.length}
                    />
                </WrappableButtonRow>
            </View>
        </ScrollView>
    );
};

export default SinglesListView;