import useDefaultStyles from '@/components/Colors';
import ProgressTrack, { calculateProgressTranslation, ProgressTrackContainer } from '@/components/Progresstrack';
import React, { useMemo } from 'react';
import { useDerivedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export interface LyricsProgressProps {
    start: number;
    end: number;
    position: number;
}

export default function LyricsProgress({ start, end, position }: LyricsProgressProps) {
    const defaultStyles = useDefaultStyles();
    const width = useSharedValue(0);

    const active = useMemo(() => (
        position > start && position < end
    ), [start, end, position]);

    const duration = useMemo(() => (end - start), [end, start]);

    const progressAnimation = useDerivedValue(() => (
        active ? withTiming(calculateProgressTranslation(position - start, end - start, width.value), { duration: 200 }) : -width.value
    ));

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