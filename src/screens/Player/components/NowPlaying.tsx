import React from 'react';
import { Text, Dimensions, Image, View } from 'react-native';
import useCurrentTrack from '../../../utility/useCurrentTrack';
import styled from 'styled-components/native';

const Screen = Dimensions.get('screen');

const Artwork = styled.Image`
    border-radius: 10px;
    background-color: #fbfbfb;
    width: ${Screen.width * 0.8}px;
    height: ${Screen.width * 0.8}px;
    margin: 25px auto;
    display: flex;
`;


export default function NowPlaying() {
    const track = useCurrentTrack();

    // GUARD: Don't render anything if nothing is playing
    if (!track) {
        return null;
    }

    return (
        <View style={{ alignItems: 'center' }}>
            <Artwork style={{ flex: 1 }} source={{ uri: track.artwork }} />
            <Text style={{ fontWeight: 'bold', fontSize: 24, marginBottom: 12 }} >{track.artist}</Text>
            <Text style={{ fontSize: 18, marginBottom: 12, textAlign: 'center', paddingLeft: 20, paddingRight: 20 }}>{track.title}</Text>
        </View>
    );
}