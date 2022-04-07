import React, { useCallback } from 'react';
import { Text, RefreshControl, StyleSheet, View, ListRenderItemInfo } from 'react-native';
import { useGetImage } from '@/utility/JellyfinApi/lib';
import styled, { css } from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useTypedSelector } from '@/store';
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
import { queueTrackForDownload } from '@/store/downloads/actions';
import { selectDownloadedTracks } from '@/store/downloads/selectors';
import SingleImage from '@/components/SingleImage';
import { Album, AlbumTrack } from '@/store/music/types';
import { FlatList } from 'react-native';

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
    trackIds: string[];
    refresh: () => void;
    playButtonText: string;
    shuffleButtonText: string;
    downloadButtonText: string;
}

interface GeneratedTrackItemProps {
    trackId: string;
    trackEntity: AlbumTrack;
    albumId: string; // tracks[trackId]?.AlbumId
    albumEntity: Album; // albums[tracks[trackId]?.AlbumId]
    isCurrentTrack: boolean; // currentTrack?.backendId === trackId
}

const GeneratedTrackItem = React.memo(function GeneratedTrackItem(props: GeneratedTrackItemProps) {
    const defaultStyles = useDefaultStyles();
    const { trackId, trackEntity, albumId, albumEntity, isCurrentTrack } = props;

    const getImage = useGetImage();

    return (
        <TrackContainer
            isPlaying={isCurrentTrack}
            style={[defaultStyles.border, isCurrentTrack || false ? defaultStyles.activeBackground : null]}
        >
            <SingleImage source={{ uri: getImage(albumEntity) }} style={defaultStyles.imageBackground} />

            <View style={[{ flexDirection: 'column', marginLeft: 20, marginRight: 10 }]}>
                <Text
                    style={[isCurrentTrack
                        ? { color: 'red', fontWeight: '700' }
                        : defaultStyles.text,
                    { flexWrap: 'wrap' },
                    ]}
                    numberOfLines={2}
                >
                    {trackEntity.Name}
                </Text>
                <Text
                    style={[
                        styles.artistTrackText,
                        isCurrentTrack
                            ? { color: 'red' }
                            : defaultStyles.text
                    ]}
                >
                    {trackEntity.AlbumArtist}
                </Text>
            </View>
            <View style={{ marginLeft: 'auto' }}>
                <DownloadIcon trackId={trackId} />
            </View>

        </TrackContainer>
    );
});

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
    const albums = useTypedSelector((state) => state.music.albums.entities);
    const isLoading = useTypedSelector((state) => state.music.tracks.isLoading);
    const downloadedTracks = useTypedSelector(selectDownloadedTracks(trackIds));

    // Retrieve helpers
    const getImage = useGetImage();
    const playTracks = usePlayTracks();
    const { track: currentTrack } = useCurrentTrack();
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useAppDispatch();

    // Setup callbacks
    const playEntity = useCallback(() => { playTracks(trackIds); }, [playTracks, trackIds]);
    const shuffleEntity = useCallback(() => { playTracks(trackIds, { shuffle: true }); }, [playTracks, trackIds]);
    const selectTrack = useCallback(async (trackId: string) => {
        const index = trackIds.findIndex((id) => id === trackId);
        if (index >= 0) {
            await playTracks(trackIds, { playIndex: index });
        }
    }, [playTracks, trackIds]);
    const longPressTrack = useCallback((trackId: string) => { 
        navigation.navigate('TrackPopupMenu', { trackId });
    }, [navigation]);
    const downloadAllTracks = useCallback(() => {
        trackIds.forEach((trackId) => dispatch(queueTrackForDownload(trackId)));
    }, [dispatch, trackIds]);

    const renderItem = (item: ListRenderItemInfo<string>) => {
        return (
            <View>
                <TouchableHandler
                    key={item.item}
                    id={item.item}
                    onPress={selectTrack}
                    onLongPress={longPressTrack}
                >
                    <GeneratedTrackItem
                        trackId={item.item}
                        trackEntity={tracks[item.item]}
                        albumId={tracks[item.item]?.AlbumId}
                        albumEntity={albums[tracks[item.item]?.AlbumId]}
                        isCurrentTrack={false}>

                    </GeneratedTrackItem>
                </TouchableHandler>
            </View>
        );
    }

    return (
        <FlatList
            ListHeaderComponent={
                <WrappableButtonRow>
                    <WrappableButton title={playButtonText} icon={Play} onPress={playEntity} />
                    <WrappableButton title={shuffleButtonText} icon={Shuffle} onPress={shuffleEntity} />
                </WrappableButtonRow>
            }
            data={trackIds}
            renderItem={renderItem}
            keyExtractor={item => tracks[item].Id}

            windowSize={50}
            maxToRenderPerBatch={25}

            contentContainerStyle={{ padding: 20, paddingBottom: 150, paddingTop: 100 }}
            refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={refresh} progressViewOffset={75} />
            }
            ListFooterComponent={
                <WrappableButtonRow style={{ marginTop: 24 }}>
                <WrappableButton
                    icon={CloudDownArrow}
                    title={downloadButtonText}
                    onPress={downloadAllTracks}
                    disabled={downloadedTracks.length === trackIds.length}
                />
            </WrappableButtonRow> 
            }
        />
    );
};

export default SinglesListView;