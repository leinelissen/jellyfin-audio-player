import React, { useCallback } from 'react';
import { Text, ScrollView, Dimensions, RefreshControl, StyleSheet, View } from 'react-native';
import { useGetImage } from 'utility/JellyfinApi';
import styled, { css } from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
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
import Trash from 'assets/trash.svg';
import { useDispatch } from 'react-redux';
import { downloadTrack, removeDownloadedTrack } from 'store/downloads/actions';
import { selectDownloadedTracks } from 'store/downloads/selectors';

const Screen = Dimensions.get('screen');

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
    }
});

const AlbumImage = styled(FastImage)`
    border-radius: 10px;
    width: ${Screen.width * 0.6}px;
    height: ${Screen.width * 0.6}px;
    margin: 10px auto;
`;

const TrackContainer = styled.View<{isPlaying: boolean}>`
    padding: 15px 4px;
    border-bottom-width: 1px;
    flex-direction: row;

    ${props => props.isPlaying && css`
        background-color: ${THEME_COLOR}16;
        margin: 0 -20px;
        padding: 15px 24px;
    `}
`;

interface TrackListViewProps {
    title?: string;
    artist?: string;
    trackIds: EntityId[];
    entityId: string;
    refresh: () => void;
    playButtonText: string;
    shuffleButtonText: string;
    downloadButtonText: string;
    deleteButtonText: string;
    listNumberingStyle?: 'album' | 'index';
}

const TrackListView: React.FC<TrackListViewProps> = ({
    trackIds,
    entityId,
    title,
    artist,
    refresh,
    playButtonText,
    shuffleButtonText,
    downloadButtonText,
    deleteButtonText,
    listNumberingStyle = 'album',
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
        trackIds.forEach((trackId) => dispatch(downloadTrack(trackId)));
    }, [dispatch, trackIds]);
    const deleteAllTracks = useCallback(() => {
        downloadedTracks.forEach((trackId) => dispatch(removeDownloadedTrack(trackId)));
    }, [dispatch, downloadedTracks]);

    return (
        <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
            refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={refresh} />
            }
        >
            <AlbumImage source={{ uri: getImage(entityId) }} style={defaultStyles.imageBackground} />
            <Text style={[ defaultStyles.text, styles.name ]} >{title}</Text>
            <Text style={[ defaultStyles.text, styles.artist ]}>{artist}</Text>
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
                        <TrackContainer isPlaying={currentTrack?.backendId === trackId || false} style={defaultStyles.border}>
                            <Text
                                style={[
                                    defaultStyles.text,
                                    styles.index,
                                    currentTrack?.backendId === trackId && { 
                                        color: THEME_COLOR,
                                        opacity: 1
                                    } 
                                ]}
                            >
                                {listNumberingStyle === 'index' 
                                    ? i + 1
                                    : tracks[trackId]?.IndexNumber}
                            </Text>
                            <Text
                                style={currentTrack?.backendId === trackId
                                    ? { color: THEME_COLOR, fontWeight: '700' }
                                    : defaultStyles.text
                                }
                            >
                                {tracks[trackId]?.Name}
                            </Text>
                            <View style={{ marginLeft: 'auto' }}>
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
                    <WrappableButton
                        icon={Trash}
                        title={deleteButtonText}
                        onPress={deleteAllTracks}
                        disabled={downloadedTracks.length === 0}
                    />
                </WrappableButtonRow>
            </View>
        </ScrollView>
    );
};

export default TrackListView;