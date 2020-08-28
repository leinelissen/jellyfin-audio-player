import React, { useCallback } from 'react';
import Modal from 'components/Modal';
import { Text, Button } from 'react-native';
import { useNavigation, StackActions, useRoute, RouteProp } from '@react-navigation/native';
import { ModalStackParams } from 'screens/types';
import { useTypedSelector } from 'store';
import { THEME_COLOR } from 'CONSTANTS';
import { SubHeader } from 'components/Typography';
import styled from 'styled-components/native';
import usePlayTrack from 'utility/usePlayTrack';

type Route = RouteProp<ModalStackParams, 'TrackPopupMenu'>;

const Container = styled.View`
    padding: 20px;
`;

const Buttons = styled.View`
    margin-top: 20px;
    flex-direction: row;
    justify-content: space-around;
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
                <SubHeader>{track?.Name}</SubHeader>
                <Text>{track?.Album} - {track?.AlbumArtist}</Text>
                <Buttons>
                    <Button title="Play Next" color={THEME_COLOR} onPress={handlePlayNext} />
                    <Button title="Add to Queue" color={THEME_COLOR} onPress={handleAddToQueue} />
                </Buttons>
            </Container>
        </Modal>
    );
}

export default TrackPopupMenu;