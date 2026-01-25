import React, { ForwardedRef, forwardRef } from 'react';
import { useHeaderHeight } from '@react-navigation/elements';
import { FlatList, FlatListProps, ScrollView, ScrollViewProps, SectionList, SectionListProps } from 'react-native';
import useCurrentTrack from '../utility/useCurrentTrack';
import { FlashList, FlashListProps, FlashListRef } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
            scrollIndicatorInsets={{ top: top / 2, bottom: bottom / 2 + 5 }}
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
            scrollIndicatorInsets={{ top: top / 2, bottom: bottom / 2 + 5 }}
            ref={ref}
            {...props}
        />
    );
}
export const SafeSectionList = forwardRef(BareSafeSectionList) as <I, S>(
    props: SectionListProps<I, S> & { ref?: ForwardedRef<SectionList<I, S>> }
) => React.ReactElement;

export interface SafeFlatListProps<I> extends FlatListProps<I> {
    top?: boolean;
    bottom?: boolean;
}

/**
 * A wrapper for ScrollView that takes any paddings, margins and insets into
 * account that result from the bottom tabs, potential NowPlaying overlay and header.
 */
function BareSafeFlatList<I>({
    contentContainerStyle,
    top = true,
    bottom = true,
    ...props
}: SafeFlatListProps<I>, ref: ForwardedRef<FlatList<I>>) {
    const offsets = useNavigationOffsets();

    return (
        <FlatList
            contentContainerStyle={[
                { paddingTop: top ? offsets.top : 0, paddingBottom: bottom ? offsets.bottom : 0 },
                contentContainerStyle,
            ]}
            scrollIndicatorInsets={{ top: top ? offsets.top : 0, bottom: bottom ? offsets.bottom : 0 }}
            ref={ref}
            {...props}
        />
    );
}

export const SafeFlatList = forwardRef(BareSafeFlatList) as <I>(
    props: SafeFlatListProps<I> & { ref?: ForwardedRef<FlatList<I>> }
) => React.ReactElement;

/**
 * A wrapper for ScrollView that takes any paddings, margins and insets into
 * account that result from the bottom tabs, potential NowPlaying overlay and header.
 */
function BareSafeFlashList<I>({
    contentContainerStyle,
    ...props
}: FlashListProps<I>, ref: ForwardedRef<FlashListRef<I>>) {
    const { top, bottom } = useNavigationOffsets();

    return (
        <FlashList
            contentContainerStyle={
                { ...contentContainerStyle, paddingBottom: bottom }
            }
            scrollIndicatorInsets={{ top: top * 0.4, bottom: bottom * 0.55 }}
            ref={ref}
            {...props}
        />
    );
}

export const SafeFlashList = forwardRef(BareSafeFlashList) as <I>(
    props: FlashListProps<I> & { ref?: ForwardedRef<FlashListRef<I>> }
) => React.ReactElement;

/**
 * A hook that returns the correct offset that should be applied to any Views
 * that are wrapped in a NavigationView, in order to account for overlays,
 * headers and bottom tabs.
 */
export function useNavigationOffsets({ includeOverlay = true } = {} as { includeOverlay?: boolean }) {
    const headerHeight = useHeaderHeight();
    const bottomBarHeight = 60;
    const { track } = useCurrentTrack();
    const insets = useSafeAreaInsets();

    return {
        top: headerHeight || insets.top,
        bottom: (track && includeOverlay ? 68 : 0) + bottomBarHeight || 0,
    };
}


