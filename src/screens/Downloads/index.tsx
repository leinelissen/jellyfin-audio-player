import useDefaultStyles from 'components/Colors';
import React, { useCallback, useMemo } from 'react';
import { FlatListProps, Text, TouchableOpacity, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTypedSelector } from 'store';
import formatBytes from 'utility/formatBytes';
import TrashIcon from 'assets/icons/trash.svg';
import ArrowClockwise from 'assets/icons/arrow-clockwise.svg';
import { THEME_COLOR } from 'CONSTANTS';
import { useDispatch } from 'react-redux';
import { EntityId } from '@reduxjs/toolkit';
import { queueTrackForDownload, removeDownloadedTrack } from 'store/downloads/actions';
import Button from 'components/Button';
import { t } from 'i18n-js';
import DownloadIcon from 'components/DownloadIcon';
import styled from 'styled-components/native';

const DownloadedTrack = styled.View`
    flex: 1 0 auto;
    flex-direction: row;
    padding: 8px 0;
    align-items: center;
    margin: 0 20px;
    border-bottom-width: 1px;
`;

function Downloads() {
    const defaultStyles = useDefaultStyles();
    const dispatch = useDispatch();

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
        <View style={{ marginHorizontal: 20, marginBottom: 12 }}>
            <Text style={[{ textAlign: 'center', marginVertical: 6 }, defaultStyles.textHalfOpacity]}>
                {t('total-download-size')}: {formatBytes(totalDownloadSize)}
            </Text>
            <Button
                icon={TrashIcon}
                title={t('delete-all-tracks')}
                onPress={handleDeleteAllTracks}
                disabled={!ids.length}
                style={{ marginTop: 8 }}
            />
            <Button
                icon={ArrowClockwise}
                title={t('retry-failed-downloads')}
                onPress={handleRetryFailed}
                disabled={failedIds.length === 0}
                style={{ marginTop: 4 }}
            />
        </View>
    ), [totalDownloadSize, defaultStyles, failedIds.length, handleRetryFailed, handleDeleteAllTracks, ids.length]);
    
    const renderItem = useCallback<NonNullable<FlatListProps<EntityId>['renderItem']>>(({ item }) => (
        <DownloadedTrack style={defaultStyles.border}>
            <View style={{ marginRight: 12 }}>
                <DownloadIcon trackId={item} />
            </View>
            <View style={{ flexShrink: 1, marginRight: 8 }}>
                <Text style={[{ fontSize: 16, marginBottom: 4 }, defaultStyles.text]} numberOfLines={1}>
                    {tracks[item]?.Name}
                </Text>
                <Text style={[{ flexShrink: 1, fontSize: 11 }, defaultStyles.textHalfOpacity]} numberOfLines={1}>
                    {tracks[item]?.AlbumArtist} ({tracks[item]?.Album})
                </Text>
            </View>
            <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }}>
                {entities[item]?.isComplete && entities[item]?.size ? (
                    <Text style={[defaultStyles.textHalfOpacity, { marginRight: 6, fontSize: 12 }]}>
                        {formatBytes(entities[item]?.size || 0)}
                    </Text>
                ) : null}
                <TouchableOpacity onPress={() => handleDelete(item)}>
                    <TrashIcon height={24} width={24} fill={THEME_COLOR} />
                </TouchableOpacity>
                {!entities[item]?.isComplete && (
                    <TouchableOpacity onPress={() => retryTrack(item)}>
                        <ArrowClockwise height={18} width={18} fill={THEME_COLOR} />
                    </TouchableOpacity>
                )}
            </View>
        </DownloadedTrack>
    ), [entities, retryTrack, handleDelete, defaultStyles, tracks]);

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
            <FlatList
                data={ids}
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1 }}
                ListHeaderComponent={ListHeaderComponent}
                renderItem={renderItem}
            />
        </SafeAreaView>
    );
}

export default Downloads;
