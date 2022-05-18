import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

export const shadow = StyleSheet.create({
    small: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2.62,
        elevation: 4,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4.65,
        elevation: 6,
    }
});

type SizeProp = 'small' | 'medium';

const shadowMap: Record<SizeProp, StyleSheet.NamedStyles<unknown>> = {
    'small': shadow.small,
    'medium': shadow.medium,
};

export const ShadowWrapper = ({ children, size = 'small' }: PropsWithChildren<{ size?: SizeProp }>) => (
    <View style={shadowMap[size]}>{children}</View>
);