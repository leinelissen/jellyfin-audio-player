import React from 'react';
import { View } from 'react-native';

export interface GapProps {
    size: number;
    direction?: 'horizontal' | 'vertical';
}

export function Gap({ size, direction = 'horizontal' }: GapProps) {
    return <View style={{ [direction === 'horizontal' ? 'width' : 'height']: size }} />;
}