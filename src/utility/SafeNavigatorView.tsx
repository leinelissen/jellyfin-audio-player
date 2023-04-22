import { useHeaderHeight } from '@react-navigation/elements';
import React from 'react';
import { View, ViewProps } from 'react-native';
import useCurrentTrack from './useCurrentTrack';

export function useNavigatorPadding() {
    const headerHeight = useHeaderHeight();
    const { index } = useCurrentTrack();

    return {
        paddingTop: headerHeight,
        paddingBottom: index !== undefined ? 68 : 0
    };
}

function SafeNavigatorView({ style, ...props }: ViewProps) {
    const headerHeight = useHeaderHeight();

    return (
        <View {...props} style={[{ paddingTop: headerHeight }, style]} />
    );
}

export default SafeNavigatorView;
