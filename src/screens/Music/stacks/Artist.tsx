import React, { useCallback, useMemo } from 'react';
import { chunk } from 'lodash';
import Artwork from '@/store/sources/artwork-manager';
import { View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import styled from 'styled-components/native';
import { useArtist } from '@/store/artists/hooks';
import { useAlbumsByArtist } from '@/store/albums/hooks';
import Sync from '@/store/sources/sync-manager';
import useSyncAction from '@/utility/useSyncAction';
import TouchableHandler from '@/components/TouchableHandler';
import useDefaultStyles from '@/components/Colors';
import type { Album } from '@/store/albums/types';
import { SubHeader, Text } from '@/components/Typography';
import { ShadowWrapper } from '@/components/Shadow';
import { NavigationProp, StackParams } from '@/screens/types';
import { SafeFlatList } from '@/components/SafeNavigatorView';
import CoverImage from '@/components/CoverImage';
import CollapsibleText from '@/components/CollapsibleText';
import { t } from '@/localisation';
import type { EntityId } from '@/store/types';

import AlbumImage, { AlbumItem } from './components/AlbumImage';

interface GeneratedAlbumItemProps {
    album: Album;
    imageUrl: string | undefined;
    onPress: (album: Album) => void;
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
    const { album, imageUrl, onPress } = props;

    const handlePress = useCallback(() => {
        onPress(album);
    }, [album, onPress]);

    return (
        <TouchableHandler id={album.id} onPress={handlePress}>
            <AlbumItem>
                <ShadowWrapper size="medium">
                    <AlbumImage source={{ uri: imageUrl }} style={[defaultStyles.imageBackground]} />
                </ShadowWrapper>
                <Text numberOfLines={1} style={defaultStyles.text}>{album.name}</Text>
                <HalfOpacity style={defaultStyles.text} numberOfLines={1}>{album.albumArtist}</HalfOpacity>
            </AlbumItem>
        </TouchableHandler>
    );
});

export default function Artist() {
    const { params: { id } } = useRoute<RouteProp<StackParams, 'Artist'>>();

    const entityId = useMemo<EntityId>(() => id, [id]);

    const { data: artist } = useArtist(entityId);
    const { data: artistWithAlbums } = useAlbumsByArtist(entityId);
    const albums = artistWithAlbums?.albums ?? [];

    const navigation = useNavigation<NavigationProp>();

    const [isLoading, retrieveData] = useSyncAction(() => Sync.syncAlbums(entityId[0]));

    const selectAlbum = useCallback((album: Album) => {
        navigation.navigate('Album', { id: [album.sourceId, album.id] });
    }, [navigation]);

    const generateItem = useCallback(({ item }: { item: Album[] }) => {
        return (
            <View style={{ flexDirection: 'row', marginLeft: 10, marginRight: 10 }} key={item.map(a => a.id).join('-')}>
                {item.map((album) => (
                    <GeneratedAlbumItem
                        key={album.id}
                        album={album}
                        imageUrl={Artwork.getUrl(album)}
                        onPress={selectAlbum}
                    />
                ))}
            </View>
        );
    }, [selectAlbum]);

    const artistMetadata = useMemo(() => {
        if (!artist?.metadata) return null;
        return artist.metadata as { Overview?: string };
    }, [artist?.metadata]);

    return (
        <SafeFlatList
            ListHeaderComponent={
                <View style={{ padding: 24, paddingTop: 0, paddingBottom: 8 }}>
                    <ArtistImageContainer>
                        <CoverImage src={artist ? Artwork.getUrl(artist) : undefined} margin={48} height={200} />
                    </ArtistImageContainer>
                    {artistMetadata?.Overview ? <CollapsibleText text={artistMetadata.Overview} /> : null}
                    <SubHeader>{t('albums')}</SubHeader>
                </View>
            }
            data={chunk(albums, 2)}
            refreshing={isLoading}
            onRefresh={retrieveData}
            renderItem={generateItem}
        />
    );
}