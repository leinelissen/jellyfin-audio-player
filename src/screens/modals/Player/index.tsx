import React from 'react';
import { StyleSheet } from 'react-native';
import MediaControls from './components/MediaControls';
import ProgressBar from './components/ProgressBar';
import NowPlaying from './components/NowPlaying';
import Queue from './components/Queue';
import useDefaultStyles from 'components/Colors';
import ConnectionNotice from './components/ConnectionNotice';
import { ScrollView } from 'react-native-gesture-handler';

const styles = StyleSheet.create({
    inner: {
        padding: 40,
    }
});

export default function Player() {
    const defaultStyles = useDefaultStyles();
    
    return (
        <ScrollView contentContainerStyle={styles.inner} style={defaultStyles.view}>
            <NowPlaying />
            <ConnectionNotice />
            <ProgressBar />
            <MediaControls />
            <Queue />
        </ScrollView>
    );
}