import React, { useState, useCallback, useEffect, useRef } from 'react';
import TrackPlayer, { usePlaybackState, STATE_PLAYING, STATE_PAUSED } from 'react-native-track-player';
import { TouchableOpacity, useColorScheme } from 'react-native';
import styled from 'styled-components/native';
import { useHasQueue } from 'utility/useQueue';
import ForwardIcon from 'assets/forwards.svg';
import BackwardIcon from 'assets/backwards.svg';
import PlayIcon from 'assets/play.svg';
import PauseIcon from 'assets/pause.svg';
import RepeatIcon from 'assets/repeat.svg';
// import ShuffleIcon from 'assets/shuffle.svg';
import { THEME_COLOR } from 'CONSTANTS';
import Casting from './Casting';

const BUTTON_SIZE = 40;
const BUTTON_SIZE_SMALL = 25;

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
    const scheme = useColorScheme();
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
            <Buttons>
                <Button>
                    <RepeatButton fill={fill} />
                </Button>
                <Casting fill={fill} />
            </Buttons>
        </Container>
    );
}

export function PreviousButton({ fill }: { fill: string }) {
    const hasQueue = useHasQueue();

    return (
        <TouchableOpacity onPress={previous} disabled={!hasQueue} style={{ opacity: hasQueue ? 1 : 0.5 }}>
            <BackwardIcon width={BUTTON_SIZE} height={BUTTON_SIZE} fill={fill} />
        </TouchableOpacity>
    );
}

export function NextButton({ fill }: { fill: string }) {
    const hasQueue = useHasQueue();

    return (
        <TouchableOpacity onPress={next} disabled={!hasQueue} style={{ opacity: hasQueue ? 1 : 0.5 }}>
            <ForwardIcon width={BUTTON_SIZE} height={BUTTON_SIZE} fill={fill} />
        </TouchableOpacity>
    );
}

export function RepeatButton({ fill }: { fill: string}) {
    const [isRepeating, setRepeating] = useState(false);
    const handlePress = useCallback(() => setRepeating(!isRepeating), [isRepeating, setRepeating]);
    const listener = useRef<TrackPlayer.EmitterSubscription | null>(null);
    
    // The callback that should determine whether we need to repeeat or not
    const handleEndEvent = useCallback(async () => {
        if (isRepeating) {
            // Retrieve all current tracks
            const tracks = await TrackPlayer.getQueue();

            // Then skip to the first track
            await TrackPlayer.skip(tracks[0].id);

            // Cautiously reset the seek time, as there might only be a single
            // item in queue.
            await TrackPlayer.seekTo(0);

            // Then play the item
            await TrackPlayer.play();
        }
    }, [isRepeating]);

    // Subscribe to ended event handler so that we can restart the queue from
    // the start if looping is enabled
    useEffect(() => {
        // Set the event listener
        listener.current = TrackPlayer.addEventListener('playback-queue-ended', handleEndEvent);
        
        // Then clean up after
        return function cleanup() {
            listener?.current?.remove();
        };
    }, [handleEndEvent]);

    return (
        <TouchableOpacity onPress={handlePress} style={{ opacity: isRepeating ? 1 : 0.5 }}>
            <RepeatIcon
                width={BUTTON_SIZE_SMALL}
                height={BUTTON_SIZE_SMALL}
                fill={isRepeating ? THEME_COLOR : fill}
            />
        </TouchableOpacity>
    );
}

// export function ShuffleButton({ fill }: { fill: string}) {
//     const [isShuffling, setShuffling] = useState(false);
//     const handlePress = useCallback(() => setShuffling(!isShuffling), [isShuffling, setShuffling]);

//     return (
//         <TouchableOpacity onPress={handlePress} style={{ opacity: isShuffling ? 1 : 0.5 }}>
//             <ShuffleIcon
//                 width={BUTTON_SIZE_SMALL}
//                 height={BUTTON_SIZE_SMALL}
//                 fill={isShuffling ? THEME_COLOR : fill}
//             />
//         </TouchableOpacity>
//     );
// }

export function MainButton({ fill }: { fill: string }) {
    const state = usePlaybackState();

    switch (state) {
        case STATE_PLAYING:
            return (
                <TouchableOpacity onPress={pause}>
                    <PauseIcon width={BUTTON_SIZE} height={BUTTON_SIZE} fill={fill} />
                </TouchableOpacity>
            );
        case STATE_PAUSED:
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