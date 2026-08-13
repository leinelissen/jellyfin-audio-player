import React, { useCallback, useRef, useMemo } from 'react';
import Artwork from '@/store/sources/artwork-manager';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useArtistsByAlphabet } from '@/store/artists/hooks';
import Sync from '@/store/sources/sync-manager';
import useSyncAction from '@/utility/useSyncAction';
import AlbumImage from './components/AlbumImage';
import AlphabetScroller from '@/components/AlphabetScroller';
import styled from 'styled-components/native';
import useDefaultStyles, { ColoredBlurView } from '@/components/Colors';
import { Text } from '@/components/Typography';
import { NavigationProp } from '@/screens/types';
import { SafeFlashList, useNavigationOffsets } from '@/components/SafeNavigatorView';
import { Gap } from '@/components/Utility';
import { FlashListRef } from '@shopify/flash-list';
import type { Artist } from '@/store/artists/types';

const SectionContainer = styled.View`
    justify-content: center;
    padding: 12px 24px;
`;

const SectionText = styled(Text)`
    font-size: 24px;
    font-weight: 400;
`;

const ArtistHeight = 32 + 8 * 2;

const ArtistContainer = styled.Pressable`
    padding: 8px 16px;
    border-radius: 8px;
    height: ${ArtistHeight}px;
    display: flex;
    flex-grow: 1;
    flex-shrink: 1;
    display: flex;
    align-items: center;
    flex-direction: row;
    overflow: hidden;
`;

const SectionHeading = React.memo(function SectionHeading(props: { label: string }) {
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

interface GeneratedArtistItemProps {
    item: Artist;
    imageURL: string | undefined;
    onPress: (artist: Artist) => void;
}

const GeneratedArtistItem = React.memo(function GeneratedArtistItem(props: GeneratedArtistItemProps) {
    const defaultStyles = useDefaultStyles();
    const { item, imageURL, onPress } = props;

    const handlePress = useCallback(() => {
        onPress(item);
    }, [item, onPress]);

    return (
        <ArtistContainer
            onPress={handlePress}
            style={({ pressed }) => [
                { borderColor: defaultStyles.divider.backgroundColor },
                pressed && defaultStyles.activeBackground,
            ]}
        >
            {({ pressed }) => (
                <>
                    <AlbumImage source={{ uri: imageURL }} style={{ height: 32, width: 32, borderRadius: 4, marginBottom: 0 }} />
                    <Gap size={16} />
                    <Text
                        numberOfLines={1}
                        style={[
                            defaultStyles.text,
                            pressed && defaultStyles.themeColor,
                            { flexShrink: 1 }
                        ]}
                    >
                        {item.name}
                    </Text>
                </>
            )}
        </ArtistContainer>
    );
});

type SectionRow =
    | { type: 'header'; label: string }
    | { type: 'row'; artist: Artist };

const Artists: React.FC = () => {
    const sections = useArtistsByAlphabet();

    const navigation = useNavigation<NavigationProp>();

    const listRef = useRef<FlashListRef<SectionRow>>(null);

    const flatData = useMemo<SectionRow[]>(() => {
        const rows: SectionRow[] = [];
        for (const section of sections) {
            if (section.data.length === 0) continue;
            rows.push({ type: 'header', label: section.label });
            for (const artist of section.data) {
                rows.push({ type: 'row', artist });
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

    const [isLoading, retrieveData] = useSyncAction(Sync.syncArtists);

    const selectArtist = useCallback((artist: Artist) => {
        navigation.navigate('Artist', { id: [artist.sourceId, artist.id] });
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
            <View style={{ flexDirection: 'row', marginLeft: 10, marginRight: 32 }}>
                <GeneratedArtistItem
                    item={item.artist}
                    imageURL={Artwork.getUrl(item.artist)}
                    onPress={selectArtist}
                />
            </View>
        );
    }, [selectArtist]);

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

export default Artists;
