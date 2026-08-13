import useDefaultStyles from '@/components/Colors';
import React, { useCallback, useMemo } from 'react';
import { Alert, FlatListProps, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import formatBytes from '@/utility/formatBytes';
import TrashIcon from '@/assets/icons/trash.svg';
import ArrowClockwise from '@/assets/icons/arrow-clockwise.svg';
import { Downloads as DownloadQueue } from '@/store/downloads/download-manager';
import { useDownloads } from '@/store/downloads/hooks';
import Button from '@/components/Button';
import DownloadIcon from '@/components/DownloadIcon';
import styled from 'styled-components/native';
import { Text } from '@/components/Typography';
import Artwork from '@/store/sources/artwork-manager';
import { ShadowWrapper } from '@/components/Shadow';
import { SafeFlatList } from '@/components/SafeNavigatorView';
import { t } from '@/localisation';
import BaseAlbumImage from '../Music/stacks/components/AlbumImage';
import type { DownloadWithTrack } from '@/store/downloads/hooks';


const DownloadedTrack = styled.View`
    flex: 1 0 auto;
    flex-direction: row;
    padding: 8px 0;
    align-items: center;
    margin: 0 20px;
`;

const AlbumImage = styled(BaseAlbumImage)`
    height: 32px;
    width: 32px;
    border-radius: 4px;
`;

const ErrorWrapper = styled.View`
    padding: 2px 16px 8px 16px;
`;

/**
 * A single download row.
 */
function DownloadRow({
    download,
    onDelete,
    onRetry,
}: {
    download: DownloadWithTrack;
    onDelete: (download: DownloadWithTrack) => void;
    onRetry: (download: DownloadWithTrack) => void;
}) {
    const { track } = download;
    const defaultStyles = useDefaultStyles();

    const downloadSize = download.fileSize ?? null;

    const downloadError = useMemo(() => {
        if (!download.metadata) return null;
        const meta = download.metadata as { error?: string } | null;
        return meta?.error ?? null;
    }, [download.metadata]);

    const handleDelete = useCallback(() => onDelete(download), [download, onDelete]);
    const handleRetry = useCallback(() => onRetry(download), [download, onRetry]);

    return (
        <>
            <DownloadedTrack>
                <View style={{ marginRight: 12 }}>
                    <ShadowWrapper size="small">
                        <AlbumImage source={{ uri: Artwork.getUrl(track) }} style={defaultStyles.imageBackground} />
                    </ShadowWrapper>
                </View>
                <View style={{ flexShrink: 1, marginRight: 8 }}>
                    <Text style={[{ fontSize: 16, marginBottom: 4 }, defaultStyles.text]} numberOfLines={1}>
                        {track?.name}
                    </Text>
                    <Text style={[{ flexShrink: 1, fontSize: 11 }, defaultStyles.textHalfOpacity]} numberOfLines={1}>
                        {track?.albumArtist} {track?.album ? `— ${track.album}` : ''}
                    </Text>
                </View>
                <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }}>
                    {download.isComplete && downloadSize ? (
                        <Text style={[defaultStyles.textQuarterOpacity, { marginRight: 12, fontSize: 12 }]}>
                            {formatBytes(downloadSize)}
                        </Text>
                    ) : null}
                    <View style={{ marginRight: 12 }}>
                        <DownloadIcon track={track ? { ...track, download } : null} />
                    </View>
                    <Button
                        onPress={handleDelete}
                        size="small"
                        icon={TrashIcon}
                        testID={`delete-track-${download.id}`}
                    />
                    {!download.isComplete && (
                        <Button
                            onPress={handleRetry}
                            size="small"
                            icon={ArrowClockwise}
                            style={{ marginLeft: 4 }}
                        />
                    )}
                </View>
            </DownloadedTrack>
            {downloadError && (
                <ErrorWrapper>
                    <Text style={defaultStyles.themeColor}>
                        {downloadError}
                    </Text>
                </ErrorWrapper>
            )}
        </>
    );
}

