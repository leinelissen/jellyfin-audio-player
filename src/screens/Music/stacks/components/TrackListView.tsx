import React, { PropsWithChildren, useCallback, useMemo } from 'react';
import { Platform, RefreshControl, StyleSheet, View } from 'react-native';
import { useGetImage } from '@/utility/JellyfinApi/lib';
import styled, { css } from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useTypedSelector } from '@/store';
import TouchableHandler from '@/components/TouchableHandler';
import useCurrentTrack from '@/utility/useCurrentTrack';
import TrackPlayer from 'react-native-track-player';
import Play from '@/assets/icons/play.svg';
import Shuffle from '@/assets/icons/shuffle.svg';
import useDefaultStyles from '@/components/Colors';
import usePlayTracks from '@/utility/usePlayTracks';
import { WrappableButtonRow, WrappableButton } from '@/components/WrappableButtonRow';
import { NavigationProp } from '@/screens/types';
import DownloadIcon from '@/components/DownloadIcon';
import CloudDownArrow from '@/assets/icons/cloud-down-arrow.svg';
import Trash from '@/assets/icons/trash.svg';
import { queueTrackForDownload, removeDownloadedTrack } from '@/store/downloads/actions';
import { selectDownloadedTracks } from '@/store/downloads/selectors';
import { Header, SubHeader } from '@/components/Typography';
import { Text } from '@/components/Typography';

import CoverImage from '@/components/CoverImage';
import ticksToDuration from '@/utility/ticksToDuration';
import { t } from '@/localisation';
import { SafeScrollView, useNavigationOffsets } from '@/components/SafeNavigatorView';

const styles = StyleSheet.create({
    index: {
        marginRight: 12,
        textAlign: 'right',
    },
    activeText: {
        fontWeight: '500',
    },
});

const AlbumImageContainer = styled.View`
    margin: 0 12px 24px 12px;
    flex: 1;
    align-items: center;
`;

const TrackContainer = styled.View<{ isPlaying: boolean, small?: boolean }>`
    padding: 12px 4px;
    flex-direction: row;
    border-radius: 6px;
    align-items: flex-start;

    ${props => props.isPlaying && css`
        margin: 0 -12px;
        padding: 12px 16px;
    `}

    ${props => props.small && css`
        padding: ${Platform.select({ ios: '8px 4px', android: '4px'})};
    `}
`;

