import React, { PropsWithChildren, useCallback, useMemo } from 'react';
import { Platform, RefreshControl, StyleSheet, View } from 'react-native';
import Artwork from '@/store/sources/artwork-manager';
import { t } from '@/localisation';
import styled, { css } from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import { useAlbum } from '@/store/albums/hooks';
import { usePlaylist } from '@/store/playlists/hooks';
import TouchableHandler from '@/components/TouchableHandler';
import useCurrentTrack from '@/utility/useCurrentTrack';
import Play from '@/assets/icons/play.svg';
import Shuffle from '@/assets/icons/shuffle.svg';
import useDefaultStyles from '@/components/Colors';
import usePlayTracks from '@/utility/usePlayTracks';
import { WrappableButtonRow, WrappableButton } from '@/components/WrappableButtonRow';
import { NavigationProp } from '@/screens/types';
import DownloadIcon from '@/components/DownloadIcon';
import CloudDownArrow from '@/assets/icons/cloud-down-arrow.svg';
import Trash from '@/assets/icons/trash.svg';
import { Downloads } from '@/store/downloads/download-manager';
import { Header, SubHeader } from '@/components/Typography';
import { Text } from '@/components/Typography';
import { SafeScrollView, useNavigationOffsets } from '@/components/SafeNavigatorView';
import CoverImage from '@/components/CoverImage';
import Divider from '@/components/Divider';
import { ticksToDuration } from '@/utility/ticksToDuration';
import type { TrackWithDownload } from '@/store/tracks/hooks';
import type { EntityId } from '@/store/types';

