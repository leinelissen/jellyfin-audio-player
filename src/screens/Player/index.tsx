import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import MediaControls from './components/MediaControls';
import ProgressBar from './components/ProgressBar';
import NowPlaying from './components/NowPlaying';
import Queue from './components/Queue';
import { colors } from 'components/Colors';

const styles = StyleSheet.create({
    outer: colors.view,
    inner: {
        padding: 25,
    }
});

console.log(JSON.stringify(styles));

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