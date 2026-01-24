import React, { useCallback, useEffect, useMemo } from 'react';
import { chunk } from 'lodash';
import { useGetImage } from '@/utility/JellyfinApi/lib';
import { View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import styled from 'styled-components/native';
import { differenceInDays } from 'date-fns';
import { useAppDispatch, useTypedSelector } from '@/store';
import { fetchAllAlbums } from '@/store/music/actions';
import { ALBUM_CACHE_AMOUNT_OF_DAYS } from '@/CONSTANTS';
import TouchableHandler from '@/components/TouchableHandler';
import useDefaultStyles from '@/components/Colors';
import { Album } from '@/store/music/types';
import { SubHeader, Text } from '@/components/Typography';
import { ShadowWrapper } from '@/components/Shadow';
import { NavigationProp, StackParams } from '@/screens/types';
import { SafeFlatList } from '@/components/SafeNavigatorView';
import CoverImage from '@/components/CoverImage';
import CollapsibleText from '@/components/CollapsibleText';
import { t } from '@/localisation';

import AlbumImage, { AlbumItem } from './components/AlbumImage';

interface GeneratedAlbumItemProps {
    id: string | number;
    imageUrl: string | undefined;
    name: string;
    artist: string;
    onPress: (id: string) => void;
}

const HalfOpacity = styled.Text`
    opacity: 0.5;
`;

const ArtistImageContainer = styled.View`
    margin: 24px;
    flex: 1;
    align-items: center;
`;

const GeneratedAlbumItem = React.memo(function GeneratedAlbumItem(props: GeneratedAlbumItemProps) {
    const defaultStyles = useDefaultStyles();
    const { id, imageUrl, name, artist, onPress } = props;

    return (
        <TouchableHandler id={id as string} onPress={onPress}>
            <AlbumItem>
                <ShadowWrapper size="medium">
                    <AlbumImage source={{ uri: imageUrl }} style={[defaultStyles.imageBackground]} />
                </ShadowWrapper>
                <Text numberOfLines={1} style={defaultStyles.text}>{name}</Text>
                <HalfOpacity style={defaultStyles.text} numberOfLines={1}>{artist}</HalfOpacity>
            </AlbumItem>
        </TouchableHandler>
    );
});


export default function Artist() {
    const { params } = useRoute<RouteProp<StackParams, 'Artist'>>();

    // Retrieve data from store
    const { ids: allAlbumIds, entities: albums } = useTypedSelector((state) => state.music.albums);
    const isLoading = useTypedSelector((state) => state.music.albums.isLoading);
    const lastRefreshed = useTypedSelector((state) => state.music.albums.lastRefreshed);
    const artist = useTypedSelector((state) => state.music.artists.entities[params.id]);

    const albumIds = useMemo(() => {
        return allAlbumIds.filter(id => {
            const album = albums[id];
            return album?.ArtistItems?.find(item => item.Id === params.id);
        });
    }, [allAlbumIds, albums, params.id]);

    // console.log(artist);

    // Initialise helpers
    const dispatch = useAppDispatch();
    const navigation = useNavigation<NavigationProp>();
    const getImage = useGetImage();

    // Set callbacks
    const retrieveData = useCallback(() => {
        dispatch(fetchAllAlbums());
    }, [dispatch]);
    const selectAlbum = useCallback((id: string) => navigation.navigate('Album', { id, album: albums[id] as Album }), [navigation, albums]);
    const generateItem = useCallback(({ item }: { item: string[] }) => {
        return (
            <View style={{ flexDirection: 'row', marginLeft: 10, marginRight: 10 }} key={item.join('-')}>
                {item.map((id) => (
                    <GeneratedAlbumItem
                        key={id}
                        id={id}
                        imageUrl={getImage(albums[id])}
                        name={albums[id]?.Name || ''}
                        artist={albums[id]?.AlbumArtist || ''}
                        onPress={selectAlbum}
                    />
                ))}
            </View>
        );
    }, [albums, getImage, selectAlbum]);

    // Retrieve data on mount
    useEffect(() => { 
        // GUARD: Only refresh this API call every set amounts of days
        if (!lastRefreshed || differenceInDays(lastRefreshed, new Date()) > ALBUM_CACHE_AMOUNT_OF_DAYS) {
            retrieveData(); 
        }
    });

    return (
        <SafeFlatList
            ListHeaderComponent={
                <View style={{ padding: 24, paddingTop: 0, paddingBottom: 8 }}>
                    <ArtistImageContainer>
                        <CoverImage src={getImage(artist)} margin={48} height={200} />
                    </ArtistImageContainer>
                    {artist?.Overview ? <CollapsibleText text={artist.Overview} /> : null}
                    <SubHeader>{t('albums')}</SubHeader>
                </View>
            }
            data={chunk(albumIds, 2)}
            refreshing={isLoading}
            onRefresh={retrieveData}
            renderItem={generateItem}
        />
    );
}
