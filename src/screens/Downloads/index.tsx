import useDefaultStyles from 'components/Colors';
import React, { useCallback, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTypedSelector } from 'store';
import formatBytes from 'utility/formatBytes';
import TrashIcon from 'assets/trash.svg';
import { THEME_COLOR } from 'CONSTANTS';
import { useDispatch } from 'react-redux';
import { EntityId } from '@reduxjs/toolkit';
import { removeDownloadedTrack } from 'store/downloads/actions';
import Button from 'components/Button';
import { t } from 'i18n-js';

function Downloads() {
    const defaultStyles = useDefaultStyles();
    const dispatch = useDispatch();

    const { entities, ids } = useTypedSelector((state) => state.downloads);
    const tracks = useTypedSelector((state) => state.music.tracks.entities);

    // Calculate the total download size
    const totalDownloadSize = useMemo(() => (
        ids?.reduce<number>((sum, id) => sum + (entities[id]?.size || 0), 0)
    ), [ids, entities]);

    const handleDelete = useCallback((id: EntityId) => {
        dispatch(removeDownloadedTrack(id));
    }, [dispatch]);
    const handleDeleteAllTracks = useCallback(() => {
        ids.forEach((id) => dispatch(removeDownloadedTrack(id)));
    }, [dispatch, ids]);

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
        <SafeAreaView style={{ flex: 1, marginHorizontal: 24 }}>
            <FlatList
                style={{ flex: 1 }}
                ListHeaderComponent={
                    <Text style={[{ textAlign: 'center', marginVertical: 6 }, defaultStyles.textHalfOpacity]}>
                        {t('total-download-size')}: {formatBytes(totalDownloadSize)}
                    </Text>
                }
                ListFooterComponent={
                    <Button
                        icon={TrashIcon}
                        title={t('delete-all-tracks')}
                        onPress={handleDeleteAllTracks}
                        disabled={!ids.length}
                        style={{ marginTop: 8 }}
                    />
                }
                data={ids}
                renderItem={({ item }) => (
                    <View style={{ flex: 1, flexDirection: 'row', paddingVertical: 8, alignItems: 'center' }}>
                        <View>
                            <Text style={{ fontSize: 16, marginBottom: 4 }} numberOfLines={1}>{tracks[item]?.Name}</Text>
                            <Text style={[{ flexShrink: 1, fontSize: 11 }, defaultStyles.textHalfOpacity]} numberOfLines={1}>{tracks[item]?.AlbumArtist} ({tracks[item]?.Album})</Text>
                        </View>
                        <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[defaultStyles.textHalfOpacity, { marginRight: 6 }]}>
                                {formatBytes(entities[item]?.size || 0)}
                            </Text>
                            <Pressable onPress={() => handleDelete(item)}>
                                <TrashIcon height={24} width={24} fill={THEME_COLOR} />
                            </Pressable>
                        </View>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

export default Downloads;
