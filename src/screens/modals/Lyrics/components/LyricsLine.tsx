import React, { memo, useMemo } from 'react';
import useDefaultStyles from '@/components/Colors';
import {StyleProp, TextStyle, ViewProps} from 'react-native';
import styled from 'styled-components/native';
import Animated from 'react-native-reanimated';

const Container = styled(Animated.View)`

`;

const LyricsText = styled.Text`
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
        fontWeight: active? '600': 'normal',
        opacity: active ? 1 : 0.7,
        letterSpacing: active ? -0.4 : 0,
    }), [active, defaultStyles]);

    return (
        <Container {...viewProps} >
            <LyricsText style={lyricsTextStyle}>
                {text}
            </LyricsText>
        </Container>
    );
}

export default memo(LyricsLine);