export interface TrackListViewProps extends PropsWithChildren<{}> {
    title?: string;
    artist?: string;
    trackIds: string[];
    entityId: string;
    refresh: () => void;
    playButtonText: string;
    shuffleButtonText: string;
    downloadButtonText: string;
    deleteButtonText: string;
    listNumberingStyle?: 'album' | 'index';
    itemDisplayStyle?: 'album' | 'playlist';
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
    itemDisplayStyle = 'album',
    children
}) => {
    const defaultStyles = useDefaultStyles();
    const offsets = useNavigationOffsets();

    // Retrieve state
    const tracks = useTypedSelector((state) => state.music.tracks.entities);
    const isLoading = useTypedSelector((state) => state.music.tracks.isLoading);
    const downloadedTracks = useTypedSelector(selectDownloadedTracks(trackIds));
    const totalDuration = useMemo(() => (
        trackIds.reduce<number>((sum, trackId) => (
            sum + (tracks[trackId]?.RunTimeTicks || 0)
        ), 0)
    ), [trackIds, tracks]);

    // Retrieve helpers
    const getImage = useGetImage();
    const playTracks = usePlayTracks();
    const { track: currentTrack } = useCurrentTrack();
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useAppDispatch();

    // Visual helpers
    const { indexWidth } = useMemo(() => {
        // Retrieve the largest index in the current set of tracks
        const largestIndex = trackIds.reduce((max, trackId, i) => {
            // Retrieve the index for this trackid, depending on settings
            const index = listNumberingStyle === 'index' 
                ? i + 1
                : tracks[trackId]?.IndexNumber;

            // Check that the current index is larger than the current max.
            return index > max ? index: max;
        }, 0);
        
        // Retrieve the number of digits in the largest index
        const noDigits = largestIndex.toFixed(0).toString().length;

        // Set a minWidth proportional to the largest amount of digits in an index
        return StyleSheet.create({ indexWidth: { minWidth: noDigits * 8 } });
    }, [trackIds, tracks, listNumberingStyle]);

    // Setup callbacks
    const playEntity = useCallback(() => { playTracks(trackIds); }, [playTracks, trackIds]);
    const shuffleEntity = useCallback(() => { playTracks(trackIds, { shuffle: true }); }, [playTracks, trackIds]);
    const selectTrack = useCallback(async (index: number) => {
        await playTracks(trackIds, { play: false });
        await TrackPlayer.skip(index);
        await TrackPlayer.play();
    }, [playTracks, trackIds]);
    const longPressTrack = useCallback((index: number) => { 
        navigation.navigate('TrackPopupMenu', { trackId: trackIds[index].toString() }); 
    }, [navigation, trackIds]);
    const downloadAllTracks = useCallback(() => {
        trackIds.forEach((trackId) => dispatch(queueTrackForDownload(trackId)));
    }, [dispatch, trackIds]);
    const deleteAllTracks = useCallback(() => {
        downloadedTracks.forEach((trackId) => dispatch(removeDownloadedTrack(trackId)));
    }, [dispatch, downloadedTracks]);

    return (
        <SafeScrollView
            style={defaultStyles.view}
            refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={refresh} progressViewOffset={offsets.top} />
            }
        >
            <View style={{ padding: 24, paddingTop: 32, paddingBottom: 32 }}>
                <AlbumImageContainer>
                    <CoverImage src={getImage(entityId)} />
                </AlbumImageContainer>
                <Header>{title}</Header>
                <SubHeader>{artist}</SubHeader>
                <WrappableButtonRow>
                    <WrappableButton title={playButtonText} icon={Play} onPress={playEntity} testID="play-album" />
                    <WrappableButton title={shuffleButtonText} icon={Shuffle} onPress={shuffleEntity} testID="shuffle-album" />
                </WrappableButtonRow>
                <View style={{ marginTop: 8 }}>
                    {trackIds.map((trackId, i) =>
                        <TouchableHandler
                            key={trackId}
                            id={i}
                            onPress={selectTrack}
                            onLongPress={longPressTrack}
                            testID={`play-track-${trackId}`}
                        >
                            <TrackContainer
                                isPlaying={currentTrack?.backendId === trackId || false}
                                style={[
                                    defaultStyles.border,
                                    currentTrack?.backendId === trackId ? defaultStyles.activeBackground : null 
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.index,
                                        defaultStyles.textQuarterOpacity,
                                        currentTrack?.backendId === trackId && styles.activeText,
                                        currentTrack?.backendId === trackId && defaultStyles.themeColorQuarterOpacity,
                                        indexWidth,
                                    ]}
                                    numberOfLines={1}
                                >
                                    {listNumberingStyle === 'index' 
                                        ? i + 1
                                        : tracks[trackId]?.IndexNumber}
                                </Text>
                                <View style={{ flexShrink: 1 }}>
                                    <Text
                                        style={[
                                            currentTrack?.backendId === trackId && styles.activeText,
                                            currentTrack?.backendId === trackId && defaultStyles.themeColor,
                                            { 
                                                flexShrink: 1,
                                                marginRight: 4,
                                            }
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {tracks[trackId]?.Name}
                                    </Text>
                                    {itemDisplayStyle === 'playlist' && (
                                        <Text
                                            style={[
                                                currentTrack?.backendId === trackId && styles.activeText,
                                                currentTrack?.backendId === trackId && defaultStyles.themeColor,
                                                { 
                                                    flexShrink: 1,
                                                    marginRight: 4,
                                                    opacity: currentTrack?.backendId === trackId ? 0.5 : 0.25,
                                                }
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {tracks[trackId]?.Artists.join(', ')}
                                        </Text>
                                    )}
                                </View>
                                <View style={{ marginLeft: 'auto', flexDirection: 'row' }}>
                                    <Text
                                        style={[
                                            { marginRight: 12 },
                                            defaultStyles.textQuarterOpacity,
                                            currentTrack?.backendId === trackId && styles.activeText,
                                            currentTrack?.backendId === trackId && defaultStyles.themeColorQuarterOpacity,
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {ticksToDuration(tracks[trackId]?.RunTimeTicks || 0)}
                                    </Text>
                                    <DownloadIcon
                                        trackId={trackId}
                                        fill={currentTrack?.backendId === trackId ? defaultStyles.themeColorQuarterOpacity.color : undefined}
                                    />
                                </View>
                            </TrackContainer>
                        </TouchableHandler>
                    )}
                    <Text style={{ paddingTop: 24, paddingBottom: 12, textAlign: 'center', opacity: 0.5 }}>
                        {t('total-duration')}{': '}{ticksToDuration(totalDuration)}
                    </Text>
                    <WrappableButtonRow style={{ marginTop: 24 }}>
                        <WrappableButton
                            icon={CloudDownArrow}
                            title={downloadButtonText}
                            onPress={downloadAllTracks}
                            disabled={downloadedTracks.length === trackIds.length}
                            testID="download-album"
                        />
                        <WrappableButton
                            icon={Trash}
                            title={deleteButtonText}
                            onPress={deleteAllTracks}
                            disabled={downloadedTracks.length === 0}
                            testID="delete-album"
                        />
                    </WrappableButtonRow>
                </View>
                {children}
            </View>
        </SafeScrollView>
    );
};

export default TrackListView;