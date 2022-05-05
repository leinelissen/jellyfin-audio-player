import React, { useCallback } from 'react';
import { ScrollView, RefreshControl, StyleSheet, View } from 'react-native';
import { useGetImage } from 'utility/JellyfinApi';
import styled, { css } from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'store';
import { THEME_COLOR } from 'CONSTANTS';
import TouchableHandler from 'components/TouchableHandler';
import useCurrentTrack from 'utility/useCurrentTrack';
import TrackPlayer from 'react-native-track-player';
import Play from 'assets/icons/play.svg';
import Shuffle from 'assets/icons/shuffle.svg';
import useDefaultStyles from 'components/Colors';
import usePlayTracks from 'utility/usePlayTracks';
import { EntityId } from '@reduxjs/toolkit';
import { WrappableButtonRow, WrappableButton } from 'components/WrappableButtonRow';
import { MusicNavigationProp } from 'screens/Music/types';
import DownloadIcon from 'components/DownloadIcon';
import CloudDownArrow from 'assets/icons/cloud-down-arrow.svg';
import Trash from 'assets/icons/trash.svg';
import { useDispatch } from 'react-redux';
import { queueTrackForDownload, removeDownloadedTrack } from 'store/downloads/actions';
import { selectDownloadedTracks } from 'store/downloads/selectors';
import { Header, SubHeader } from 'components/Typography';
import { Text } from 'components/Typography';

import CoverImage from 'components/CoverImage';

const styles = StyleSheet.create({
    index: {
        width: 16,
        marginRight: 8
    },
    activeText: {
        color: THEME_COLOR,
        fontWeight: '500',
    },
});

const AlbumImageContainer = styled.View`
    margin: 0 12px 24px 12px;
    flex: 1;
    align-items: center;
`;

const TrackContainer = styled.View<{ isPlaying: boolean }>`
    padding: 12px 4px;
    flex-direction: row;
    border-radius: 6px;

    ${props => props.isPlaying && css`
        margin: 0 -12px;
        padding: 12px 16px;
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
        trackIds.forEach((trackId) => dispatch(queueTrackForDownload(trackId)));
    }, [dispatch, trackIds]);
    const deleteAllTracks = useCallback(() => {
        downloadedTracks.forEach((trackId) => dispatch(removeDownloadedTrack(trackId)));
    }, [dispatch, downloadedTracks]);

    return (
        <ScrollView
            style={defaultStyles.view}
            contentContainerStyle={{ padding: 24, paddingTop: 32, paddingBottom: 64 }}
            refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={refresh} />
            }
        >
            <AlbumImageContainer>
                <CoverImage src={getImage(entityId)} />
            </AlbumImageContainer>
            <Header>{title}</Header>
            <SubHeader>{artist}</SubHeader>
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
                            <Text
                                style={[
                                    styles.index,
                                    { opacity: 0.25 },
                                    currentTrack?.backendId === trackId && styles.activeText
                                ]}
                                numberOfLines={1}
                            >
                                {listNumberingStyle === 'index' 
                                    ? i + 1
                                    : tracks[trackId]?.IndexNumber}
                            </Text>
                            <Text
                                style={{ 
                                    ...currentTrack?.backendId === trackId && styles.activeText,
                                    flexShrink: 1,
                                    marginRight: 4,
                                }}
                                numberOfLines={1}
                            >
                                {tracks[trackId]?.Name}
                            </Text>
                            <View style={{ marginLeft: 'auto', flexDirection: 'row' }}>
                                <Text
                                    style={[
                                        { marginRight: 12, opacity: 0.25 },
                                        currentTrack?.backendId === trackId && styles.activeText
                                    ]}
                                    numberOfLines={1}
                                >
                                    {Math.round(tracks[trackId]?.RunTimeTicks / 10000000 / 60)}
                                    :{Math.round(tracks[trackId]?.RunTimeTicks / 10000000 % 60).toString().padStart(2, '0')}
                                </Text>
                                <DownloadIcon trackId={trackId} fill={currentTrack?.backendId === trackId ? `${THEME_COLOR}44` : undefined} />
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