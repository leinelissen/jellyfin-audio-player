import React, { ForwardedRef, Ref, forwardRef } from 'react';
import { useHeaderHeight } from '@react-navigation/elements';
import { FlatList, FlatListProps, ScrollView, ScrollViewProps, SectionList, SectionListProps } from 'react-native';
import useCurrentTrack from '../utility/useCurrentTrack';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

declare module 'react' {
    function forwardRef<T, P = {}>(
        render: (props: P, ref: React.Ref<T>) => React.ReactElement | null
    ): (props: P & React.RefAttributes<T>) => React.ReactElement | null;
}

/**
 * A wrapper for ScrollView that takes any paddings, margins and insets into
 * account that result from the bottom tabs, potential NowPlaying overlay and header.
 */
export function SafeScrollView({
    contentContainerStyle,
    ...props
}: ScrollViewProps) {
    const { top, bottom } = useNavigationOffsets();

    return (
        <ScrollView
            contentContainerStyle={[
                contentContainerStyle,
                { paddingTop: top, paddingBottom: bottom },
            ]}
            scrollIndicatorInsets={{ top: top  / 2, bottom: bottom / 2 + 5 }}
            {...props}
        />
    );
}

/**
 * A wrapper for ScrollView that takes any paddings, margins and insets into
 * account that result from the bottom tabs, potential NowPlaying overlay and header.
 */
function BareSafeSectionList<I, S>({
    contentContainerStyle,
    ...props
}: SectionListProps<I, S>, ref: ForwardedRef<SectionList<I, S>>) {
    const { top, bottom } = useNavigationOffsets();

    return (
        <SectionList
            contentContainerStyle={[
                { paddingTop: top, paddingBottom: bottom },
                contentContainerStyle,
            ]}
            scrollIndicatorInsets={{ top: top  / 2, bottom: bottom / 2 + 5 }}
            ref={ref}
            {...props}
        />
    );
}
export const SafeSectionList = forwardRef(BareSafeSectionList);

/**
 * A wrapper for ScrollView that takes any paddings, margins and insets into
 * account that result from the bottom tabs, potential NowPlaying overlay and header.
 */
function BareSafeFlatList<I>({
    contentContainerStyle,
    ...props
}: FlatListProps<I>, ref: ForwardedRef<FlatList<I>>) {
    const { top, bottom } = useNavigationOffsets();

    return (
        <FlatList
            contentContainerStyle={[
                { paddingTop: top, paddingBottom: bottom },
                contentContainerStyle,
            ]}
            scrollIndicatorInsets={{ top, bottom }}
            ref={ref}
            {...props}
        />
    );
}

export const SafeFlatList = forwardRef(BareSafeFlatList);

/**
 * A hook that returns the correct offset that should be applied to any Views
 * that are wrapped in a NavigationView, in order to account for overlays,
 * headers and bottom tabs.
 */
export function useNavigationOffsets({ includeOverlay = true } = {} as { includeOverlay?: boolean }) {
    const headerHeight = useHeaderHeight();
    const bottomBarHeight = useBottomTabBarHeight();
    const { track } = useCurrentTrack();

    return {
        top: headerHeight,
        bottom: (track && includeOverlay ? 68 : 0) + bottomBarHeight || 0,
    };
}


