import React, { useCallback } from 'react';
import Modal from 'components/Modal';
import { useNavigation, StackActions, useRoute, RouteProp } from '@react-navigation/native';
import { ModalStackParams } from 'screens/types';
import { useTypedSelector } from 'store';
import { SubHeader } from 'components/Typography';
import styled from 'styled-components/native';
import { t } from '@localisation';
import PlayIcon from 'assets/icons/play.svg';
import DownloadIcon from 'assets/icons/cloud-down-arrow.svg';
import QueueAppendIcon from 'assets/icons/queue-append.svg';
import TrashIcon from 'assets/icons/trash.svg';
import Text from 'components/Text';
import { WrappableButton, WrappableButtonRow } from 'components/WrappableButtonRow';
import { useDispatch } from 'react-redux';
import { queueTrackForDownload, removeDownloadedTrack } from 'store/downloads/actions';
import usePlayTracks from 'utility/usePlayTracks';
import { selectIsDownloaded } from 'store/downloads/selectors';
import { View } from 'react-native';

type Route = RouteProp<ModalStackParams, 'TrackPopupMenu'>;

const Container = styled.View`
    padding: 20px;
    flex: 0 0 auto;
    flex-direction: column;
`;

function TrackPopupMenu() {
    // Retrieve trackId from route
    const { params: { trackId } } = useRoute<Route>();

    // Retrieve helpers
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const playTracks = usePlayTracks();

    // Retrieve data from store
    const track = useTypedSelector((state) => state.music.tracks.entities[trackId]);
    const isDownloaded = useTypedSelector(selectIsDownloaded(trackId));

    // Set callback to close the modal
    const closeModal = useCallback(() => {
        navigation.dispatch(StackActions.popToTop());    
    }, [navigation]);

    // Callback for adding the track to the queue as the next song
    const handlePlayNext = useCallback(() => {
        playTracks([trackId], { method: 'add-after-currently-playing', play: false });
        closeModal();
    }, [playTracks, closeModal, trackId]);

    // Callback for adding the track to the end of the queue
    const handleAddToQueue = useCallback(() => {
        playTracks([trackId], { method: 'add-to-end', play: false });
        closeModal();
    }, [playTracks, closeModal, trackId]);

    // Callback for downloading the track
    const handleDownload = useCallback(() => {
        dispatch(queueTrackForDownload(trackId));
        closeModal();
    }, [trackId, dispatch, closeModal]);

    // Callback for removing the downloaded track
    const handleDelete = useCallback(() => {
        dispatch(removeDownloadedTrack(trackId));
        closeModal();
    }, [trackId, dispatch, closeModal]);

    return (
        <View>
            <Container>
                <SubHeader style={{ textAlign: 'center' }}>{track?.Name}</SubHeader>
                <Text style={{ marginBottom: 18, textAlign: 'center' }}>{track?.Album} - {track?.AlbumArtist}</Text>
                <WrappableButtonRow>
                    <WrappableButton title={t('play-next')} icon={PlayIcon} onPress={handlePlayNext} />
                    <WrappableButton title={t('add-to-queue')} icon={QueueAppendIcon} onPress={handleAddToQueue} />
                    {isDownloaded ? (
                        <WrappableButton title={t('delete-track')} icon={TrashIcon} onPress={handleDelete} />
                    ) : (
                        <WrappableButton title={t('download-track')} icon={DownloadIcon} onPress={handleDownload} />
                    )}
                </WrappableButtonRow>
            </Container>
        </View>
    );
}

export default TrackPopupMenu;