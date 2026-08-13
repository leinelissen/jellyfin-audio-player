import React, { useCallback, useRef, useMemo } from 'react';
import Artwork from '@/store/sources/artwork-manager';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAlbumsByAlphabet } from '@/store/albums/hooks';
import Sync from '@/store/sources/sync-manager';
import useSyncAction from '@/utility/useSyncAction';
import TouchableHandler from '@/components/TouchableHandler';
import AlbumImage, { AlbumItem } from './components/AlbumImage';
import AlphabetScroller from '@/components/AlphabetScroller';
import styled from 'styled-components/native';
import useDefaultStyles, { ColoredBlurView } from '@/components/Colors';
import type { Album } from '@/store/albums/types';
import { Text } from '@/components/Typography';
import { ShadowWrapper } from '@/components/Shadow';
import { NavigationProp } from '@/screens/types';
import { SafeFlashList, useNavigationOffsets } from '@/components/SafeNavigatorView';
import { FlashListRef } from '@shopify/flash-list';

const SectionContainer = styled.View`
    justify-content: center;
    padding: 12px 24px;
`;

const SectionText = styled(Text)`
    font-size: 24px;
    font-weight: 400;
`;

const SectionHeading = React.memo(function SectionHeading(props: {
    label: string;
}) {
    const { top } = useNavigationOffsets();
    const { label } = props;

    return (
        <View style={{ paddingTop: top }}>
            <ColoredBlurView>
                <SectionContainer>
                    <SectionText>{label}</SectionText>
                </SectionContainer>
            </ColoredBlurView>
        </View>
    );
});

interface GeneratedAlbumItemProps {
    album: Album;
    imageUrl?: string | null;
    onPress: (album: Album) => void;
}

const HalfOpacity = styled.Text`
    opacity: 0.5;
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
                    <AlbumImage source={imageUrl ? { uri: imageUrl } : undefined} style={[defaultStyles.imageBackground]} />
                </ShadowWrapper>
                <Text numberOfLines={1} style={defaultStyles.text}>{album.name}</Text>
                <HalfOpacity style={defaultStyles.text} numberOfLines={1}>{album.albumArtist}</HalfOpacity>
            </AlbumItem>
        </TouchableHandler>
    );
});

// Each row in the FlashList is either a section-header string or a pair of
// album entities (rendered side-by-side). We bake the album objects into the row
// items so that renderItem never needs to look them up by id.
type SectionRow = { type: 'header'; label: string } | { type: 'row'; albums: Album[] };

const Albums: React.FC = () => {
    const sections = useAlbumsByAlphabet();

    const navigation = useNavigation<NavigationProp>();

    const listRef = useRef<FlashListRef<SectionRow>>(null);

    // Build a flat list of header + row items for FlashList
    const flatData = useMemo<SectionRow[]>(() => {
        const rows: SectionRow[] = [];
        for (const section of sections) {
            if (section.data.length === 0) continue;
            rows.push({ type: 'header', label: section.label });
            // Chunk albums into pairs for the two-column grid
            for (let i = 0; i < section.data.length; i += 2) {
                rows.push({ type: 'row', albums: section.data.slice(i, i + 2) });
            }
        }
        return rows;
    }, [sections]);

    const stickyHeaderIndices = useMemo(
        () => flatData
            .map((item, index) => item.type === 'header' ? index : null)
            .filter((i): i is number => i !== null),
        [flatData]
    );

    const [isLoading, retrieveData] = useSyncAction(Sync.syncAlbums);

    const selectAlbum = useCallback((album: Album) => {
        navigation.navigate('Album', { id: [album.sourceId, album.id] });
    }, [navigation]);

    const selectLetter = useCallback(({ letter }: { letter: string; index: number }) => {
        const index = flatData.findIndex(
            item => item.type === 'header' && item.label === letter
        );
        if (index !== -1) {
            listRef.current?.scrollToIndex({ index, animated: false });
        }
    }, [flatData]);

    const renderItem = useCallback(({ item }: { item: SectionRow }) => {
        if (item.type === 'header') {
            return <SectionHeading label={item.label} />;
        }
        return (
            <View style={{ flexDirection: 'row', marginLeft: 10, marginRight: 10 }}>
                {item.albums.map(album => (
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

    return (
        <>
            <AlphabetScroller onSelect={selectLetter} />
            <SafeFlashList
                data={flatData}
                refreshing={isLoading}
                onRefresh={retrieveData}
                ref={listRef}
                renderItem={renderItem}
                stickyHeaderIndices={stickyHeaderIndices}
                getItemType={item => item.type}
                keyExtractor={(item, index) =>
                    item.type === 'header' ? `header-${item.label}` : `row-${index}`
                }
            />
        </>
    );
};

export default Albums;
