import useDefaultStyles from '@/components/Colors';
import ProgressTrack, { calculateProgressTranslation, ProgressTrackContainer } from '@/components/Progresstrack';
import React, { useCallback, useEffect, useMemo } from 'react';
import { LayoutChangeEvent } from 'react-native';
import { useDerivedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

export interface LyricsProgressProps extends Omit<ViewProps, 'onLayout'> {
    start: number;
    end: number;
    position: number;
    index: number;
    onActive: (index: number) => void;
    onLayout: (index: number, event: LayoutChangeEvent) => void;
}

/**
 * Displays a loading bar when there is a silence in the lyrics.
 */
export default function LyricsProgress({
    start, end, position, index, onLayout, onActive, style, ...props
}: LyricsProgressProps) {
    const defaultStyles = useDefaultStyles();

    // Keep a reference to the width of the container
    const width = useSharedValue(0);

    // Pass on layout changes to the parent
    const handleLayout = useCallback((e: LayoutChangeEvent) => {
        onLayout?.(index, e);
        width.value = e.nativeEvent.layout.width;
    }, [onLayout, index, width]);

    // Determine whether the loader should be displayed
    const active = useMemo(() => (
        position > start && position < end
    ), [start, end, position]);

    // Call the parent when the active state changes
    useEffect(() => {
        if (active) onActive(index);
    }, [onActive, active, index]);

    // Determine the duration of the progress bar
    const duration = useMemo(() => (end - start), [end, start]);

    // Calculate the progress animation
    const progressAnimation = useDerivedValue(() => {
        // GUARD: If the animatino is not active, hide the progress bar
        if (!active) return -1_000;

        // Calculate how far along we are
        const progress = calculateProgressTranslation(position - start, end - start, width.value);

        // Move to that position with easing
        return withTiming(progress, { duration: 200 });
    });

    // Calculate the styles according to the progress
    const progressStyles = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: progressAnimation.value }
            ]
        };
    });

    console.log(progressAnimation.value);

    // GUARD: Only show durations if they last for more than 5 seconds.
    if (duration < 5e7) { 
        return null;
    }

    return (
        <ProgressTrackContainer
            {...props}
            style={[
                defaultStyles.trackBackground,
                { flexGrow: 0, marginVertical: 8 },
                style
            ]}
            onLayout={handleLayout}
        >
            <ProgressTrack style={[progressStyles, defaultStyles.themeBackground]} />
        </ProgressTrackContainer>
    );
}