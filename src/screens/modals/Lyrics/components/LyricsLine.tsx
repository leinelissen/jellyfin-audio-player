import React, { memo, useCallback, useEffect, useMemo } from 'react';
import useDefaultStyles from '@/components/Colors';
import {LayoutChangeEvent, StyleProp, TextStyle, ViewProps} from 'react-native';
import styled from 'styled-components/native';
import Animated, { useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';

const Container = styled(Animated.View)`

`;

const LyricsText = styled(Animated.Text)`
  flex: 1;
  font-size: 24px;
`;

export interface LyricsLineProps extends Omit<ViewProps, 'onLayout'> {
    text?: string;
    start: number;
    end: number;
    position: number;
    index: number;
    onActive: (index: number) => void;
    onLayout: (index: number, event: LayoutChangeEvent) => void;
    size: 'small' | 'full';
}

/**
 * A single lyric line
 */
function LyricsLine({ 
    text, start, end, position, size, onLayout, onActive, index, ...viewProps 
}: LyricsLineProps) {
    const defaultStyles = useDefaultStyles();

    // Pass on layout changes to the parent
    const handleLayout = useCallback((e: LayoutChangeEvent) => {
        onLayout?.(index, e);
    }, [onLayout, index]);

    // Determine whether the loader should be displayed
    const active = useMemo(() => (
        position > start && position < end
    ), [start, end, position]);
    const past = useMemo(() => position > end, [end, position]);

    // Call the parent when the active state changes
    useEffect(() => {
        if (active) onActive(index);
    }, [onActive, active, index]);

    // Determine the current style for this line
    const lyricsTextStyle: StyleProp<TextStyle> = useMemo(() => ({
        color: active ? defaultStyles.themeColor.color : defaultStyles.text.color,
        opacity: active ? 1 : (past ? 0.25 : 0.7),
        transformOrigin: 'left center',
        fontSize: size === 'full' ? 24 : 18,
    }), [active, defaultStyles, size, past]);

    const scale = useDerivedValue(() => withTiming(active ? 1.05 : 1));
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Container {...viewProps} onLayout={handleLayout} >
            <LyricsText style={[lyricsTextStyle, animatedStyle]}>
                {text}
            </LyricsText>
        </Container>
    );
}

export default memo(LyricsLine);