const styles = StyleSheet.create({
    index: {
        marginRight: 12,
        textAlign: 'right',
    },
    activeText: {
        fontWeight: '500',
    },
    discContainer: {
        flexDirection: 'row',
        gap: 24,
        alignItems: 'center',
        marginBottom: 12,
    }
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
        padding: ${Platform.select({ ios: '8px 4px', android: '4px' })};
    `}
`;

export interface TrackListViewProps extends PropsWithChildren<{}> {
    title?: string;
    artist?: string;
    /** The ordered list of tracks to display, each paired with its download row. */
    tracks: TrackWithDownload[];
    /** The EntityId of the album or playlist being displayed, used to look up the cover image. */
    entityId: EntityId;
    refresh: () => void;
    isLoading?: boolean;
    playButtonText: string;
    shuffleButtonText: string;
    downloadButtonText: string;
    deleteButtonText: string;
    listNumberingStyle?: 'album' | 'index';
    itemDisplayStyle?: 'album' | 'playlist';
}

/**
 * Groups an array of items by a key-extraction function.
 */
function groupBy<T>(items: T[], keyFn: (item: T) => unknown): Record<string, T[]> {
    const result: Record<string, T[]> = {};
    for (const item of items) {
        const key = String(keyFn(item) ?? 'undefined');
        if (!result[key]) result[key] = [];
        result[key].push(item);
    }
    return result;
}

const TrackListView: React.FC<TrackListViewProps> = ({
    tracks,
    entityId,
    title,
    artist,
    refresh,
    isLoading = false,
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

    const [sourceId, itemId] = entityId;

    // Retrieve the cover image entity — either an album or a playlist
    const { data: albumEntity } = useAlbum([sourceId, itemId]);
    const { data: playlistEntity } = usePlaylist([sourceId, itemId]);
    const coverEntity = itemDisplayStyle === 'album' ? albumEntity : playlistEntity;

    // Derived lists
    const downloadedTracks = useMemo(
        () => tracks.filter(t => t.download?.isComplete),
        [tracks]
    );

    const totalDuration = useMemo(
        () => tracks.reduce<number>((sum, t) => sum + (t.runTimeTicks ?? 0), 0),
        [tracks]
    );

    // Split tracks into disc groups when rendering in album style
    const trackGroups = useMemo((): [string, TrackWithDownload[]][] => {
        if (listNumberingStyle !== 'album') {
            return [['0', tracks]];
        }
        const groups = groupBy(tracks, t => t.parentIndexNumber);
        return Object.entries(groups);
    }, [tracks, listNumberingStyle]);

    // Compute the minimum width needed for the track-number column
    const { indexWidth } = useMemo(() => {
        const largestIndex = tracks.reduce((max, track, i) => {
            const index = listNumberingStyle === 'index'
                ? i + 1
                : (track.indexNumber ?? 0);
            return index > max ? index : max;
        }, 0);
        const noDigits = largestIndex.toFixed(0).toString().length;
        return StyleSheet.create({ indexWidth: { minWidth: noDigits * 8 } });
    }, [tracks, listNumberingStyle]);

    // Retrieve helpers
    const playTracks = usePlayTracks();
    const { track: currentTrack } = useCurrentTrack();
    const navigation = useNavigation<NavigationProp>();

    // Callbacks
    const playEntity = useCallback(() => { playTracks(tracks); }, [playTracks, tracks]);
    const shuffleEntity = useCallback(() => { playTracks(tracks, { shuffle: true }); }, [playTracks, tracks]);

    const selectTrack = useCallback(async (trackId: string) => {
        const index = tracks.findIndex(t => t.id === trackId);
        if (index >= 0) {
            await playTracks(tracks, { playIndex: index });
        }
    }, [playTracks, tracks]);

    const longPressTrack = useCallback((trackId: string) => {
        navigation.navigate('TrackPopupMenu', { trackId: [sourceId, trackId] });
    }, [navigation, sourceId]);

    const downloadAllTracks = useCallback(() => {
        tracks.forEach(t => Downloads.enqueue(t));
    }, [tracks]);

    const deleteAllTracks = useCallback(() => {
        downloadedTracks.forEach(t => { if (t.download) Downloads.remove(t.download); });
    }, [downloadedTracks]);

    const renderTrack = useCallback((track: TrackWithDownload, i: number) => {
        const isPlaying = currentTrack?.entityId?.[1] === track.id;

        return (
            <TouchableHandler
                key={track.id}
                id={track.id}
                onPress={selectTrack}
                onLongPress={longPressTrack}
                testID={`play-track-${track.id}`}
            >
                <TrackContainer
                    isPlaying={isPlaying}
                    style={[
                        defaultStyles.border,
                        isPlaying ? defaultStyles.activeBackground : null
                    ]}
                >
                    <Text
                        style={[
                            styles.index,
                            defaultStyles.textQuarterOpacity,
                            isPlaying && styles.activeText,
                            isPlaying && defaultStyles.themeColorQuarterOpacity,
                            indexWidth,
                        ]}
                        numberOfLines={1}
                    >
                        {listNumberingStyle === 'index' ? i + 1 : track.indexNumber}
                    </Text>
                    <View style={{ flexShrink: 1 }}>
                        <Text
                            style={[
                                isPlaying && styles.activeText,
                                isPlaying && defaultStyles.themeColor,
                                { flexShrink: 1, marginRight: 4 },
                            ]}
                            numberOfLines={1}
                        >
                            {track.name}
                        </Text>
                        {itemDisplayStyle === 'playlist' && (
                            <Text
                                style={[
                                    isPlaying && styles.activeText,
                                    isPlaying && defaultStyles.themeColor,
                                    {
                                        flexShrink: 1,
                                        marginRight: 4,
                                        opacity: isPlaying ? 0.5 : 0.25,
                                    },
                                ]}
                                numberOfLines={1}
                            >
                                {track.albumArtist}
                            </Text>
                        )}
                    </View>
                    <View style={{ marginLeft: 'auto', flexDirection: 'row' }}>
                        <Text
                            style={[
                                { marginRight: 12 },
                                defaultStyles.textQuarterOpacity,
                                isPlaying && styles.activeText,
                                isPlaying && defaultStyles.themeColorQuarterOpacity,
                            ]}
                            numberOfLines={1}
                        >
                            {ticksToDuration(track.runTimeTicks ?? 0)}
                        </Text>
                        <DownloadIcon
                            track={track}
                            fill={isPlaying ? defaultStyles.themeColorQuarterOpacity.color : undefined}
                        />
                    </View>
                </TrackContainer>
            </TouchableHandler>
        );
    }, [
        currentTrack,
        defaultStyles,
        indexWidth,
        itemDisplayStyle,
        listNumberingStyle,
        longPressTrack,
        selectTrack,
    ]);

    return (
        <SafeScrollView
            style={defaultStyles.view}
            refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={refresh} progressViewOffset={offsets.top} />
            }
        >
            <View style={{ padding: 24, paddingTop: 32, paddingBottom: 32 }}>
                <AlbumImageContainer>
                    <CoverImage src={Artwork.getUrl(coverEntity)} />
                </AlbumImageContainer>
                <Header>{title}</Header>
                <SubHeader>{artist}</SubHeader>
                <WrappableButtonRow>
                    <WrappableButton title={playButtonText} icon={Play} onPress={playEntity} testID="play-album" />
                    <WrappableButton title={shuffleButtonText} icon={Shuffle} onPress={shuffleEntity} testID="shuffle-album" />
                </WrappableButtonRow>
                <View style={{ marginTop: 8 }}>
                    {trackGroups.map(([discNo, groupTracks]) => (
                        <View key={`disc_${discNo}`} style={{ marginBottom: 24 }}>
                            {trackGroups.length > 1 && (
                                <View style={styles.discContainer}>
                                    <SubHeader>{t('disc')} {discNo}</SubHeader>
                                    <Divider />
                                </View>
                            )}
                            {groupTracks.map((track, i) => renderTrack(track, i))}
                        </View>
                    ))}
                    <Text style={{ paddingTop: 24, paddingBottom: 12, textAlign: 'center', opacity: 0.5 }}>
                        {t('total-duration')}{': '}{ticksToDuration(totalDuration)}
                    </Text>
                    <WrappableButtonRow style={{ marginTop: 24 }}>
                        <WrappableButton
                            icon={CloudDownArrow}
                            title={downloadButtonText}
                            onPress={downloadAllTracks}
                            disabled={downloadedTracks.length === tracks.length}
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