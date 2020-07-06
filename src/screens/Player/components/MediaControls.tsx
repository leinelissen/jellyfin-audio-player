import React from 'react';
import TrackPlayer, { usePlaybackState, STATE_PLAYING, STATE_PAUSED } from 'react-native-track-player';
import { TouchableOpacity } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPlay, faPause, faBackward, faForward } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components/native';
import { useHasQueue } from 'utility/useQueue';

const MAIN_SIZE = 48;
const BUTTON_SIZE = 32;

const pause = () => TrackPlayer.pause();
const play = () => TrackPlayer.play();
const next = () => TrackPlayer.skipToNext();
const previous = () => TrackPlayer.skipToPrevious();

const Container = styled.View`
    align-items: center;
    margin: 20px 0;
`;

const Buttons = styled.View`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
`;

const Button = styled.View`
    margin: 20px 40px;
`;

export default function MediaControls() {
    return (
        <Container>
            <Buttons>
                <Button>
                    <PreviousButton />
                </Button>
                <MainButton />
                <Button>
                    <NextButton />
                </Button>
            </Buttons>
        </Container>
    );
}

export function PreviousButton() {
    const hasQueue = useHasQueue();

    return (
        <TouchableOpacity onPress={previous} disabled={!hasQueue} style={{ opacity: hasQueue ? 1 : 0.5 }}>
            <FontAwesomeIcon icon={faBackward} size={BUTTON_SIZE} />
        </TouchableOpacity>
    );
}

export function NextButton() {
    const hasQueue = useHasQueue();

    return (
        <TouchableOpacity onPress={next} disabled={!hasQueue} style={{ opacity: hasQueue ? 1 : 0.5 }}>
            <FontAwesomeIcon icon={faForward} size={BUTTON_SIZE} />
        </TouchableOpacity>
    );
}

export function MainButton() {
    const state = usePlaybackState();

    switch (state) {
        case STATE_PLAYING:
            return (
                <TouchableOpacity onPress={pause}>
                    <FontAwesomeIcon icon={faPause} size={MAIN_SIZE} />
                </TouchableOpacity>
            );
        case STATE_PAUSED:
            return (
                <TouchableOpacity onPress={play}>
                    <FontAwesomeIcon icon={faPlay} size={MAIN_SIZE} />
                </TouchableOpacity>
            );
        default:
            return (
                <TouchableOpacity onPress={pause} disabled>
                    <FontAwesomeIcon icon={faPause} size={MAIN_SIZE} />
                </TouchableOpacity>
            );
    }
}