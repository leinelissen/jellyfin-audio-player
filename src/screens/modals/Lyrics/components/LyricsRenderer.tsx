import React, {useCallback, useMemo, useRef, useState} from 'react';
import { LayoutChangeEvent, LayoutRectangle, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useProgress } from 'react-native-track-player';
import useCurrentTrack from '@/utility/useCurrentTrack';
import LyricsLine from './LyricsLine';
import { useNavigation } from '@react-navigation/native';
import { NOW_PLAYING_POPOVER_HEIGHT } from '@/screens/Music/overlays/NowPlaying';
import LyricsProgress, { LyricsProgressProps } from './LyricsProgress';

const styles = StyleSheet.create({
    lyricsContainerFull: {
        padding: 40,
        paddingBottom: 40 + NOW_PLAYING_POPOVER_HEIGHT,
        gap: 12,
        justifyContent: 'flex-start',
    },
    lyricsContainerSmall: {
        paddingHorizontal: 16,
        paddingVertical: 80,
        gap: 8,
    },
    containerSmall: {
        maxHeight: 160,
        flex: 1,
    }
});

// Always hit the changes this amount of microseconds early so that it appears
// to follow the track a bit more accurate.
const TIME_OFFSET = 2e6;

export interface LyricsRendererProps {
    size?: 'small' | 'full',
}

export default function LyricsRenderer({ size = 'full' }: LyricsRendererProps) {
    const scrollViewRef = useRef<Animated.ScrollView>(null);
    const lineLayoutsRef = useRef(new Map<number, LayoutRectangle>());
    const { position } = useProgress(100);
    const { track, albumTrack } = useCurrentTrack();
    const navigation = useNavigation();

    // We will be using isUserScrolling to prevent lyrics controller scroll lyrics view
    // while user is scrolling
    const isUserScrolling = useRef(false);

    // We will be using containerHeight to make sure active lyrics line is in the center
    const [containerHeight, setContainerHeight] = useState(0);

    // Calculate current ime
    const currentTime = useMemo(() => {
        return position * 10_000_000;
    }, [position]);

    // Handler for saving line positions
    const handleLayoutChange = useCallback((index: number, event: LayoutChangeEvent) => {
        lineLayoutsRef.current.set(index, event.nativeEvent.layout);
    }, []);

    const handleActive = useCallback((index: number) => {
        const lineLayout = lineLayoutsRef.current.get(index);
        if (!containerHeight || isUserScrolling.current || !lineLayout) return;

        scrollViewRef.current?.scrollTo({
            y: lineLayout.y - containerHeight / 2 + lineLayout.height / 2,
            animated: true,
        });
    }, [containerHeight, isUserScrolling]);

    // Calculate current container height
    const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
        setContainerHeight(event.nativeEvent.layout.height);
    }, []);

    // Handlers for user scroll handling
    const handleScrollBeginDrag = useCallback(() => isUserScrolling.current = true, []);
    const handleScrollEndDrag = useCallback(() => isUserScrolling.current = false, []);

    if (!track || !albumTrack) {
        return null;
    }

    // GUARD: If the track has no lyrics, close the modal
    if (!albumTrack.HasLyrics || !albumTrack.Lyrics) {
        navigation.goBack();
        return null;
    }

    return (
        <View style={size === 'small' && styles.containerSmall}>
            <Animated.ScrollView
                contentContainerStyle={size === 'full'
                    ? styles.lyricsContainerFull
                    : styles.lyricsContainerSmall
                }
                ref={scrollViewRef}
                onLayout={handleContainerLayout}
                onScrollBeginDrag={handleScrollBeginDrag}
                onScrollEndDrag={handleScrollEndDrag}
            >
                <LyricsProgress
                    start={0}
                    end={albumTrack.Lyrics.Lyrics[0].Start - TIME_OFFSET}
                    position={currentTime}
                    index={-1}
                    onActive={handleActive}
                    onLayout={handleLayoutChange}
                />
                {albumTrack.Lyrics.Lyrics.map((lyrics, i) => {
                    const props: LyricsProgressProps = {
                        start: lyrics.Start - TIME_OFFSET,
                        end: albumTrack.Lyrics!.Lyrics.length === i + 1
                            ? track.RunTimeTicks
                            : albumTrack.Lyrics!.Lyrics[i + 1]?.Start - TIME_OFFSET
                        ,
                        position: currentTime,
                        onLayout: handleLayoutChange,
                        onActive: handleActive,
                        index: i,
                    };

                    return lyrics.Text ? (
                        <LyricsLine
                            key={`lyric_${i}`}
                            {...props}
                            text={lyrics.Text}
                            size={size}
                        />
                    ) : (
                        <LyricsProgress
                            key={`lyric_${i}`}
                            {...props}
                        />
                    );
                })}
            </Animated.ScrollView>
        </View>
    );
}