function Downloads() {
    const defaultStyles = useDefaultStyles();

    const { data: downloads } = useDownloads();

    const totalDownloadSize = useMemo(() => (
        (downloads ?? []).reduce<number>((sum, d) => sum + (d.fileSize ?? 0), 0)
    ), [downloads]);

    const failedDownloads = useMemo(
        () => (downloads ?? []).filter(d => !d.isComplete),
        [downloads],
    );

    /**
     * Handlers for actions in this component
     */

    // Delete a single downloaded track
    const handleDelete = useCallback(async (download: DownloadWithTrack) => {
        await DownloadQueue.remove(download);
    }, []);

    // Delete all downloaded tracks
    const handleDeleteAllTracks = useCallback(() => {
        Alert.alert(
            t('delete-all-tracks'),
            t('confirm-delete-all-tracks'),
            [{
                text: t('delete'),
                style: 'destructive',
                onPress() {
                    (downloads ?? []).forEach(d => DownloadQueue.remove(d));
                },
            }, {
                text: t('cancel'),
                style: 'cancel',
            }]
        );
    }, [downloads]);

    // Retry a single failed track
    const retryTrack = useCallback(async (download: DownloadWithTrack) => {
        if (download.track) await DownloadQueue.enqueue(download.track);
    }, []);

    // Retry all failed tracks
    const handleRetryFailed = useCallback(() => {
        failedDownloads.forEach(d => { if (d.track) DownloadQueue.enqueue(d.track); });
    }, [failedDownloads]);

    /**
     * Render section
     */

    const ListHeaderComponent = useMemo(() => (
        <View style={[{ paddingHorizontal: 20, paddingBottom: 12, paddingTop: 12, borderBottomWidth: 0.5 }, defaultStyles.border]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
                <View>
                    <Text style={[
                        defaultStyles.text,
                        { fontSize: 16, fontWeight: '600' },
                    ]}>
                        {formatBytes(totalDownloadSize)}
                    </Text>
                    <Text
                        style={[
                            defaultStyles.textHalfOpacity,
                            { fontSize: 12 },
                        ]}
                        numberOfLines={1}
                    >
                        {t('total-download-size')}
                    </Text>
                </View>
                <Button
                    icon={TrashIcon}
                    onPress={handleDeleteAllTracks}
                    title={t('delete-all-tracks')}
                    disabled={!(downloads ?? []).length}
                    testID="delete-all-tracks"
                    style={{ flexShrink: 1, flexGrow: 0 }}
                />
            </View>
            {failedDownloads.length > 0 && (
                <Button
                    icon={ArrowClockwise}
                    title={t('retry-failed-downloads')}
                    onPress={handleRetryFailed}
                    disabled={failedDownloads.length === 0}
                    style={{ marginTop: 4 }}
                />
            )}
        </View>
    ), [totalDownloadSize, defaultStyles, failedDownloads.length, handleRetryFailed, handleDeleteAllTracks, downloads]);

    const renderItem = useCallback<NonNullable<FlatListProps<DownloadWithTrack>['renderItem']>>(({ item }) => (
        <DownloadRow
            download={item}
            onDelete={handleDelete}
            onRetry={retryTrack}
        />
    ), [handleDelete, retryTrack]);

    // If no tracks have been downloaded, show a short message describing this
    if (!(downloads ?? []).length) {
        return (
            <View style={{ margin: 24, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[{ textAlign: 'center' }, defaultStyles.textHalfOpacity]}>
                    {t('no-downloads')}
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            {ListHeaderComponent}
            <SafeFlatList
                top={false}
                data={downloads ?? [] as DownloadWithTrack[]}
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1 }}
                renderItem={renderItem}
                keyExtractor={item => item.id}
            />
        </SafeAreaView>
    );
}

export default Downloads;