import React from 'react';
import { DynamicColorIOS, StyleSheet, ScrollView, Platform, PlatformColor } from 'react-native';
import MediaControls from './components/MediaControls';
import ProgressBar from './components/ProgressBar';
import NowPlaying from './components/NowPlaying';
import Queue from './components/Queue';

const styles = StyleSheet.create({
    outer: {
        ...Platform.select({
            ios: { 
                color: PlatformColor('label'),
                backgroundColor: PlatformColor('systemBackground'),
            },
            android: { 
                color: PlatformColor('?android:attr/textColorPrimary'),
                backgroundColor: PlatformColor('?android:attr/backgroundTint'),
            }
        }),
    },
    inner: {
        padding: 25,
    }
});

export default function Player() {
    return (
        <ScrollView contentContainerStyle={styles.inner} style={styles.outer}>
            <NowPlaying />
            <MediaControls />
            <ProgressBar />
            <Queue />
        </ScrollView>
    );
}