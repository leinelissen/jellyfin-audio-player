import {GestureHandlerRefContext} from '@react-navigation/stack';
import React, {PropsWithChildren, useCallback, useState} from 'react';
import {ScrollViewProps} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';

export const DismissableScrollView = (
    props: PropsWithChildren<ScrollViewProps>,
) => {
    const [scrolledTop, setScrolledTop] = useState(true);
    const onScroll = useCallback(({nativeEvent}) => {
        console.log(nativeEvent.contentOffset);
        setScrolledTop(nativeEvent.contentOffset.y <= 0);
    }, []);
    return (
        <GestureHandlerRefContext.Consumer>
            {(ref) => (
                <ScrollView
                    waitFor={scrolledTop ? ref : undefined}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    {...props}
                />
            )}
        </GestureHandlerRefContext.Consumer>
    );
};