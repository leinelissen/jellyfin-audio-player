import React from 'react';
import LyricsRenderer from './components/LyricsRenderer';
import StreamStatus from '../Player/components/StreamStatus';
import ProgressBar from '../Player/components/ProgressBar';
import MediaControls from '../Player/components/MediaControls';
import styled from 'styled-components/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {Platform, View} from 'react-native';
import BackButton from '../Player/components/Backbutton';
import { Header, SubHeader } from '@/components/Typography';
import useCurrentTrack from '@/utility/useCurrentTrack';
import useDefaultStyles from '@/components/Colors';
import CoverImage from '@/components/CoverImage.tsx';

const Container = styled.View`
    margin-bottom: 50px;
    padding: 40px;
    padding-top: 20;
`;

const Artwork = styled(CoverImage)`
    margin: 0 auto 25px auto;
`;

export default function Lyrics() {
    const {track} = useCurrentTrack();
    const style = useDefaultStyles();

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            {Platform.OS === 'android' && (<BackButton />)}
            <View style={{
                position: 'absolute',
                alignItems: 'center',
                width: '100%',
                paddingTop: 50,
                justifyContent: 'center',
                opacity: 0.3
            }}>
                <Artwork
                    src={track?.artwork as string}
                />
            </View>
            <LyricsRenderer />
            <Container style={{
                backgroundColor: style.view.backgroundColor
            }}>
                <Header>{track?.title}</Header>
                <SubHeader>{track?.artist}{track?.album && ` — ${track.album}`}</SubHeader>
                <StreamStatus />
                <ProgressBar />
                <MediaControls />
            </Container>
        </GestureHandlerRootView>
    );
}
