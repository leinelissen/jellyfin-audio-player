import React from 'react';
import MediaControls from './components/MediaControls';
import ProgressBar from './components/ProgressBar';
import NowPlaying from './components/NowPlaying';
import Queue from './components/Queue';
import ConnectionNotice from './components/ConnectionNotice';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import StreamStatus from './components/StreamStatus';
import {Platform} from 'react-native';
import BackButton from './components/Backbutton';
import Timer from './components/Timer';
import LyricsButton from './components/LyricsButton.tsx';
import styled from 'styled-components/native';

const Group = styled.View`
    flex-direction: row;
    justify-content: space-between;
`;

export default function Player() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            {Platform.OS === 'android' && (<BackButton />)}
            <Queue header={(
                <>
                    <NowPlaying />
                    <ConnectionNotice />
                    <StreamStatus />
                    <ProgressBar />
                    <MediaControls />
                    <Group>
                        <Timer />
                        <LyricsButton />
                    </Group>
                </>
            )} />
        </GestureHandlerRootView>
    );
}
