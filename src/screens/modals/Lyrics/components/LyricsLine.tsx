import React, { memo, useMemo } from 'react';
import useDefaultStyles from '@/components/Colors';
import {StyleProp, TextStyle, ViewProps} from 'react-native';
import styled from 'styled-components/native';
import Animated, { useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';

const Container = styled(Animated.View)`

`;

const LyricsText = styled(Animated.Text)`
  flex: 1;
  font-size: 20px;
`;

export interface LyricsLineProps extends ViewProps {
    text?: string;
    start: number;
    end: number;
    position: number;
}

/**
 * A single lyric line
 */
function LyricsLine({ text, start, end, position, ...viewProps }: LyricsLineProps) {
    const defaultStyles = useDefaultStyles();

    // Determine whether the current line should be active
    const active = useMemo(() => (
        position > start && position < end
    ), [start, end, position]);

    // Determine the current style for this line
    const lyricsTextStyle: StyleProp<TextStyle> = useMemo(() => ({
        color: active ? defaultStyles.themeColor.color : defaultStyles.text.color,
        opacity: active ? 1 : 0.7,
        transformOrigin: 'left center',
    }), [active, defaultStyles]);

    const scale = useDerivedValue(() => withTiming(active ? 1.05 : 1));
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Container {...viewProps} >
            <LyricsText style={[lyricsTextStyle, animatedStyle]}>
                {text}
            </LyricsText>
        </Container>
    );
}

export default memo(LyricsLine);
