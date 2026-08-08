import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import useCurrentTrack from '@/utility/useCurrentTrack';
import { useGetImage } from '@/utility/JellyfinApi/lib';
import styled from 'styled-components/native';
import CoverImage from '@/components/CoverImage';
import { Header, SubHeader } from '@/components/Typography';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@/screens/types';

const Artwork = styled(CoverImage)`
    margin: 0 auto 25px auto;
`;

export default function NowPlaying() {
    const navigation = useNavigation<NavigationProp>();
    const { track, albumTrack } = useCurrentTrack();
    const getImage = useGetImage();

    const imageSrc = useMemo(() => {
        const imageSrc = track?.artwork as string ?? (albumTrack && getImage(albumTrack));
        return imageSrc;
    }, [track, albumTrack, getImage]);

    const goToAlbum = useCallback(() => {
        if (albumTrack) {
            // Close the Player modal
            navigation.goBack();
            // Navigate to the Music tab, then to the Album
            navigation.navigate('Screens', {
                screen: 'MusicTab',
                params: { screen: 'Album', params: { id: albumTrack.AlbumId } }
            });
        }
    }, [albumTrack, navigation]);

    return (
        <View>
            <Artwork
                src={imageSrc}
                margin={80}
            />
            <Header>{track?.title}</Header>
            <SubHeader onPress={goToAlbum}>{track?.artist}{track?.album && ` — ${track.album}`}</SubHeader>
        </View>
    );
}