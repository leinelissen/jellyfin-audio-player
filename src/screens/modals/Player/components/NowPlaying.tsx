import React from 'react';
import { View } from 'react-native';
import useCurrentTrack from '@/utility/useCurrentTrack';
import styled from 'styled-components/native';
import CoverImage from '@/components/CoverImage';
import { Header, SubHeader } from '@/components/Typography';

const Artwork = styled(CoverImage)`
    margin: 0 auto 25px auto;
`;

export default function NowPlaying() {
    const { track } = useCurrentTrack();

    return (
        <View>
            <Artwork
                src={track?.artwork as string}
                margin={80}
            />
            <Header>{track?.title}</Header>
            <SubHeader>{track?.artist}{track?.album && ` — ${track.album}`}</SubHeader>
        </View>
    );
}