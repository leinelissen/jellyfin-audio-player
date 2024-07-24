import useDefaultStyles from '@/components/Colors';
import ProgressTrack, { calculateProgressTranslation, ProgressTrackContainer } from '@/components/Progresstrack';
import React, { useMemo } from 'react';
import { useDerivedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export interface LyricsProgressProps {
    start: number;
    end: number;
    position: number;
}

/**
 * Displays a loading bar when there is a silence in the lyrics.
 */
export default function LyricsProgress({ start, end, position }: LyricsProgressProps) {
    const defaultStyles = useDefaultStyles();

    // Keep a reference to the width of the container
    const width = useSharedValue(0);

    // Determine whether the loader should be displayed
    const active = useMemo(() => (
        position > start && position < end
    ), [start, end, position]);

    // Determine the duration of the progress bar
    const duration = useMemo(() => (end - start), [end, start]);

    // Calculate the progress animation
    const progressAnimation = useDerivedValue(() => {
        // GUARD: If the animatino is not active, hide the progress bar
        if (!active) return -width.value;

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

    // GUARD: Only show durations if they last for more than 5 seconds.
    if (duration < 5e7) { 
        return null;
    }

    return (
        <ProgressTrackContainer
            onLayout={(e) => width.value = e.nativeEvent.layout.width}
            style={[defaultStyles.trackBackground, { flexGrow: 0, marginVertical: 8 }]}
        >
            <ProgressTrack style={[progressStyles, defaultStyles.themeBackground]} />
        </ProgressTrackContainer>
    );
}