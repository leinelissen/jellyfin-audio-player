import React, { useCallback } from 'react';
import Modal from 'components/Modal';
import { useNavigation, StackActions, useRoute, RouteProp } from '@react-navigation/native';
import { ModalStackParams } from 'screens/types';
import { useTypedSelector } from 'store';
import { SubHeader } from 'components/Typography';
import styled from 'styled-components/native';
import usePlayTrack from 'utility/usePlayTrack';
import { t } from '@localisation';
import PlayIcon from 'assets/play.svg';
import QueueAppendIcon from 'assets/queue-append.svg';
import Text from 'components/Text';
import { WrappableButton, WrappableButtonRow } from 'components/WrappableButtonRow';

type Route = RouteProp<ModalStackParams, 'TrackPopupMenu'>;

const Container = styled.View`
    padding: 20px;
    flex: 0 0 auto;
    flex-direction: column;
`;

function TrackPopupMenu() {
    // Retrieve helpers
    const { params: { trackId } } = useRoute<Route>();
    const navigation = useNavigation();
    const track = useTypedSelector((state) => state.music.tracks.entities[trackId]);
    const playTrack = usePlayTrack();

    // Set callback to close the modal
    const closeModal = useCallback(() => {
        navigation.dispatch(StackActions.popToTop());    
    }, [navigation]);

    const handlePlayNext = useCallback(() => {
        playTrack(trackId, false, false);
        closeModal();
    }, [playTrack, closeModal, trackId]);
    const handleAddToQueue = useCallback(() => {
        playTrack(trackId, false, true);
        closeModal();
    }, [playTrack, closeModal, trackId]);

    return (
        <Modal fullSize={false}>
            <Container>
                <SubHeader style={{ textAlign: 'center' }}>{track?.Name}</SubHeader>
                <Text style={{ marginBottom: 18, textAlign: 'center' }}>{track?.Album} - {track?.AlbumArtist}</Text>
                <WrappableButtonRow>
                    <WrappableButton title={t('play-next')} icon={PlayIcon} onPress={handlePlayNext} />
                    <WrappableButton title={t('add-to-queue')} icon={QueueAppendIcon} onPress={handleAddToQueue} />
                </WrappableButtonRow>
            </Container>
        </Modal>
    );
}

export default TrackPopupMenu;