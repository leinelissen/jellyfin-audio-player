import React, { memo } from 'react';
import useDefaultStyles from '@/components/Colors';
import {StyleProp, TextStyle, ViewProps} from 'react-native';
import { Lyrics } from '@/utility/JellyfinApi/lyrics.ts';
import styled from 'styled-components/native';
import { lyricsMillisecondsFormat } from '@/utility/LyricsMillisecondsFormat';
import Animated, { useSharedValue, withTiming } from 'react-native-reanimated';

const Container = styled(Animated.View)`
  flex-direction: row;
  flex-wrap: wrap;
  padding-horizontal: 20px;
  margin-top: 10px;
  flex-direction: row;
  gap: 5px;
`;

const LyricsTimestamp = styled.Text`
  font-size: 12px;
  min-width: 30px;
  line-height: 25px;
`;

const LyricsText = styled.Text`
  flex: 1;
  font-size: 20px;
`;

interface Props extends ViewProps {
    lyrics: Lyrics['Lyrics'][number]
    active: boolean
    isStart: boolean
    isEnd: boolean

    // Con
    containerHeight: number
}

const LyricsLine = ({lyrics, active, isStart, isEnd, containerHeight, ...viewProps}: Props) => {
    const defaultStyles = useDefaultStyles();
    const marginForFirstOrLastLine = useSharedValue<number | undefined>(undefined);
    let style: any | undefined = undefined;

    if (isStart || isEnd) {
        marginForFirstOrLastLine.value = withTiming( Math.floor(containerHeight / 2));
    }

    if (isStart) {
        style = {
            marginTop: marginForFirstOrLastLine
        };
    }

    if (isEnd) {
        style = {
            marginBottom: marginForFirstOrLastLine
        };
    }


    const lyricsTextStyle: StyleProp<TextStyle> = {
        color: active ? defaultStyles.themeColor.color : defaultStyles.text.color,
        fontWeight: active? '600': 'normal',
        opacity: active ? 1 : 0.7,
    };

    const timestampStyle: StyleProp<TextStyle> = {
        color: active? defaultStyles.themeColor.color : defaultStyles.textHalfOpacity.color,
    };

    return (
        <Container style={style} {...viewProps} >
            <LyricsTimestamp style={timestampStyle}>
                {lyricsMillisecondsFormat(lyrics.Start)}
            </LyricsTimestamp>
            <LyricsText style={lyricsTextStyle}>
                {lyrics.Text}
            </LyricsText>
        </Container>
    );
};

export default memo(LyricsLine);
