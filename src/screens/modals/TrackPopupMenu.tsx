import React, { useCallback } from 'react';
import { useNavigation, StackActions, useRoute, RouteProp } from '@react-navigation/native';
import { StackParams } from '@/screens/types';
import { useTrackWithDownload } from '@/store/tracks/hooks';


import { Downloads } from '@/store/downloads/download-manager';
import { Header, SubHeader } from '@/components/Typography';
import styled from 'styled-components/native';
import { t } from '@/localisation';
import PlayIcon from '@/assets/icons/play.svg';
import DownloadIcon from '@/assets/icons/cloud-down-arrow.svg';
import QueueAppendIcon from '@/assets/icons/queue-append.svg';
import TrashIcon from '@/assets/icons/trash.svg';

import { WrappableButton, WrappableButtonRow } from '@/components/WrappableButtonRow';
import CoverImage from '@/components/CoverImage';
import usePlayTracks from '@/utility/usePlayTracks';
import Artwork from '@/store/sources/artwork-manager';
import { ColoredBlurView } from '@/components/Colors';

type Route = RouteProp<StackParams, 'TrackPopupMenu'>;

const Container = styled.View`
    padding: 40px;
    margin-top: 20px;
    flex: 1 1 auto;
    flex-direction: column;
`;

const ArtworkImage = styled(CoverImage)`
    margin: 0 auto 25px auto;
`;

function TrackPopupMenu() {
    // Retrieve trackId from route
    const { params: { trackId } } = useRoute<Route>();
    // Retrieve helpers
    const navigation = useNavigation();
    const playTracks = usePlayTracks();


    const { data: track } = useTrackWithDownload(trackId);
    const isDownloaded = !!track?.download;

    // Set callback to close the modal
    const closeModal = useCallback(() => {
        navigation.dispatch(StackActions.popToTop());
    }, [navigation]);

    // Callback for adding the track to the queue as the next song
    const handlePlayNext = useCallback(() => {
        if (track) playTracks([track], { method: 'add-after-currently-playing', play: false });
        closeModal();
    }, [playTracks, closeModal, track]);

    // Callback for adding the track to the end of the queue
    const handleAddToQueue = useCallback(() => {
        if (track) playTracks([track], { method: 'add-to-end', play: false });
        closeModal();
    }, [playTracks, closeModal, track]);

    // Callback for downloading the track
    const handleDownload = useCallback(async () => {
        if (track) await Downloads.enqueue(track);
        closeModal();
    }, [track, closeModal]);

    // Callback for removing the downloaded track
    const handleDelete = useCallback(async () => {
        if (track?.download) await Downloads.remove(track.download);
        closeModal();
    }, [track, closeModal]);

    return (
        <ColoredBlurView style={{flex: 1}}>
            <Container>
                <ArtworkImage src={track ? Artwork.getUrl(track) : undefined} />
                <Header>{track?.name}</Header>
                <SubHeader style={{ marginBottom: 18 }}>{track?.albumArtist} {track?.album ? '— ' + track?.album : ''}</SubHeader>
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
        </ColoredBlurView>
    );
}

export default TrackPopupMenu;
