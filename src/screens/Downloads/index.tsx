import useDefaultStyles from '@/components/Colors';
import React, { useCallback, useMemo } from 'react';
import { FlatListProps, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useTypedSelector } from '@/store';
import formatBytes from '@/utility/formatBytes';
import TrashIcon from 'assets/icons/trash.svg';
import ArrowClockwise from 'assets/icons/arrow-clockwise.svg';
import { EntityId } from '@reduxjs/toolkit';
import { queueTrackForDownload, removeDownloadedTrack } from '@/store/downloads/actions';
import Button from '@/components/Button';
import { t } from 'i18n-js';
import DownloadIcon from '@/components/DownloadIcon';
import styled from 'styled-components/native';
import { Text } from '@/components/Typography';
import FastImage from 'react-native-fast-image';
import { useGetImage } from '@/utility/JellyfinApi';
import { ShadowWrapper } from '@/components/Shadow';
import { SafeFlatList } from '@/components/SafeNavigatorView';

const DownloadedTrack = styled.View`
    flex: 1 0 auto;
    flex-direction: row;
    padding: 8px 0;
    align-items: center;
    margin: 0 20px;
`;

const AlbumImage = styled(FastImage)`
    height: 32px;
    width: 32px;
    border-radius: 4px;
`;

function Downloads() {
    const defaultStyles = useDefaultStyles();
    const dispatch = useAppDispatch();
    const getImage = useGetImage();

    const { entities, ids } = useTypedSelector((state) => state.downloads);
    const tracks = useTypedSelector((state) => state.music.tracks.entities);

    // Calculate the total download size
    const totalDownloadSize = useMemo(() => (
        ids?.reduce<number>((sum, id) => sum + (entities[id]?.size || 0), 0)
    ), [ids, entities]);

    /**
     * Handlers for actions in this components
     */

    // Delete a single downloaded track
    const handleDelete = useCallback((id: EntityId) => {
        dispatch(removeDownloadedTrack(id));
    }, [dispatch]);

    // Delete all downloaded tracks
    const handleDeleteAllTracks = useCallback(() => ids.forEach(handleDelete), [handleDelete, ids]);

    // Retry a single failed track
    const retryTrack = useCallback((id: EntityId) => {
        dispatch(queueTrackForDownload(id));
    }, [dispatch]);

    // Retry all failed tracks
    const failedIds = useMemo(() => ids.filter((id) => !entities[id]?.isComplete), [ids, entities]);
    const handleRetryFailed = useCallback(() => (
        failedIds.forEach(retryTrack)
    ), [failedIds, retryTrack]);

    /**
     * Render section
     */

    const ListHeaderComponent = useMemo(() => (
        <View style={[{ paddingHorizontal: 20, paddingBottom: 12, paddingTop: 12, borderBottomWidth: 0.5 }, defaultStyles.border]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text 
                    style={[
                        defaultStyles.textHalfOpacity,
                        { marginRight: 8, flex: 1, fontSize: 12 },
                    ]}
                    numberOfLines={1}
                >
                    {t('total-download-size')}{': '}{formatBytes(totalDownloadSize)}
                </Text>
                <Button
                    icon={TrashIcon}
                    title={t('delete-all-tracks')}
                    onPress={handleDeleteAllTracks}
                    disabled={!ids.length}
                    size="small"
                    testID="delete-all-tracks"
                />
            </View>
            {failedIds.length > 0 && (
                <Button
                    icon={ArrowClockwise}
                    title={t('retry-failed-downloads')}
                    onPress={handleRetryFailed}
                    disabled={failedIds.length === 0}
                    style={{ marginTop: 4 }}
                />
            )}
        </View>
    ), [totalDownloadSize, defaultStyles, failedIds.length, handleRetryFailed, handleDeleteAllTracks, ids.length]);
    
    const renderItem = useCallback<NonNullable<FlatListProps<EntityId>['renderItem']>>(({ item }) => (
        <DownloadedTrack>
            <View style={{ marginRight: 12 }}>
                <ShadowWrapper size="small">
                    <AlbumImage source={{ uri: getImage(item as string) }} style={defaultStyles.imageBackground} />
                </ShadowWrapper>
            </View>
            <View style={{ flexShrink: 1, marginRight: 8 }}>
                <Text style={[{ fontSize: 16, marginBottom: 4 }, defaultStyles.text]} numberOfLines={1}>
                    {tracks[item]?.Name}
                </Text>
                <Text style={[{ flexShrink: 1, fontSize: 11 }, defaultStyles.textHalfOpacity]} numberOfLines={1}>
                    {tracks[item]?.AlbumArtist} {tracks[item]?.Album ? `— ${tracks[item]?.Album}` : ''}
                </Text>
            </View>
            <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }}>
                {entities[item]?.isComplete && entities[item]?.size ? (
                    <Text style={[defaultStyles.textQuarterOpacity, { marginRight: 12, fontSize: 12 }]}>
                        {formatBytes(entities[item]?.size || 0)}
                    </Text>
                ) : null}
                <View style={{ marginRight: 12 }}>
                    <DownloadIcon trackId={item} />
                </View>
                <Button onPress={() => handleDelete(item)} size="small" icon={TrashIcon} testID={`delete-track-${item}`} />
                {!entities[item]?.isComplete && (
                    <Button onPress={() => retryTrack(item)} size="small" icon={ArrowClockwise} style={{ marginLeft: 4 }} />
                )}
            </View>
        </DownloadedTrack>
    ), [entities, retryTrack, handleDelete, defaultStyles, tracks, getImage]);

    // If no tracks have been downloaded, show a short message describing this
    if (!ids.length) {
        return (
            <View style={{ margin: 24, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[{ textAlign: 'center'}, defaultStyles.textHalfOpacity]}>
                    {t('no-downloads')}
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            {ListHeaderComponent}
            <SafeFlatList
                data={ids}
                style={{ flex: 1, paddingTop: 12 }}
                contentContainerStyle={{ flexGrow: 1 }}
                renderItem={renderItem}
            />
        </SafeAreaView>
    );
}

export default Downloads;
