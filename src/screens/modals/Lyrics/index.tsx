import React from 'react';
import LyricsRenderer from './components/LyricsRenderer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import BackButton from '../Player/components/Backbutton';
import { ColoredBlurView } from '@/components/Colors';

export default function Lyrics() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ColoredBlurView style={{ flex: 1 }}>
                {Platform.OS === 'android' && (<BackButton />)}
                <LyricsRenderer />
            </ColoredBlurView>
        </GestureHandlerRootView>
    );
}
