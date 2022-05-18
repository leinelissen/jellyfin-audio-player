import React, { useEffect } from 'react';
import TrackPlayer, { useProgress } from 'react-native-track-player';
import styled from 'styled-components/native';
import ProgressTrack, {
    calculateProgressTranslation,
    getMinutes,
    getSeconds,
    ProgressTrackContainer
} from 'components/Progresstrack';
import { Gesture, GestureDetector, gestureHandlerRootHOC } from 'react-native-gesture-handler';
import { THEME_COLOR } from 'CONSTANTS';
import Reanimated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    useDerivedValue,
    runOnJS,
} from 'react-native-reanimated';
import ReText from 'components/ReText';

const DRAG_HANDLE_SIZE = 20;
const PADDING_TOP = 12;

const Container = styled.View`
    padding-top: ${PADDING_TOP}px;
    margin-top: ${PADDING_TOP}px;
`;

const NumberBar = styled.View`
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    padding: 8px 0;
`;

const Number = styled(ReText)`
    font-size: 13px;
`;

const DragHandle = styled(Reanimated.View)`
    width: ${DRAG_HANDLE_SIZE}px;
    height: ${DRAG_HANDLE_SIZE}px;
    border-radius: ${DRAG_HANDLE_SIZE}px;
    background-color: ${THEME_COLOR};
    position: absolute;
    left: -${DRAG_HANDLE_SIZE / 2}px;
    top: ${PADDING_TOP - DRAG_HANDLE_SIZE / 2 + 2.5}px;
    z-index: 14;
`;

function ProgressBar() {
    const { position, buffered, duration } = useProgress();

    const width = useSharedValue(0);
    const pos = useSharedValue(0);
    const buf = useSharedValue(0);
    const dur = useSharedValue(0);

    const isDragging = useSharedValue(false);
    const offset = useSharedValue(0);

    const bufferAnimation = useDerivedValue(() => {
        return calculateProgressTranslation(buf.value, dur.value, width.value);
    }, [[dur, buf, width.value]]);

    const progressAnimation = useDerivedValue(() => {
        if (isDragging.value) {
            return calculateProgressTranslation(offset.value, width.value, width.value);
        } else {
            return calculateProgressTranslation(pos.value, dur.value, width.value);
        }
    });

    const timePassed = useDerivedValue(() => {
        if (isDragging.value) {
            const currentPosition = (offset.value - DRAG_HANDLE_SIZE / 2) / (width.value - DRAG_HANDLE_SIZE) * dur.value;
            return getMinutes(currentPosition) + ':' + getSeconds(currentPosition);
        } else {
            return getMinutes(pos.value) + ':' + getSeconds(pos.value);
        }
    }, [pos]);

    const timeRemaining = useDerivedValue(() => {
        if (isDragging.value) {
            const currentPosition = (offset.value - DRAG_HANDLE_SIZE / 2) / (width.value - DRAG_HANDLE_SIZE) * dur.value;
            const remaining = (currentPosition - dur.value) * -1;
            return `-${getMinutes(remaining)}:${getSeconds((remaining))}`;
        } else {
            const remaining = (pos.value - dur.value) * -1;
            return `-${getMinutes(remaining)}:${getSeconds((remaining))}`;
        }
    }, [pos, dur]);
    
    const pan = Gesture.Pan()
        .minDistance(1)
        .activeOffsetX(1)
        .activeOffsetY(1)
        .onBegin((e) => {
            isDragging.value = true;
            offset.value = Math.min(Math.max(DRAG_HANDLE_SIZE / 2, e.x), width.value - DRAG_HANDLE_SIZE / 2);
        }).onUpdate((e) => {
            offset.value = Math.min(Math.max(DRAG_HANDLE_SIZE / 2, e.x), width.value - DRAG_HANDLE_SIZE / 2);
        }).onFinalize(() => {
            pos.value = (offset.value - DRAG_HANDLE_SIZE / 2) / (width.value - DRAG_HANDLE_SIZE) * dur.value;
            isDragging.value = false;
            runOnJS(TrackPlayer.seekTo)(pos.value);
        });
    const tap = Gesture.Tap()
        .onBegin((e) => {
            isDragging.value = true;
            offset.value = Math.min(Math.max(DRAG_HANDLE_SIZE / 2, e.x), width.value - DRAG_HANDLE_SIZE / 2);
        }).onFinalize(() => {
            pos.value = (offset.value - DRAG_HANDLE_SIZE / 2) / (width.value - DRAG_HANDLE_SIZE) * dur.value;
            isDragging.value = false;
            runOnJS(TrackPlayer.seekTo)(pos.value);
        });
    const gesture = Gesture.Exclusive(pan, tap);

    useEffect(() => {
        pos.value = position;
        buf.value = buffered;
        dur.value = duration;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [position, buffered, duration]);

    const dragHandleStyles = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: offset.value },
                { 
                    scale: withTiming(isDragging.value ? 1 : 0, {
                        duration: 100,
                        easing: Easing.out(Easing.ease),
                    })
                }
            ],
        };
    });

    const bufferStyles = useAnimatedStyle(() => ({
        transform: [
            { translateX: bufferAnimation.value }
        ]
    }));

    const progressStyles = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: progressAnimation.value }
            ]
        };
    });

    const timePassedStyles = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: withTiming(isDragging.value && offset.value < 48 ? 12 : 0, {
                    duration: 145,
                    easing: Easing.ease
                }) },
            ],
        };
    });

    const timeRemainingStyles = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: withTiming(isDragging.value && offset.value > width.value - 48 ? 12 : 0, {
                    duration: 150,
                    easing: Easing.ease
                }) },
            ],
        };
    });

    return (
        <GestureDetector gesture={gesture}>
            <Container onLayout={(e) => { width.value = e.nativeEvent.layout.width; }}>
                <ProgressTrackContainer>
                    <ProgressTrack
                        opacity={0.15}
                    />
                    <ProgressTrack
                        style={bufferStyles}
                        opacity={0.15}
                    />
                    <ProgressTrack
                        style={progressStyles}
                    />
                </ProgressTrackContainer>
                <DragHandle style={dragHandleStyles} />
                <NumberBar style={{ flex: 1 }}>
                    <Number text={timePassed} style={timePassedStyles} />
                    <Number text={timeRemaining} style={timeRemainingStyles} />
                </NumberBar>
            </Container>
        </GestureDetector>
    );
}

export default gestureHandlerRootHOC(ProgressBar);
