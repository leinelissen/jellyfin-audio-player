import React, { useMemo } from 'react';
import { View } from 'react-native';
import useCurrentTrack from '@/utility/useCurrentTrack';
import { useGetImage } from '@/utility/JellyfinApi/lib';
import styled from 'styled-components/native';
import CoverImage from '@/components/CoverImage';
import { Header, SubHeader } from '@/components/Typography';

const Artwork = styled(CoverImage)`
    margin: 0 auto 25px auto;
`;

export default function NowPlaying() {
    const { track, albumTrack } = useCurrentTrack();
    const getImage = useGetImage();

    const imageSrc = useMemo(() => {
        const imageSrc = track?.artwork as string ?? (albumTrack && getImage(albumTrack));
        return imageSrc;
    }, [track, albumTrack, getImage]);

    return (
        <View>
            <Artwork
                src={imageSrc}
                margin={80}
            />
            <Header>{track?.title}</Header>
            <SubHeader>{track?.artist}{track?.album && ` — ${track.album}`}</SubHeader>
        </View>
    );
}