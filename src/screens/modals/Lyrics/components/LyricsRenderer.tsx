import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, LayoutChangeEvent, LayoutRectangle, View} from 'react-native';
import Animated from 'react-native-reanimated';
import {Lyrics} from '@/utility/JellyfinApi/lyrics';
import {useProgress} from 'react-native-track-player';
import useCurrentTrack from '@/utility/useCurrentTrack';
import LyricsLine from './LyricsLine';
import styled from 'styled-components/native';
import {Text} from '@/components/Typography';

type LyricsLine = Lyrics['Lyrics'][number]

const Loading = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const Empty = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

export default function LyricsRenderer() {
    const scrollViewRef = useRef<Animated.ScrollView>(null);
    const lineLayoutsRef = useRef(new Map<LyricsLine, LayoutRectangle>());
    const {position, buffered} = useProgress();
    const {track} = useCurrentTrack();

    // Active lyrics line is for giving active props to LyricsLine component
    const [activeLine, setActiveLine] = useState<LyricsLine | null>(null);

    // We will be using isUserScrolling to prevent lyrics controller scroll lyrics view
    // while user is scrolling
    const [isUserScrolling, setIsUserScrolling] = useState(false);

    // We will be using containerHeight to make sure active lyrics line is in the center
    const [containerHeight, setContainerHeight] = useState(0);

    const currentTime = useMemo(() => {
        return position * 10000000;
    }, [position]);

    const handleLayoutChange = useCallback((line: LyricsLine, event: LayoutChangeEvent) => {
        lineLayoutsRef.current.set(line, event.nativeEvent.layout);
    }, []);

    const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
        setContainerHeight(event.nativeEvent.layout.height);
    }, []);

    const handleScrollBeginDrag = useCallback(() => {
        setIsUserScrolling(true);
    }, []);

    const handleScrollEndDrag = useCallback(() => {
        setIsUserScrolling(false);
    }, []);

    const handleScrollDrag = useCallback((lineLayout: LayoutRectangle) => {
        if (!containerHeight) {
            return;
        }

        if (isUserScrolling) {
            return;
        }

        scrollViewRef.current?.scrollTo({
            y: lineLayout.y - containerHeight / 2,
            animated: true,
        });


    }, [isUserScrolling, containerHeight]);

    useEffect(() => {

        if (!track) {
            return;
        }

        if (scrollViewRef.current === null) {
            return;
        }

        if (!track.lyrics) {
            return;
        }

        const activeLine = track.lyrics.Lyrics.reduce<LyricsLine | null>((prev, cur) => {
            return currentTime >= cur.Start? cur : prev;
        }, null);

        if (!activeLine) {
            return;
        }

        setActiveLine(state => {

            if (state !== activeLine) {
                const lineLayout = lineLayoutsRef.current.get(activeLine);

                if (lineLayout) {
                    handleScrollDrag(lineLayout);
                }

            }

            return activeLine;
        });

    }, [currentTime, scrollViewRef, track, handleScrollDrag]);

    // Safety guard for undefined track
    if (!track) {
        return null;
    }

    // If track has no lyrics
    // View with empty message
    if (!track.hasLyrics || !track.lyrics) {
        return (
            <Empty>
                {/*// TODO add localized key */}
                <Text>{'Lyrics is not available'}</Text>
            </Empty>
        );
    }

    // Since we are listening changes to track and react-native-track-player controls
    // track we can listen for useProgress()'s buffered value
    // Whenever track changes buffer is set to 0
    // And when track buffer loaded we can assume that track also changed

    // TODO need review
    if (!buffered) {
        scrollViewRef.current?.scrollTo({y: 0});

        return (
            <Loading>
                <ActivityIndicator />
            </Loading>
        );
    }

    return (
        <View style={{flex: 1}}>
            <Animated.ScrollView
                ref={scrollViewRef}
                onLayout={handleContainerLayout}
                onScrollBeginDrag={handleScrollBeginDrag}
                onScrollEndDrag={handleScrollEndDrag}
            >
                {track.lyrics.Lyrics.map((lyrics, i) => (
                    <LyricsLine
                        key={lyrics.Start}
                        active={activeLine === lyrics}
                        lyrics={lyrics}
                        onLayout={(e) => handleLayoutChange(lyrics, e)}
                        isStart={i === 0}
                        isEnd={i === track.lyrics.Lyrics.length - 1}
                        containerHeight={containerHeight}
                    />
                ))}
            </Animated.ScrollView>
        </View>
    );
}
