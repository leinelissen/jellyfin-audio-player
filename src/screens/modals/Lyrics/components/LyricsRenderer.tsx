import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import { LayoutChangeEvent, LayoutRectangle, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Lyrics } from '@/utility/JellyfinApi/lyrics';
import { useProgress } from 'react-native-track-player';
import useCurrentTrack from '@/utility/useCurrentTrack';
import LyricsLine from './LyricsLine';
import { useNavigation } from '@react-navigation/native';
import { useTypedSelector } from '@/store';
import { NOW_PLAYING_POPOVER_HEIGHT } from '@/screens/Music/overlays/NowPlaying';
import LyricsProgress from './LyricsProgress';

type LyricsLine = Lyrics['Lyrics'][number];

const styles = StyleSheet.create({
    lyricsContainer: {
        padding: 40,
        paddingBottom: 40 + NOW_PLAYING_POPOVER_HEIGHT,
        gap: 12,
        justifyContent: 'flex-start',
    }
});

// Always hit the changes this amount of microseconds early so that it appears
// to follow the track a bit more accurate.
const TIME_OFFSET = 2e6;

export default function LyricsRenderer() {
    const scrollViewRef = useRef<Animated.ScrollView>(null);
    const lineLayoutsRef = useRef(new Map<LyricsLine, LayoutRectangle>());
    const { position } = useProgress(100);
    const { track: trackPlayerTrack } = useCurrentTrack();
    const tracks = useTypedSelector((state) => state.music.tracks.entities);
    const track = useMemo(() => tracks[trackPlayerTrack?.backendId], [trackPlayerTrack?.backendId, tracks]);
    const navigation = useNavigation();

    // We will be using isUserScrolling to prevent lyrics controller scroll lyrics view
    // while user is scrolling
    const [isUserScrolling, setIsUserScrolling] = useState(false);

    // We will be using containerHeight to make sure active lyrics line is in the center
    const [containerHeight, setContainerHeight] = useState(0);

    // Calculate current ime
    const currentTime = useMemo(() => {
        return position * 10_000_000;
    }, [position]);

    // Handler for saving line positions
    const handleLayoutChange = useCallback((line: LyricsLine, event: LayoutChangeEvent) => {
        lineLayoutsRef.current.set(line, event.nativeEvent.layout);
    }, []);

    // Calculate current container height
    const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
        setContainerHeight(event.nativeEvent.layout.height);
    }, []);

    // Handlers for user scroll handling
    const handleScrollBeginDrag = useCallback(() => setIsUserScrolling(true), []);
    const handleScrollEndDrag = useCallback(() => setIsUserScrolling(false), []);

    const handleScrollDrag = useCallback((lineLayout: LayoutRectangle) => {
        if (!containerHeight || isUserScrolling) return;

        scrollViewRef.current?.scrollTo({
            y: lineLayout.y - containerHeight / 2,
            animated: true,
        });
    }, [isUserScrolling, containerHeight]);

    useEffect(() => {
        if (!track || scrollViewRef.current === null || !track.Lyrics) return;

        const activeLine = track.Lyrics.Lyrics.reduce<LyricsLine | null>((prev, cur) => {
            return currentTime >= cur.Start? cur : prev;
        }, null);


        if (!activeLine) return;

        // Attempt to retrieve the layout for the current line
        const lineLayout = lineLayoutsRef.current.get(activeLine);
        if (lineLayout) {
            // If it exists, scroll to it
            handleScrollDrag(lineLayout);
        }
    }, [currentTime, scrollViewRef, track, handleScrollDrag]);

    // GUARD: If the track has no lyrics, close the modal
    if (!track || !track.HasLyrics || !track.Lyrics) {
        navigation.goBack();
        return null;
    }

    return (
        <View style={{flex: 1}}>
            <Animated.ScrollView
                contentContainerStyle={styles.lyricsContainer}
                ref={scrollViewRef}
                onLayout={handleContainerLayout}
                onScrollBeginDrag={handleScrollBeginDrag}
                onScrollEndDrag={handleScrollEndDrag}
            >
                <LyricsProgress
                    start={0}
                    end={track.Lyrics.Lyrics[0].Start - TIME_OFFSET}
                    position={currentTime}
                />
                {track.Lyrics.Lyrics.map((lyrics, i) => (
                    lyrics.Text ? (
                        <LyricsLine
                            key={lyrics.Start}
                            start={lyrics.Start - TIME_OFFSET}
                            end={track.Lyrics!.Lyrics.length === i + 1
                                ? track.RunTimeTicks
                                : track.Lyrics!.Lyrics[i + 1]?.Start - TIME_OFFSET
                            }
                            text={lyrics.Text}
                            position={currentTime}
                            onLayout={(e) => handleLayoutChange(lyrics, e)}
                        />
                    ) : (
                        <LyricsProgress
                            key={lyrics.Start}
                            start={lyrics.Start - TIME_OFFSET}
                            end={track.Lyrics!.Lyrics.length === i + 1
                                ? track.RunTimeTicks
                                : track.Lyrics!.Lyrics[i + 1]?.Start - TIME_OFFSET
                            }
                            position={currentTime}
                        />
                    )
                ))}
            </Animated.ScrollView>
        </View>
    );
}
