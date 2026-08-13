import React, { useMemo } from 'react';
import { View } from 'react-native';
import useCurrentTrack from '@/utility/useCurrentTrack';
import Artwork from '@/store/sources/artwork-manager';
import styled from 'styled-components/native';
import CoverImage from '@/components/CoverImage';
import { Header, SubHeader } from '@/components/Typography';

const ArtworkImage = styled(CoverImage)`
    margin: 0 auto 25px auto;
`;

export default function NowPlaying() {
    const { track, albumTrack } = useCurrentTrack();
    const imageSrc = useMemo(() => {
        return track?.artwork as string ?? (albumTrack && Artwork.getUrl(albumTrack));
    }, [track, albumTrack]);

    return (
        <View>
            <ArtworkImage
                src={imageSrc}
                margin={80}
            />
            <Header>{track?.title}</Header>
            <SubHeader>{track?.artist}{track?.album && ` — ${track.album}`}</SubHeader>
        </View>
    );
}