import React from 'react';
import MediaControls from './components/MediaControls';
import ProgressBar from './components/ProgressBar';
import NowPlaying from './components/NowPlaying';
import Queue from './components/Queue';
import ConnectionNotice from './components/ConnectionNotice';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import StreamStatus from './components/StreamStatus';
import { Platform, StatusBar } from 'react-native';
import BackButton from './components/Backbutton';
import Timer from './components/Timer';

export default function Player() {   
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StatusBar translucent={true} backgroundColor={'transparent'}/>
            {/* {Platform.OS === 'android' && (<BackButton />)} */}
            <Queue header={(
                <>
                    <NowPlaying />
                    <ConnectionNotice />
                    <StreamStatus />
                    <ProgressBar />
                    <MediaControls />
                    <Timer />
                </>                    
            )} />
        </GestureHandlerRootView>
    );
}