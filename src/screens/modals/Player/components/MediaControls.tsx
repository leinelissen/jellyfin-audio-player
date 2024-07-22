import React from 'react';
import TrackPlayer, { State, usePlaybackState } from 'react-native-track-player';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { useHasNextQueue, useHasPreviousQueue } from '@/utility/useQueue';
import ForwardIcon from '@/assets/icons/forward-end.svg';
import BackwardIcon from '@/assets/icons/backward-end.svg';
import PlayIcon from '@/assets/icons/play.svg';
import PauseIcon from '@/assets/icons/pause.svg';
import { useUserOrSystemScheme } from '@/components/Colors';

const BUTTON_SIZE = 40;

const pause = () => TrackPlayer.pause();
const play = () => TrackPlayer.play();
const next = () => TrackPlayer.skipToNext();
const previous = () => TrackPlayer.skipToPrevious();

const Container = styled.View`
    align-items: center;
    margin-top: 40px;
`;

const Buttons = styled.View`
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
`;

const Button = styled.View`
    margin: 0 40px;
    opacity: 0.75;
`;

export default function MediaControls() {
    const scheme = useUserOrSystemScheme();
    const fill = scheme === 'dark' ? '#ffffff' : '#000000';

    return (
        <Container>
            <Buttons>
                <Button>
                    <PreviousButton fill={fill} />
                </Button>
                <MainButton fill={fill} />
                <Button>
                    <NextButton fill={fill} />
                </Button>
            </Buttons>
        </Container>
    );
}

export function PreviousButton({ fill }: { fill: string }) {
    const hasQueue = useHasPreviousQueue();

    return (
        <TouchableOpacity onPress={previous} disabled={!hasQueue} style={{ opacity: hasQueue ? 1 : 0.5 }}>
            <BackwardIcon width={BUTTON_SIZE} height={BUTTON_SIZE} fill={fill} />
        </TouchableOpacity>
    );
}

export function NextButton({ fill }: { fill: string }) {
    const hasQueue = useHasNextQueue();

    return (
        <TouchableOpacity onPress={next} disabled={!hasQueue} style={{ opacity: hasQueue ? 1 : 0.5 }}>
            <ForwardIcon width={BUTTON_SIZE} height={BUTTON_SIZE} fill={fill} />
        </TouchableOpacity>
    );
}

export function MainButton({ fill }: { fill: string }) {
    const { state } = usePlaybackState();

    switch (state) {
        case State.Playing:
            return (
                <TouchableOpacity onPress={pause}>
                    <PauseIcon width={BUTTON_SIZE} height={BUTTON_SIZE} fill={fill} />
                </TouchableOpacity>
            );
        case State.Paused:
            return (
                <TouchableOpacity onPress={play}>
                    <PlayIcon width={BUTTON_SIZE} height={BUTTON_SIZE} fill={fill} />
                </TouchableOpacity>
            );
        default:
            return (
                <TouchableOpacity onPress={pause} disabled>
                    <PauseIcon width={BUTTON_SIZE} height={BUTTON_SIZE} fill={fill} />
                </TouchableOpacity>
            );
    }
}